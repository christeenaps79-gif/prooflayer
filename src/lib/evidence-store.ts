import fs from "node:fs/promises";
import path from "node:path";

export type StoredEvidence = {
  recordId: string;
  executionId: string;
  evidence: Record<string, unknown>;
  verification: Record<string, unknown>;
  decision: {
    caseId: string;
    request: string;
    recommendation: string;
    decision: string;
    policy: string;
    application: string;
    version: string;
  };
  createdAt: string;
};

const memoryStore = new Map<string, StoredEvidence>();

function storageDir() {
  return path.join(process.cwd(), ".data", "evidence");
}

function storageFile(recordId: string) {
  return path.join(storageDir(), `${recordId}.json`);
}

/**
 * Local durable store for development/demo runs.
 *
 * CooL remains the cryptographic evidence authority. This store is only the
 * application's retrieval layer so an audit screen can fetch a receipt later.
 * On serverless platforms the filesystem is ephemeral, so callers must treat
 * this as a runtime persistence layer unless an external store is configured.
 */
export async function saveEvidence(record: StoredEvidence) {
  memoryStore.set(record.recordId, record);

  try {
    await fs.mkdir(storageDir(), { recursive: true });
    const target = storageFile(record.recordId);
    const temp = `${target}.tmp`;
    await fs.writeFile(temp, JSON.stringify(record, null, 2), "utf8");
    await fs.rename(temp, target);
    return { stored: true, mode: "filesystem" as const };
  } catch {
    return { stored: true, mode: "runtime" as const };
  }
}

export async function getEvidence(recordId: string) {
  const cached = memoryStore.get(recordId);
  if (cached) return cached;

  try {
    const text = await fs.readFile(storageFile(recordId), "utf8");
    const record = JSON.parse(text) as StoredEvidence;
    memoryStore.set(recordId, record);
    return record;
  } catch {
    return null;
  }
}
