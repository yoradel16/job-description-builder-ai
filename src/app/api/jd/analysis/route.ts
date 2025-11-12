import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: "userId is required",
        },
        { status: 400 }
      );
    }

    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const finalizedParam = searchParams.get("finalized");
    const search = searchParams.get("search");

    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {
      userId,
    };

    if (finalizedParam !== null && finalizedParam !== undefined) {
      where.isFinalized =
        finalizedParam === null ? true : finalizedParam === "true";
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        {
          intakeData: {
            path: ["companyName"],
            string_contains: search,
          },
        },
      ];
    }

    const [analyses, total] = await Promise.all([
      prisma.savedAnalysis.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          title: true,
          isFinalized: true,
          finalizedAt: true,
          createdAt: true,
          updatedAt: true,
          intakeData: true,
          analysis: true,
          _count: {
            select: {
              refinements: true,
            },
          },
        },
      }),
      prisma.savedAnalysis.count({ where }),
    ]);

    const formattedAnalyses = analyses.map((analysis) => {
      const analysisData = analysis.analysis as any;
      const intakeData = analysis.intakeData as any;

      return {
        id: analysis.id,
        title: analysis.title,
        isFinalized: analysis.isFinalized,
        finalizedAt: analysis.finalizedAt,
        createdAt: analysis.createdAt,
        updatedAt: analysis.updatedAt,
        refinementCount: analysis._count.refinements,

        // Intake Data
        intakeData: {
          companyName: intakeData?.companyName || "",
          website: intakeData?.website || "",
          businessGoal: intakeData?.businessGoal || "",
          outcome90Day: intakeData?.outcome90Day || "",
          weeklyHours: intakeData?.weeklyHours || "",
          budgetBand: intakeData?.budgetBand || "",
          timezone: intakeData?.timezone || "",
          dailyOverlap: intakeData?.dailyOverlap || "",
          clientFacing: intakeData?.clientFacing || "",
          englishLevel: intakeData?.englishLevel || "",
          managementStyle: intakeData?.managementStyle || "",
          reportingExpectations: intakeData?.reportingExpectations || "",
          tools: intakeData?.tools || "",
          tasks: intakeData?.tasks || [],
          requirements: intakeData?.requirements || [],
          niceToHaveSkills: intakeData?.niceToHaveSkills || "",
          dealBreakers: intakeData?.dealBreakers || "",
          securityNeeds: intakeData?.securityNeeds || "",
          existingSOPs: intakeData?.existingSOPs || "",
          roleSplit: intakeData?.roleSplit || "",
          examplesURL: intakeData?.examplesURL || "",
        },

        // Preview Data
        preview: {
          recommended_role:
            analysisData?.preview?.recommended_role || "Unknown",
          service_mapping: analysisData?.preview?.service_mapping || "Unknown",
          weekly_hours: analysisData?.preview?.weekly_hours || 0,
          primary_outcome: analysisData?.preview?.primary_outcome || "",
          role_purpose: analysisData?.preview?.role_purpose || "",
          client_facing: analysisData?.preview?.client_facing ?? false,
          summary: analysisData?.preview?.summary || "",
          key_tools: analysisData?.preview?.key_tools || [],
          core_outcomes: analysisData?.preview?.core_outcomes || [],
          kpis: analysisData?.preview?.kpis || [],
          risks: analysisData?.preview?.risks || [],
        },

        // AI Analysis Data
        ai_analysis: {
          roles: analysisData?.ai_analysis?.roles || [],
          risks: analysisData?.ai_analysis?.risks || [],
          assumptions: analysisData?.ai_analysis?.assumptions || [],
          split_table: analysisData?.ai_analysis?.split_table || [],
          onboarding_2w: analysisData?.ai_analysis?.onboarding_2w || {},
          what_you_told_us: analysisData?.ai_analysis?.what_you_told_us || "",
          service_recommendation: {
            best_fit:
              analysisData?.ai_analysis?.service_recommendation?.best_fit || "",
            why: analysisData?.ai_analysis?.service_recommendation?.why || "",
            cost_framing:
              analysisData?.ai_analysis?.service_recommendation?.cost_framing ||
              "",
            next_steps:
              analysisData?.ai_analysis?.service_recommendation?.next_steps ||
              [],
          },
        },

        // Classification Data
        classification: {
          crafts: analysisData?.classification?.crafts || [],
          split_logic: analysisData?.classification?.split_logic || {},
          service_mapping: analysisData?.classification?.service_mapping || {},
        },
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        analyses: formattedAnalyses,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasMore: skip + analyses.length < total,
        },
      },
    });
  } catch (error) {
    console.error("List analyses error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to load analyses",
      },
      { status: 500 }
    );
  }
}
