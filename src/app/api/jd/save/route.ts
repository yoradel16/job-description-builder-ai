import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, title, intakeData, analysis, isFinalized, finalizedAt } =
      body;

    if (!userId || !title || !intakeData || !analysis) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const savedAnalysis = await prisma.savedAnalysis.create({
      data: {
        userId,
        title,
        intakeData,
        analysis,
        isFinalized: isFinalized ?? false,
        finalizedAt: finalizedAt ? new Date(finalizedAt) : null,
      },
    });

    return NextResponse.json({ success: true, savedAnalysis });
  } catch (err) {
    console.error("Error saving analysis", err);
    return NextResponse.json(
      { error: "Failed to save analysis." },
      { status: 500 }
    );
  }
}
