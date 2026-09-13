import { NextRequest, NextResponse } from "next/server";
import { cool, formatVerdict, verifyEvidence } from "@/lib/cool";
import { getEvidence, saveEvidence, type StoredEvidence } from "@/lib/evidence-store";

const DEFAULT_DECISION = {
  caseId: "RF-28491",
  request: "Customer requested a refund for order #78421.",
  recommendation: "Refund approved under standard refund policy.",
  policy: "REFUND-01",
  application: "SupportAI",
  version: "3.2",
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));

    const decision = {
      caseId: String(body.caseId || DEFAULT_DECISION.caseId),
      request: String(body.request || DEFAULT_DECISION.request),
      recommendation: String(
        body.recommendation || DEFAULT_DECISION.recommendation,
      ),
      policy: String(body.policy || DEFAULT_DECISION.policy),
      application: String(body.application || DEFAULT_DECISION.application),
      version: String(body.version || DEFAULT_DECISION.version),
    };

    // This is the real business event. The UI only submits the decision;
    // evidence generation and verification happen entirely on the server.
    const result = await cool.record({
      type: "model.execution",
      metadata: {
        application: decision.application,
        version: decision.version,
        event_type: "corporate.decision",
        case_id: decision.caseId,
        policy: decision.policy,
        decision: String(body.decision || "Decision approved"),
      },
      software: {
        name: decision.application,
        version: decision.version,
        digest: null,
      },
      payloads: {
        input: decision.request,
        output: decision.recommendation,
      },
    });

    // Automatic server-side control. There is deliberately no user-facing
    // Verify button in the normal business workflow.
    const verdict = await verifyEvidence(result.evidence);
    const verdictText = formatVerdict(verdict);

    if (!verdict.ok) {
      return NextResponse.json(
        {
          success: false,
          error: "CooL generated an evidence receipt that did not pass verification.",
          verification: {
            ok: verdict.ok,
            checks: verdict.checks,
            reasons: verdict.reasons,
            formatted: verdictText,
          },
        },
        { status: 500 },
      );
    }

    const stored: StoredEvidence = {
      recordId: result.recordId,
      executionId: result.executionId,
      evidence: result.evidence as unknown as Record<string, unknown>,
      verification: {
        ok: verdict.ok,
        checks: verdict.checks,
        reasons: verdict.reasons,
        formatted: verdictText,
      },
      decision: {
        ...decision,
        decision: String(body.decision || "Decision approved"),
      },
      createdAt: new Date().toISOString(),
    };

    const storage = await saveEvidence(stored);

    return NextResponse.json({
      success: true,
      recordId: result.recordId,
      executionId: result.executionId,
      evidence: result.evidence,
      verification: stored.verification,
      decision: stored.decision,
      storage,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  const recordId = request.nextUrl.searchParams.get("recordId");

  if (!recordId) {
    return NextResponse.json(
      { success: false, error: "recordId is required." },
      { status: 400 },
    );
  }

  const record = await getEvidence(recordId);

  if (!record) {
    return NextResponse.json(
      { success: false, error: "Evidence record not found." },
      { status: 404 },
    );
  }

  return NextResponse.json({ success: true, record });
}

