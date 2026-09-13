import { NextResponse } from "next/server";
import { getEvidence } from "@/lib/evidence-store";

export async function GET(
  _request: Request,
  context: { params: Promise<{ recordId: string }> },
) {
  const { recordId } = await context.params;
  const record = await getEvidence(recordId);

  if (!record) {
    return NextResponse.json(
      { success: false, error: "Evidence record not found." },
      { status: 404 },
    );
  }

  return NextResponse.json({ success: true, record });
}
