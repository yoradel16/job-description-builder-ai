import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { prisma } from "@/lib/prisma";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface RefineRequestBody {
  userId: string;
  analysisId?: string;
  message: string;
}

export async function POST(req: NextRequest) {
  try {
    const { userId, message, analysisId }: RefineRequestBody = await req.json();

    if (!message?.trim() || !userId || !analysisId) {
      return NextResponse.json(
        {
          success: false,
          error: "Message is required",
        },
        { status: 400 }
      );
    }

    const savedAnalysis = await prisma.savedAnalysis.findFirst({
      where: {
        userId,
        ...(analysisId ? { id: analysisId } : {}),
        ...(analysisId ? {} : { isFinalized: false }),
      },
      include: {
        refinements: {
          orderBy: { sequenceNumber: "asc" },
        },
      },
      orderBy: analysisId ? undefined : { createdAt: "desc" },
    });

    if (!savedAnalysis) {
      return NextResponse.json(
        { success: false, error: "Analysis not found" },
        { status: 404 }
      );
    }

    // if (savedAnalysis.isFinalized) {
    //   return NextResponse.json(
    //     { success: false, error: "Cannot refine a finalized analysis" },
    //     { status: 400 }
    //   );
    // }

    // 2. Build conversation context for AI
    const conversationHistory = [
      {
        role: "system" as const,
        content: buildSystemPrompt(
          savedAnalysis.analysis,
          savedAnalysis.intakeData
        ),
      },
      // Add all previous refinement messages for full context
      ...savedAnalysis.refinements.map((msg) => ({
        role: msg.role as "user" | "assistant",
        content: msg.content,
      })),
      // Add new user message
      {
        role: "user" as const,
        content: message,
      },
    ];

    // 3. Call OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: conversationHistory,
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 4000,
    });

    const responseText = completion.choices[0].message.content;
    if (!responseText) {
      throw new Error("No response from OpenAI");
    }

    const updatedAnalysis = JSON.parse(responseText);

    // 4. Detect what changed
    const changedSections = identifyChanges(
      savedAnalysis.analysis,
      updatedAnalysis
    );

    // 5. Generate change summary
    const changeSummary = generateChangeSummary(changedSections);

    // 6. Get next sequence number
    const nextSequence = savedAnalysis.refinements.length + 1;

    // 7. Save both messages (user + assistant) + update analysis in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Save user message
      await tx.refinementMessage.create({
        data: {
          analysisId: savedAnalysis.id,
          role: "user",
          content: message,
          changedSections: [],
          sequenceNumber: nextSequence,
          analysisSnapshot: savedAnalysis.analysis as any,
        },
      });

      // Save assistant message
      await tx.refinementMessage.create({
        data: {
          analysisId: savedAnalysis.id,
          role: "assistant",
          content: responseText,
          changedSections,
          sequenceNumber: nextSequence + 1,
          analysisSnapshot: updatedAnalysis as any,
        },
      });

      // Update SavedAnalysis with latest state
      const updated = await tx.savedAnalysis.update({
        where: { id: savedAnalysis.id },
        data: {
          analysis: updatedAnalysis,
          updatedAt: new Date(),
        },
        include: {
          refinements: {
            orderBy: { sequenceNumber: "asc" },
          },
        },
      });

      return updated;
    });

    return NextResponse.json({
      success: true,
      data: {
        messages: result.refinements,
        updatedAnalysis: result.analysis,
        changedSections,
        changedSectionNames: changeSummary.sections,
        summary: changeSummary.summary,
        timestamp: result.updatedAt.toISOString(),
        tokensUsed: completion.usage?.total_tokens || 0,
      },
    });
  } catch (error) {
    console.error("Refinement error:", error);
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Failed to refine job description";
    return NextResponse.json(
      {
        success: false,
        error: "Failed to refine analysis",
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}

function buildSystemPrompt(currentAnalysis: any, intakeData: any): string {
  return `You are an expert job description refinement assistant for Level 9 Virtual. You help refine job descriptions based on conversational feedback.

# Current Analysis State
${JSON.stringify(currentAnalysis, null, 2)}

# Original Intake Data (for reference)
${JSON.stringify(intakeData, null, 2)}

# Your Role
- Listen to the user's refinement requests in natural conversation
- Make ONLY the changes they request
- Maintain all other content exactly as is
- Ensure changes are consistent across related sections
- Return the COMPLETE updated analysis as valid JSON

# Rules for Changes
1. **Removal requests**: If user says "remove X" or "don't need X", remove ALL references from:
   - responsibilities
   - skills
   - tools
   - sample_week
   - kpis (if relevant)

2. **Optional/Nice-to-have**: If user says "make X optional" or "nice to have", update language:
   - Example: "Proficient in X (nice to have)"
   - Example: "Bonus: Experience with X"

3. **Emphasis changes**: If user says "focus more on Y", increase prominence of Y in:
   - core_outcomes
   - responsibilities
   - skills
   - sample_week

4. **Additions**: If user says "add Z", integrate it naturally into relevant sections

5. **Hour/service changes**: If user changes hours or service type, update:
   - roles[].hours_per_week
   - split_table[].hrs
   - service_recommendation if needed

6. **Maintain consistency**: Changes should cascade logically
   - If responsibilities change, skills might need adjustment
   - If tools are removed, remove them from sample_week too
   - Keep personality traits aligned with the actual role duties

# Response Format
Return ONLY valid JSON in this exact structure:
{
  "what_you_told_us": "...",
  "roles": [...],
  "split_table": [...],
  "service_recommendation": {...},
  "onboarding_2w": {...},
  "risks": [...],
  "assumptions": [...]
}

# Conversation Style
- Be conversational and helpful in acknowledging changes
- Explain what you're changing and why
- Ask clarifying questions if the request is ambiguous
- But always return the complete JSON structure

CRITICAL: Return the COMPLETE analysis JSON. Do not truncate any sections.`;
}

// Identify what changed between old and new analysis
function identifyChanges(oldAnalysis: any, newAnalysis: any): string[] {
  const changes: string[] = [];

  const compareObjects = (obj1: any, obj2: any, path = "") => {
    // Handle null/undefined
    if (obj1 === obj2) return;
    if (
      obj1 === null ||
      obj1 === undefined ||
      obj2 === null ||
      obj2 === undefined
    ) {
      if (obj1 !== obj2 && path) {
        changes.push(path);
      }
      return;
    }

    // Handle arrays
    if (Array.isArray(obj2)) {
      if (
        !Array.isArray(obj1) ||
        JSON.stringify(obj1) !== JSON.stringify(obj2)
      ) {
        changes.push(path);
      }
      return;
    }

    // Handle objects
    if (typeof obj2 === "object") {
      for (const key in obj2) {
        const currentPath = path ? `${path}.${key}` : key;
        compareObjects(obj1?.[key], obj2[key], currentPath);
      }
      return;
    }

    // Handle primitives
    if (obj1 !== obj2 && path) {
      changes.push(path);
    }
  };

  compareObjects(oldAnalysis, newAnalysis);

  // Deduplicate parent paths (if "roles.0.skills" changed, don't also list "roles.0.skills.0")
  return deduplicatePaths(changes);
}

// Remove child paths if parent path is already included
function deduplicatePaths(paths: string[]): string[] {
  const sorted = [...paths].sort((a, b) => a.length - b.length);
  const deduplicated: string[] = [];

  for (const path of sorted) {
    const hasParent = deduplicated.some((parent) =>
      path.startsWith(parent + ".")
    );
    if (!hasParent) {
      deduplicated.push(path);
    }
  }

  return deduplicated;
}

// Generate a human-readable summary of changes
function generateChangeSummary(changedSections: string[]): {
  sections: string[];
  summary: string;
} {
  if (changedSections.length === 0) {
    return {
      sections: [],
      summary: "No changes were made to the analysis.",
    };
  }

  // Group changes by major section
  const sectionGroups: Record<string, string[]> = {};

  changedSections.forEach((path) => {
    const topLevel = path.split(".")[0];
    if (!sectionGroups[topLevel]) {
      sectionGroups[topLevel] = [];
    }
    sectionGroups[topLevel].push(path);
  });

  // Convert section names to human-readable format
  const sections = Object.keys(sectionGroups).map((section) => {
    return section.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  });

  const summaries = Object.entries(sectionGroups).map(([section, paths]) => {
    const humanSection = section
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());

    if (paths.length === 1) {
      return `• **${humanSection}**: Updated`;
    }
    return `• **${humanSection}**: ${paths.length} changes made`;
  });

  return {
    sections,
    summary: `These sections had been updated: ${
      Object.keys(sectionGroups).length
    } section${
      Object.keys(sectionGroups).length > 1 ? "s" : ""
    } based on your feedback:\n\n${summaries.join("\n")}`,
  };
}
