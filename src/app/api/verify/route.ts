import { NextRequest, NextResponse } from "next/server";
import { formatVerdict, verifyEvidence } from "@/lib/cool";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const evidence = body.evidence ?? body;

    if (!evidence || typeof evidence !== "object") {
      return NextResponse.json(
        { success: false, error: "Request body must contain a CooL evidence object." },
        { status: 400 },
      );
    }

    const verdict = await verifyEvidence(evidence);
    const verdictText = formatVerdict(verdict);

    return NextResponse.json({
      success: true,
      ok: verdict.ok,
      checks: verdict.checks,
      reasons: verdict.reasons,
      subject: verdict.subject,
      formatted: verdictText,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}
