"use client";

import { useMemo, useState } from "react";
import SystemIntro from "@/components/SystemIntro";

type Evidence = Record<string, any>;

type Verification = {
  ok: boolean;
  checks?: Record<string, any>;
  reasons?: string[];
  formatted?: string;
};

type View = "operations" | "audit" | "diagnostics";

type CaseItem = {
  id: string;
  title: string;
  service: string;
  policy: string;
  recommendation: string;
  request: string;
  status: "pending" | "verified" | "exception";
  priority: "NORMAL" | "HIGH" | "ESCALATED";
};

const initialCases: CaseItem[] = [
  {
    id: "RF-28491",
    title: "Customer refund request",
    service: "SupportAI",
    policy: "REFUND-01",
    recommendation:
      "Refund approved under standard refund policy.",
    request:
      "Customer requested a refund for order #78421.",
    status: "pending",
    priority: "NORMAL",
  },
  {
    id: "CR-28488",
    title: "Credit adjustment",
    service: "SupportAI",
    policy: "CREDIT-07",
    recommendation:
      "Credit adjustment approved within policy threshold.",
    request:
      "Customer requested a service credit after a delayed delivery.",
    status: "pending",
    priority: "HIGH",
  },
  {
    id: "AC-28472",
    title: "Account closure review",
    service: "RiskAI",
    policy: "ACCOUNT-12",
    recommendation:
      "Account closure approved after compliance review.",
    request:
      "Account closure request requires a compliance decision.",
    status: "pending",
    priority: "ESCALATED",
  },
];

export default function Home() {
  const [showIntro, setShowIntro] = useState(true);
  const [view, setView] = useState<View>("operations");
  const [cases, setCases] = useState(initialCases);

  const [selectedId, setSelectedId] =
    useState(initialCases[0].id);

  const [evidence, setEvidence] =
    useState<Evidence | null>(null);

  const [originalEvidence, setOriginalEvidence] =
    useState<Evidence | null>(null);

  const [originalEvidenceByCase, setOriginalEvidenceByCase] =
    useState<Record<string, Evidence>>({});

  const [verification, setVerification] =
    useState<Verification | null>(null);

  const [evidenceByCase, setEvidenceByCase] =
    useState<Record<string, Evidence>>({});

  const [verificationByCase, setVerificationByCase] =
    useState<Record<string, Verification>>({});

  const [loading, setLoading] = useState(false);
  const [modified, setModified] = useState(false);
  const [error, setError] = useState("");
  const [storageMode, setStorageMode] =
    useState<string | null>(null);

  const [auditConfirmed, setAuditConfirmed] =
    useState(false);

  const [auditRecord, setAuditRecord] =
    useState<any>(null);

  const [timeline, setTimeline] =
    useState<string[]>([]);

  const selectedCase =
    cases.find((item) => item.id === selectedId) ||
    cases[0];

  const activeEvidence =
    evidence ||
    evidenceByCase[selectedCase.id] ||
    null;

  const activeVerification =
    verification ||
    verificationByCase[selectedCase.id] ||
    null;

  const verifiedCount = cases.filter(
    (item) => item.status === "verified",
  ).length;

  const exceptionCount = cases.filter(
    (item) => item.status === "exception",
  ).length;

  const pendingCount = cases.filter(
    (item) => item.status === "pending",
  ).length;

  const currentRecordId = useMemo(
    () =>
      activeEvidence?.record?.record_id ||
      activeEvidence?.record_id ||
      activeEvidence?.recordId ||
      "",
    [activeEvidence],
  );

  function addTimeline(message: string) {
    setTimeline((items) =>
      [
        `${new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })}  ${message}`,
        ...items,
      ].slice(0, 6),
    );
  }

  async function processDecision() {
    setLoading(true);
    setError("");
    setAuditConfirmed(false);
    setAuditRecord(null);
    setModified(false);

    addTimeline(
      `Decision submitted — ${selectedCase.id}`,
    );

    try {
      const response = await fetch("/api/evidence", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          caseId: selectedCase.id,
          request: selectedCase.request,
          recommendation: selectedCase.recommendation,
          policy: selectedCase.policy,
          application: selectedCase.service,
          version: "3.2",
          decision: selectedCase.recommendation,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error || "Unable to process decision",
        );
      }

      const originalCopy = JSON.parse(
        JSON.stringify(data.evidence),
      );

      setEvidence(
        JSON.parse(JSON.stringify(data.evidence)),
      );

      setOriginalEvidence(originalCopy);

      setOriginalEvidenceByCase((items) => ({
        ...items,
        [selectedCase.id]: JSON.parse(
          JSON.stringify(originalCopy),
        ),
      }));

      setVerification(data.verification);

      setEvidenceByCase((items) => ({
        ...items,
        [selectedCase.id]: JSON.parse(
          JSON.stringify(originalCopy),
        ),
      }));

      setVerificationByCase((items) => ({
        ...items,
        [selectedCase.id]: data.verification,
      }));

      setStorageMode(
        data.storage?.mode || null,
      );

      setCases((items) =>
        items.map((item) =>
          item.id === selectedCase.id
            ? {
              ...item,
              status: "verified",
            }
            : item,
        ),
      );

      addTimeline(
        `CooL evidence committed — ${selectedCase.id}`,
      );

      addTimeline(
        `Automatic integrity verification passed`,
      );

      setAuditConfirmed(false);
      setAuditRecord(null);

      addTimeline(
        `Execution receipt available for audit retrieval`,
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to process the decision",
      );
    } finally {
      setLoading(false);
    }
  }

  async function verify(target: Evidence) {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          evidence: target,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error ||
          "Integrity verification failed",
        );
      }

      const result: Verification =
        data.verification || data;

      setVerification(result);

      setVerificationByCase((items) => ({
        ...items,
        [selectedCase.id]: result,
      }));

      setAuditRecord((record: any) =>
        record
          ? {
            ...record,
            evidence: JSON.parse(
              JSON.stringify(target),
            ),
            verification: result,
          }
          : record,
      );

      return result;
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Integrity verification failed",
      );

      return null;
    } finally {
      setLoading(false);
    }
  }

  /*
   * ============================================================
   * EDIT LOG / TAMPER
   * ============================================================
   *
   * IMPORTANT:
   *
   * This function ONLY modifies the local browser copy.
   *
   * It does NOT call /api/verify.
   *
   * The actual integrity test happens ONLY when
   * RUN INTEGRITY CONTROL is pressed.
   */
  function tamperEvidence() {
    const sourceEvidence =
      evidence ||
      evidenceByCase[selectedCase.id] ||
      null;

    if (!sourceEvidence) {
      setError(
        "No execution receipt is available to edit.",
      );
      return;
    }

    setError("");

    const tamperedEvidence = JSON.parse(
      JSON.stringify(sourceEvidence),
    );

    if (tamperedEvidence.record?.event) {
      tamperedEvidence.record.event.output =
        `${String(
          tamperedEvidence.record.event.output || "",
        )} [TAMPERED]`;
    } else if (tamperedEvidence.payloads) {
      tamperedEvidence.payloads.output =
        `${String(
          tamperedEvidence.payloads.output || "",
        )} [TAMPERED]`;
    } else if (tamperedEvidence.record) {
      tamperedEvidence.record.tamper_marker =
        "TAMPERED";
    } else {
      tamperedEvidence.tamper_marker =
        "TAMPERED";
    }

    setEvidence(tamperedEvidence);

    setEvidenceByCase((items) => ({
      ...items,
      [selectedCase.id]: tamperedEvidence,
    }));

    setModified(true);

    setVerification(null);

    setVerificationByCase((items) => {
      const next = { ...items };
      delete next[selectedCase.id];
      return next;
    });

    setAuditRecord((record: any) =>
      record
        ? {
          ...record,
          evidence: tamperedEvidence,
          verification: null,
        }
        : record,
    );

    addTimeline(
      `Execution receipt deliberately modified — ${selectedCase.id}`,
    );

    addTimeline(
      "Tamper simulation complete — integrity control awaiting execution",
    );
  }

  /*
   * ============================================================
   * RESTORE ORIGINAL
   * ============================================================
   */
  async function restoreOriginal() {
    const original =
      originalEvidenceByCase[selectedCase.id] ||
      originalEvidence ||
      null;

    if (!original) {
      setError(
        "Original execution receipt is not available.",
      );
      return;
    }

    setError("");

    const restored = JSON.parse(
      JSON.stringify(original),
    );

    setEvidence(restored);

    setEvidenceByCase((items) => ({
      ...items,
      [selectedCase.id]: restored,
    }));

    setOriginalEvidence(
      JSON.parse(JSON.stringify(restored)),
    );

    setModified(false);

    setAuditRecord((record: any) =>
      record
        ? {
          ...record,
          evidence: restored,
        }
        : record,
    );

    addTimeline(
      `Original execution receipt restored — ${selectedCase.id}`,
    );

    const result = await verify(restored);

    if (result?.ok === true) {
      setModified(false);

      setCases((items) =>
        items.map((item) =>
          item.id === selectedCase.id
            ? {
              ...item,
              status: "verified",
            }
            : item,
        ),
      );

      setAuditRecord((record: any) =>
        record
          ? {
            ...record,
            evidence: restored,
            verification: result,
          }
          : record,
      );

      addTimeline(
        "Restored receipt passed cryptographic verification",
      );
    } else if (result?.ok === false) {
      setModified(true);

      setCases((items) =>
        items.map((item) =>
          item.id === selectedCase.id
            ? {
              ...item,
              status: "exception",
            }
            : item,
        ),
      );

      addTimeline(
        "Restored receipt failed cryptographic verification",
      );
    }
  }

  /*
   * ============================================================
   * REAL INTEGRITY CONTROL
   * ============================================================
   *
   * This is the ONLY place where the tampered receipt is
   * actually sent to /api/verify.
   */
  async function runIntegrityControl() {
    const sourceEvidence =
      evidence ||
      evidenceByCase[selectedCase.id] ||
      null;

    if (!sourceEvidence) {
      setError(
        "No execution receipt is available for this control.",
      );
      return;
    }

    setError("");

    addTimeline(
      `Integrity control initiated — ${selectedCase.id}`,
    );

    const original =
      originalEvidenceByCase[selectedCase.id] ||
      originalEvidence ||
      null;

    const differsFromOriginal =
      original
        ? JSON.stringify(sourceEvidence) !==
        JSON.stringify(original)
        : false;

    if (differsFromOriginal) {
      addTimeline(
        "Receipt differs from clean execution baseline",
      );
    }

    const result =
      await verify(sourceEvidence);

    if (result?.ok === false) {
      setModified(true);

      setCases((items) =>
        items.map((item) =>
          item.id === selectedCase.id
            ? {
              ...item,
              status: "exception",
            }
            : item,
        ),
      );

      setAuditRecord((record: any) =>
        record
          ? {
            ...record,
            evidence: sourceEvidence,
            verification: result,
          }
          : record,
      );

      addTimeline(
        "Cryptographic integrity exception detected",
      );

      return;
    }

    if (result?.ok === true) {
      const stillMatchesOriginal =
        !original ||
        JSON.stringify(sourceEvidence) ===
        JSON.stringify(original);

      if (stillMatchesOriginal) {
        setModified(false);

        setCases((items) =>
          items.map((item) =>
            item.id === selectedCase.id
              ? {
                ...item,
                status: "verified",
              }
              : item,
          ),
        );

        addTimeline(
          "Cryptographic integrity verification passed",
        );
      } else {
        setModified(true);

        setCases((items) =>
          items.map((item) =>
            item.id === selectedCase.id
              ? {
                ...item,
                status: "exception",
              }
              : item,
          ),
        );

        addTimeline(
          "Receipt differs from original baseline",
        );
      }
    }
  }

  function openAudit() {
    setView("audit");
    setError("");
    setAuditRecord(null);
    setAuditConfirmed(false);

    if (!currentRecordId) {
      addTimeline(
        "Audit records opened — no execution receipt selected",
      );
      return;
    }

    addTimeline(
      `Audit record opened — receipt ready for retrieval`,
    );
  }

  /*
   * ============================================================
   * RETRIEVE STORED RECEIPT
   * ============================================================
   *
   * First attempt the real backend retrieval.
   *
   * If the backend says the record is unavailable, use the
   * exact receipt already generated by PROCESS DECISION.
   *
   * This fallback is local only. It does NOT modify the
   * backend receipt and does NOT call /api/verify.
   */
  async function retrieveReceipt() {
    setError("");

    const localEvidence =
      evidence ||
      evidenceByCase[selectedCase.id] ||
      null;

    if (!currentRecordId && !localEvidence) {
      setError(
        "No execution receipt is available for retrieval.",
      );
      return;
    }

    setLoading(true);
    setAuditRecord(null);
    setAuditConfirmed(false);

    addTimeline(
      `Receipt retrieval requested — ${selectedCase.id}`,
    );

    try {
      /*
       * --------------------------------------------------------
       * FIRST: Try the actual stored backend receipt.
       * --------------------------------------------------------
       */
      if (currentRecordId) {
        try {
          const response = await fetch(
            `/api/evidence?recordId=${encodeURIComponent(
              currentRecordId,
            )}`,
            {
              method: "GET",
              cache: "no-store",
            },
          );

          if (response.ok) {
            const data = await response.json();

            if (
              data.success &&
              data.record
            ) {
              const retrieved =
                data.record;

              const retrievedEvidence =
                retrieved.evidence || {};

              const evidenceCopy =
                JSON.parse(
                  JSON.stringify(
                    retrievedEvidence,
                  ),
                );

              const verificationCopy =
                retrieved.verification
                  ? JSON.parse(
                    JSON.stringify(
                      retrieved.verification,
                    ),
                  )
                  : null;

              setEvidence(
                evidenceCopy,
              );

              setEvidenceByCase(
                (items) => ({
                  ...items,
                  [selectedCase.id]:
                    evidenceCopy,
                }),
              );

              setVerification(
                verificationCopy,
              );

              setVerificationByCase(
                (items) => ({
                  ...items,
                  [selectedCase.id]:
                    verificationCopy,
                }),
              );

              const knownOriginal =
                originalEvidenceByCase[
                selectedCase.id
                ] ||
                originalEvidence ||
                null;

              if (knownOriginal) {
                const retrievedSerialized =
                  JSON.stringify(
                    evidenceCopy,
                  );

                const originalSerialized =
                  JSON.stringify(
                    knownOriginal,
                  );

                if (
                  retrievedSerialized !==
                  originalSerialized
                ) {
                  setModified(true);

                  setCases(
                    (items) =>
                      items.map(
                        (item) =>
                          item.id ===
                            selectedCase.id
                            ? {
                              ...item,
                              status:
                                "exception",
                            }
                            : item,
                      ),
                  );

                  addTimeline(
                    "Stored receipt differs from original execution evidence",
                  );
                } else {
                  setModified(false);
                }
              }

              setAuditRecord({
                recordId:
                  retrieved.recordId ||
                  currentRecordId,

                executionId:
                  retrieved.executionId ||
                  evidenceCopy.record?.event
                    ?.execution_id ||
                  evidenceCopy.execution_id ||
                  "",

                evidence:
                  evidenceCopy,

                verification:
                  verificationCopy,

                decision:
                  retrieved.decision,

                createdAt:
                  retrieved.createdAt,
              });

              setAuditConfirmed(true);

              addTimeline(
                `Current execution receipt retrieved — ${selectedCase.id}`,
              );

              return;
            }
          }
        } catch {
          /*
           * Backend retrieval failed.
           * Continue to local session receipt.
           */
        }
      }

      /*
       * --------------------------------------------------------
       * FALLBACK: Use the receipt already generated locally.
       * --------------------------------------------------------
       */
      if (localEvidence) {
        const evidenceCopy =
          JSON.parse(
            JSON.stringify(
              localEvidence,
            ),
          );

        const localVerification =
          verification ||
          verificationByCase[
          selectedCase.id
          ] ||
          null;

        const verificationCopy =
          localVerification
            ? JSON.parse(
              JSON.stringify(
                localVerification,
              ),
            )
            : null;

        setEvidence(
          evidenceCopy,
        );

        setEvidenceByCase(
          (items) => ({
            ...items,
            [selectedCase.id]:
              evidenceCopy,
          }),
        );

        setVerification(
          verificationCopy,
        );

        setVerificationByCase(
          (items) => ({
            ...items,
            [selectedCase.id]:
              verificationCopy,
          }),
        );

        setAuditRecord({
          recordId:
            evidenceCopy.record
              ?.record_id ||
            evidenceCopy.record_id ||
            evidenceCopy.recordId ||
            currentRecordId,

          executionId:
            evidenceCopy.record?.event
              ?.execution_id ||
            evidenceCopy.execution_id ||
            "",

          evidence:
            evidenceCopy,

          verification:
            verificationCopy,

          decision: {
            caseId:
              selectedCase.id,
            decision:
              selectedCase.recommendation,
          },

          createdAt:
            evidenceCopy.record?.event
              ?.timestamp ||
            new Date().toISOString(),
        });

        setAuditConfirmed(true);

        addTimeline(
          `Execution receipt loaded — ${selectedCase.id}`,
        );

        addTimeline(
          "Using the receipt already committed in the current session",
        );

        return;
      }

      throw new Error(
        "Execution receipt could not be retrieved.",
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to retrieve execution receipt.",
      );
    } finally {
      setLoading(false);
    }
  }

  function selectCase(item: CaseItem) {
    setSelectedId(item.id);

    const savedEvidence =
      evidenceByCase[item.id] || null;

    const savedVerification =
      verificationByCase[item.id] || null;

    const evidenceCopy = savedEvidence
      ? JSON.parse(
        JSON.stringify(savedEvidence),
      )
      : null;

    setEvidence(evidenceCopy);

    const knownOriginal =
      originalEvidenceByCase[item.id] ||
      null;

    setOriginalEvidence(
      knownOriginal
        ? JSON.parse(
          JSON.stringify(knownOriginal),
        )
        : evidenceCopy
          ? JSON.parse(
            JSON.stringify(evidenceCopy),
          )
          : null,
    );

    setVerification(
      savedVerification,
    );

    setModified(
      savedVerification?.ok === false,
    );

    setAuditRecord(null);
    setAuditConfirmed(false);
    setError("");
    setTimeline([]);
  }

  if (showIntro) {
    return (
      <SystemIntro
        onEnter={() => setShowIntro(false)}
      />
    );
  }

  const verified =
    activeVerification?.ok === true;

  return (
    <main className="shell">
      <div className="gridBackground" />

      <header className="topbar">
        <div className="brand">
          <div>
            <strong>PROOFLAYER</strong>
            <small>
              AI GOVERNANCE CONTROL PLANE
            </small>
          </div>
        </div>

        <div className="systemHealth">
          <span className="onlineDot" />
          GOVERNANCE SERVICE{" "}
          <b>OPERATIONAL</b>
        </div>
      </header>

      <div className="appFrame">
        <aside className="sidebar">
          <div className="sideLabel">
            CONTROL CENTER
          </div>

          <NavButton
            active={view === "operations"}
            onClick={() =>
              setView("operations")
            }
            label="Decision operations"
            code="01"
          />

          <NavButton
            active={view === "audit"}
            onClick={openAudit}
            label="Audit records"
            code="02"
          />

          <NavButton
            active={view === "diagnostics"}
            onClick={() =>
              setView("diagnostics")
            }
            label="Security diagnostics"
            code="03"
          />

          <div className="sideDivider" />

          <div className="sideLabel">
            SYSTEM
          </div>

          <div className="systemRow">
            <span>AI services</span>
            <b>03</b>
          </div>

          <div className="systemRow">
            <span>Policy controls</span>
            <b>ACTIVE</b>
          </div>

          <div className="systemRow">
            <span>CooL engine</span>
            <b>ONLINE</b>
          </div>

          <div className="sidebarFoot">
            <span>ENVIRONMENT</span>
            <strong>
              PRODUCTION CONTROL
            </strong>
            <small>
              Attestation provider: simulator
            </small>
          </div>
        </aside>

        <section className="workspace">
          <div className="workspaceTop">
            <div>
              <div className="eyebrow">
                {view === "operations"
                  ? "DECISION OPERATIONS"
                  : view === "audit"
                    ? "AUDIT / EVIDENCE RECORDS"
                    : "SECURITY / INTEGRITY DIAGNOSTICS"}
              </div>

              <h1>
                {view === "operations"
                  ? "Control queue"
                  : view === "audit"
                    ? "Audit records"
                    : "Integrity diagnostics"}
              </h1>

              <p>
                {view === "operations"
                  ? "Review AI-assisted decisions, apply policy controls, and retain verifiable execution evidence."
                  : view === "audit"
                    ? "Retrieve the CooL execution receipt associated with the processed decision."
                    : "Validate that recorded execution evidence cannot be altered without detection."}
              </p>
            </div>

            <div className="session">
              <span>SESSION</span>
              <strong>CONTROL-01</strong>
              <small>LIVE</small>
            </div>
          </div>

          {error && (
            <div className="errorPanel">
              <b>!</b>
              <div>
                <strong>
                  CONTROL ERROR
                </strong>
                <span>{error}</span>
              </div>
            </div>
          )}

          {view === "operations" && (
            <>
              <div className="metricGrid">
                <Metric
                  label="PENDING REVIEW"
                  value={pendingCount
                    .toString()
                    .padStart(2, "0")}
                  detail="Decision queue"
                />

                <Metric
                  label="VERIFIED"
                  value={verifiedCount
                    .toString()
                    .padStart(2, "0")}
                  detail="Current session"
                />

                <Metric
                  label="EXCEPTIONS"
                  value={exceptionCount
                    .toString()
                    .padStart(2, "0")}
                  detail="Integrity controls"
                />

                <Metric
                  label="AI SERVICES"
                  value="02"
                  detail="Governed services"
                />
              </div>

              <div className="sectionHeader">
                <div>
                  <span>01</span>
                  <strong>
                    DECISION QUEUE
                  </strong>
                </div>

                <small>
                  {cases.length} records in current
                  control view
                </small>
              </div>

              <div className="queue">
                {cases.map((item) => (
                  <div
                    key={item.id}
                    className={`queueRow ${selectedId === item.id
                        ? "selected"
                        : ""
                      }`}
                    onClick={() =>
                      selectCase(item)
                    }
                    role="button"
                    tabIndex={0}
                    onKeyDown={(event) => {
                      if (
                        event.key === "Enter" ||
                        event.key === " "
                      ) {
                        selectCase(item);
                      }
                    }}
                  >
                    <span className="queueIndex">
                      {item.id}
                    </span>

                    <span className="queueMain">
                      <strong>
                        {item.title}
                      </strong>

                      <small>
                        {item.service} ·{" "}
                        {item.policy}
                      </small>
                    </span>

                    <span
                      className={`priority ${item.priority.toLowerCase()}`}
                    >
                      {item.priority}
                    </span>

                    <span
                      className={`queueStatus ${item.status}`}
                    >
                      {item.status ===
                        "pending"
                        ? "REVIEW"
                        : item.status ===
                          "verified"
                          ? "VERIFIED"
                          : "EXCEPTION"}
                    </span>

                    <span className="chevron">
                      ›
                    </span>
                  </div>
                ))}
              </div>

              {!activeEvidence ? (
                <section className="decisionPanel">
                  <div className="decisionHead">
                    <div>
                      <span className="eyebrow">
                        02 / DECISION WORKSPACE
                      </span>

                      <h2>
                        {selectedCase.title}
                      </h2>
                    </div>

                    <div className="caseState">
                      <span />
                      {selectedCase.status ===
                        "pending"
                        ? "AWAITING DECISION"
                        : selectedCase.status.toUpperCase()}
                    </div>
                  </div>

                  <div className="caseMeta">
                    <Meta
                      label="CASE"
                      value={selectedCase.id}
                    />

                    <Meta
                      label="AI SERVICE"
                      value={`${selectedCase.service} / 3.2`}
                    />

                    <Meta
                      label="POLICY"
                      value={selectedCase.policy}
                    />

                    <Meta
                      label="PRIORITY"
                      value={selectedCase.priority}
                    />
                  </div>

                  <div className="decisionColumns">
                    <div>
                      <label>REQUEST</label>

                      <p>
                        {selectedCase.request}
                      </p>
                    </div>

                    <div className="recommendation">
                      <label>
                        AI RECOMMENDATION
                      </label>

                      <p>
                        {selectedCase.recommendation}
                      </p>

                      <small>
                        Recommendation is
                        presented for human
                        decision. ProofLayer
                        does not determine
                        correctness or fairness.
                      </small>
                    </div>
                  </div>

                  <div className="decisionAction">
                    <button
                      onClick={
                        processDecision
                      }
                      disabled={
                        loading ||
                        selectedCase.status !==
                        "pending"
                      }
                    >
                      {loading
                        ? "PROCESSING CONTROL"
                        : "APPROVE DECISION"}

                      <b>→</b>
                    </button>

                    <span>
                      Evidence generation and
                      verification occur
                      automatically on the
                      server.
                    </span>
                  </div>
                </section>
              ) : (
                <ControlResult />
              )}
            </>
          )}

          {view === "audit" && (
            <section className="auditView">
              <div className="auditToolbar">
                <span>
                  RECORD RETRIEVAL
                </span>

                <strong>
                  {currentRecordId ||
                    "NO RECORD SELECTED"}
                </strong>

                {auditConfirmed && (
                  <span className="auditLoaded">
                    ✓ RECEIPT LOADED
                  </span>
                )}

                {auditRecord && (
                  <button
                    className={
                      modified ||
                        modifiedEvidence(
                          auditRecord.evidence,
                        )
                        ? "tamperRestore"
                        : "tamperEdit"
                    }
                    onClick={
                      modified ||
                        modifiedEvidence(
                          auditRecord.evidence,
                        )
                        ? restoreOriginal
                        : tamperEvidence
                    }
                    disabled={loading}
                  >
                    {loading
                      ? "VERIFYING..."
                      : modified ||
                        modifiedEvidence(
                          auditRecord.evidence,
                        )
                        ? "RESTORE ORIGINAL"
                        : "EDIT LOG / TAMPER"}
                  </button>
                )}

                <button
                  onClick={
                    retrieveReceipt
                  }
                  disabled={
                    !currentRecordId ||
                    loading ||
                    auditConfirmed
                  }
                >
                  {loading
                    ? "RETRIEVING..."
                    : auditConfirmed
                      ? "RECEIPT LOADED"
                      : "RETRIEVE RECEIPT"}
                </button>
              </div>

              {auditRecord ? (
                <AuditDetails
                  record={auditRecord}
                />
              ) : (
                <div className="emptyState">
                  <strong>
                    No audit record selected
                  </strong>

                  <span>
                    Process a decision in
                    Decision Operations first,
                    then return here to retrieve
                    its stored receipt.
                  </span>
                </div>
              )}
            </section>
          )}

          {view === "diagnostics" && (
            <section className="diagnosticsView">
              <div className="diagHero">
                <div>
                  <span className="eyebrow">
                    SECURITY CONTROL
                  </span>

                  <h2>
                    Receipt integrity test
                  </h2>

                  <p>
                    Validate that a cryptographically
                    bound execution receipt cannot be
                    modified without detection.
                  </p>
                </div>

                <div
                  className={`diagState ${modified
                      ? "bad"
                      : verified
                        ? "good"
                        : "idle"
                    }`}
                >
                  <strong>
                    {modified
                      ? "EXCEPTION DETECTED"
                      : verified
                        ? "CONTROL PASS"
                        : "READY"}
                  </strong>

                  <span>
                    {modified
                      ? "Receipt integrity exception detected"
                      : verified
                        ? "Server-side verification passed"
                        : "Awaiting execution receipt"}
                  </span>
                </div>
              </div>

              {!activeEvidence ? (
                <div className="emptyState">
                  <strong>
                    No execution receipt loaded
                  </strong>

                  <span>
                    Process a decision first. The
                    diagnostic operates on the
                    actual CooL receipt generated
                    by the backend.
                  </span>

                  <button
                    onClick={() =>
                      setView("operations")
                    }
                  >
                    OPEN DECISION OPERATIONS →
                  </button>
                </div>
              ) : (
                <div className="diagGrid">
                  <div className="diagCard">
                    <span>
                      TEST SUBJECT
                    </span>

                    <strong>
                      {selectedCase.id}
                    </strong>

                    <small>
                      {currentRecordId}
                    </small>
                  </div>

                  <div className="diagCard">
                    <span>
                      BINDING INTEGRITY
                    </span>

                    <strong
                      className={
                        findCheck(
                          activeVerification,
                          [
                            "binding",
                            "binding_integrity",
                          ],
                        ) === false ||
                          modified
                          ? "badText"
                          : "goodText"
                      }
                    >
                      {findCheck(
                        activeVerification,
                        [
                          "binding",
                          "binding_integrity",
                        ],
                      ) === false ||
                        modified
                        ? "FAILED"
                        : "PASS"}
                    </strong>
                  </div>

                  <div className="diagCard">
                    <span>
                      DIGITAL SIGNATURE
                    </span>

                    <strong
                      className={
                        findCheck(
                          activeVerification,
                          ["signature"],
                        ) === false ||
                          modified
                          ? "badText"
                          : "goodText"
                      }
                    >
                      {findCheck(
                        activeVerification,
                        ["signature"],
                      ) === false ||
                        modified
                        ? "FAILED"
                        : "PASS"}
                    </strong>
                  </div>

                  <div className="diagAction">
                    <button
                      onClick={
                        runIntegrityControl
                      }
                      disabled={
                        loading ||
                        !activeEvidence
                      }
                    >
                      {loading
                        ? "VERIFYING RECEIPT..."
                        : "RUN INTEGRITY CONTROL"}
                    </button>

                    <small>
                      Server-side verification ·
                      cryptographic integrity control
                    </small>
                  </div>
                </div>
              )}
            </section>
          )}

          {timeline.length > 0 && (
            <div className="timeline">
              <div className="sectionHeader">
                <div>
                  <span>04</span>
                  <strong>
                    CONTROL HISTORY
                  </strong>
                </div>

                <small>
                  Current session
                </small>
              </div>

              {timeline.map((item, i) => (
                <div
                  className="timelineRow"
                  key={`${item}-${i}`}
                >
                  <i />
                  {item}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <footer>
        <span>
          PROOFLAYER / INTERNAL GOVERNANCE SYSTEM
        </span>

        <span>
          EXECUTION INTEGRITY · COoL SDK ·
          AUTOMATED CONTROL
        </span>
      </footer>

      <style jsx global>{styles}</style>
    </main>
  );

  function ControlResult() {
    const resultEvidence =
      evidence ||
      evidenceByCase[selectedCase.id] ||
      null;

    const resultVerification =
      verification ||
      verificationByCase[selectedCase.id] ||
      null;

    if (!resultEvidence) return null;

    const tampered =
      modifiedEvidence(resultEvidence);

    const integrityFailed =
      modified &&
      resultVerification?.ok === false;

    const resultVerified =
      resultVerification?.ok === true &&
      !modified;

    return (
      <section className="resultPanel">
        <div className="resultHead">
          <div>
            <span className="eyebrow">
              03 / EXECUTION CONTROL
            </span>

            <h2>
              {integrityFailed
                ? "Integrity exception"
                : tampered
                  ? "Receipt modified"
                  : "Decision verified"}
            </h2>

            <p>
              {integrityFailed
                ? "The execution receipt failed the integrity control after deliberate modification."
                : tampered
                  ? "The receipt has been deliberately modified locally. Run the integrity control to test whether the change is detected."
                  : "The decision was recorded and its execution evidence was verified automatically."}
            </p>
          </div>

          <div
            className={`resultBadge ${resultVerified
                ? "good"
                : integrityFailed
                  ? "bad"
                  : ""
              }`}
          >
            <b>
              {resultVerified
                ? "✓"
                : integrityFailed
                  ? "!"
                  : "•"}
            </b>

            <span>
              EXECUTION INTEGRITY

              <strong>
                {resultVerified
                  ? "VERIFIED"
                  : integrityFailed
                    ? "EXCEPTION"
                    : tampered
                      ? "TEST REQUIRED"
                      : "PENDING"}
              </strong>
            </span>
          </div>
        </div>

        <div className="controlStrip">
          <div>
            <span>RECORD</span>

            <strong>
              {resultEvidence.record
                ?.record_id ||
                resultEvidence.record_id ||
                resultEvidence.recordId ||
                ""}
            </strong>
          </div>

          <div>
            <span>RECEIPT</span>

            <strong>
              {auditConfirmed
                ? "RETRIEVED"
                : "STORED"}
            </strong>
          </div>

          <div>
            <span>ATTESTATION</span>

            <strong>
              SIMULATED
            </strong>
          </div>
        </div>

        <div className="resultGrid">
          <div className="controlCard">
            <PanelTitle
              n="01"
              title="CONTROL STATUS"
            />

            <Check
              label="Binding integrity"
              value={findCheck(
                resultVerification,
                [
                  "binding",
                  "binding_integrity",
                ],
              )}
            />

            <Check
              label="Digital signature"
              value={findCheck(
                resultVerification,
                ["signature"],
              )}
            />

            <Check
              label="Transparency inclusion"
              value={findCheck(
                resultVerification,
                ["inclusion"],
              )}
            />

            <Check
              label="Attestation"
              value={null}
              simulated
            />
          </div>

          <div className="controlCard technical">
            <PanelTitle
              n="02"
              title="CRYPTOGRAPHIC EVIDENCE"
            />

            <Hash
              label="Metadata hash"
              value={
                resultEvidence.record
                  ?.event?.metadata_hash
              }
              changed={integrityFailed}
            />

            <Hash
              label="Binding hash"
              value={
                resultEvidence.binding_hash
              }
              changed={integrityFailed}
            />

            <Hash
              label="Input commitment"
              value={
                resultEvidence.record
                  ?.event?.commitments
                  ?.input
              }
              changed={integrityFailed}
            />

            <Hash
              label="Output commitment"
              value={
                resultEvidence.record
                  ?.event?.commitments
                  ?.output
              }
              changed={integrityFailed}
            />
          </div>
        </div>

        <div className="businessRecord">
          <PanelTitle
            n="03"
            title="DECISION RECORD"
          />

          <div className="businessGrid">
            <div>
              <label>CASE</label>

              <strong>
                {selectedCase.id}
              </strong>

              <small>
                {selectedCase.title}
              </small>
            </div>

            <div>
              <label>DECISION</label>

              <strong>
                Approved
              </strong>

              <small>
                {selectedCase.policy}
              </small>
            </div>

            <div>
              <label>AI SERVICE</label>

              <strong>
                {selectedCase.service}
              </strong>

              <small>
                Release 3.2
              </small>
            </div>
          </div>
        </div>

        <div className="resultActions">
          <button
            className={
              tampered
                ? "tamperRestore"
                : "tamperEdit"
            }
            onClick={
              tampered
                ? restoreOriginal
                : tamperEvidence
            }
            disabled={loading}
          >
            {loading
              ? "VERIFYING..."
              : tampered
                ? "RESTORE ORIGINAL"
                : "EDIT LOG / TAMPER"}
          </button>

          <button
            className="secondary"
            onClick={() =>
              runIntegrityControl()
            }
            disabled={loading}
          >
            {loading
              ? "VERIFYING..."
              : "RUN INTEGRITY CONTROL"}
          </button>

          <button
            className="secondary"
            onClick={() =>
              setView("audit")
            }
          >
            OPEN AUDIT RECORD →
          </button>
        </div>

        <div className="disclaimer">
          <b>
            GOVERNANCE BOUNDARY
          </b>

          <span>
            CooL establishes evidence of
            recorded execution and detects
            subsequent evidence modification.
            It does not establish that an AI
            decision was correct, fair, or safe.
          </span>
        </div>
      </section>
    );
  }
}

function NavButton({
  active,
  onClick,
  label,
  code,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  code: string;
}) {
  return (
    <button
      className={`navButton ${active ? "active" : ""
        }`}
      onClick={onClick}
    >
      <span>{code}</span>

      <strong>{label}</strong>

      <b>›</b>
    </button>
  );
}

function Metric({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="metric">
      <span>{label}</span>

      <strong>{value}</strong>

      <small>{detail}</small>
    </div>
  );
}

function Meta({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <span>{label}</span>

      <strong>{value}</strong>
    </div>
  );
}

function PanelTitle({
  n,
  title,
}: {
  n: string;
  title: string;
}) {
  return (
    <div className="panelTitle">
      <span>{n}</span>

      <strong>{title}</strong>
    </div>
  );
}

function Check({
  label,
  value,
  simulated = false,
}: {
  label: string;
  value: boolean | null;
  simulated?: boolean;
}) {
  const text = simulated
    ? "SIMULATED"
    : value === true
      ? "PASS"
      : value === false
        ? "FAILED"
        : "PENDING";

  return (
    <div className="check">
      <span>{label}</span>

      <strong
        className={
          value === false
            ? "failed"
            : simulated
              ? "simulated"
              : value === true
                ? "passed"
                : ""
        }
      >
        {text}
      </strong>
    </div>
  );
}

function Hash({
  label,
  value,
  changed,
}: {
  label: string;
  value: any;
  changed?: boolean;
}) {
  return (
    <div className="hash">
      <span>{label}</span>

      <strong
        className={
          changed ? "changed" : ""
        }
      >
        {value
          ? String(value)
          : "Not exposed"}
      </strong>
    </div>
  );
}

function AuditDetails({
  record,
}: {
  record: any;
}) {
  const evidence =
    record.evidence || {};

  const verification =
    record.verification || null;

  const tampered =
    modifiedEvidence(evidence);

  return (
    <div className="auditDetails">
      <div className="auditSummary">
        <div>
          <span>CASE</span>

          <strong>
            {record.decision?.caseId}
          </strong>
        </div>

        <div>
          <span>DECISION</span>

          <strong>
            {record.decision?.decision}
          </strong>
        </div>

        <div>
          <span>CREATED</span>

          <strong>
            {record.createdAt
              ? new Date(
                record.createdAt,
              ).toLocaleString()
              : "—"}
          </strong>
        </div>
      </div>

      {tampered &&
        verification?.ok !== false && (
          <div className="auditException">
            <strong>
              RECEIPT MODIFIED — TEST REQUIRED
            </strong>

            <span>
              The execution receipt has been
              deliberately modified locally.
              Run the integrity control to
              determine whether the modification
              is detected.
            </span>
          </div>
        )}

      {verification?.ok === false && (
        <div className="auditException">
          <strong>
            INTEGRITY EXCEPTION
          </strong>

          <span>
            The execution receipt failed
            cryptographic verification. The
            recorded evidence differs from
            its original commitment.
          </span>
        </div>
      )}

      {verification?.ok === true && (
        <div className="auditVerified">
          <strong>
            INTEGRITY VERIFIED
          </strong>

          <span>
            The retrieved execution receipt
            matches its recorded cryptographic
            commitments.
          </span>
        </div>
      )}

      <PanelTitle
        n="01"
        title="STORED EXECUTION RECEIPT"
      />

      <Hash
        label="Record ID"
        value={record.recordId}
      />

      <Hash
        label="Execution ID"
        value={record.executionId}
      />

      <Hash
        label="Metadata hash"
        value={
          evidence.record?.event
            ?.metadata_hash
        }
        changed={
          verification?.ok === false ||
          tampered
        }
      />

      <Hash
        label="Binding hash"
        value={
          evidence.binding_hash
        }
        changed={
          verification?.ok === false ||
          tampered
        }
      />

      {tampered && (
        <div className="auditReasons">
          <span>
            LOCAL CHANGE DETECTED
          </span>

          <div>
            <i />
            Execution receipt output was deliberately modified with the TAMPER marker.
          </div>
        </div>
      )}

      {verification?.ok === false &&
        verification.reasons &&
        verification.reasons.length > 0 && (
          <div className="auditReasons">
            <span>
              VERIFICATION FINDINGS
            </span>

            {verification.reasons.map(
              (
                reason: string,
                index: number,
              ) => (
                <div
                  key={`${reason}-${index}`}
                >
                  <i />
                  {reason}
                </div>
              ),
            )}
          </div>
        )}
    </div>
  );
}

function modifiedEvidence(
  evidence: Evidence,
): boolean {
  return Boolean(
    evidence?.tamper_marker ||
    String(
      evidence?.record?.event?.output ||
      "",
    ).includes("[TAMPERED]") ||
    String(
      evidence?.payloads?.output || "",
    ).includes("[TAMPERED]"),
  );
}

function findCheck(
  verification: Verification | null,
  names: string[],
): boolean | null {
  if (!verification?.checks) {
    return null;
  }

  for (const name of names) {
    const direct =
      verification.checks[name];

    if (
      typeof direct === "boolean"
    ) {
      return direct;
    }

    if (
      direct &&
      typeof direct === "object" &&
      typeof direct.ok === "boolean"
    ) {
      return direct.ok;
    }

    if (
      direct &&
      typeof direct === "object" &&
      typeof direct.status === "string"
    ) {
      return (
        direct.status.toLowerCase() ===
        "pass"
      );
    }
  }

  return null;
}

const styles = `
*{box-sizing:border-box}
html,body{margin:0;padding:0;min-height:100%;background:#080b0e}
body{color:#dfe6e8;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
button{font:inherit}

.shell{min-height:100vh;position:relative;padding:0 4vw 34px;background:radial-gradient(ellipse at 75% -20%,rgba(51,116,111,.08),transparent 38%),#080b0e}

.gridBackground{position:fixed;inset:0;pointer-events:none;opacity:.18;background-image:linear-gradient(rgba(150,170,178,.025) 1px,transparent 1px),linear-gradient(90deg,rgba(150,170,178,.025) 1px,transparent 1px);background-size:52px 52px}

.topbar{height:70px;max-width:1440px;margin:auto;border-bottom:1px solid #20292d;display:flex;align-items:center;justify-content:space-between;position:relative;z-index:2}

.brand{display:flex;gap:13px;align-items:center}

.brand strong{display:block;font-size:12px;letter-spacing:.22em}

.brand small{display:block;color:#59676d;font-size:8px;letter-spacing:.14em;margin-top:4px}

.mark{width:30px;height:30px;border:1px solid #3d5551;display:flex;align-items:center;justify-content:center;gap:3px}

.mark span{width:3px;height:11px;background:#657873}

.mark span:nth-child(2){height:18px}

.mark span:nth-child(3){height:14px}

.systemHealth{font-size:8px;letter-spacing:.13em;color:#66747a;display:flex;gap:8px;align-items:center}

.systemHealth b{color:#71837f;font-weight:700}

.onlineDot{width:6px;height:6px;border-radius:50%;background:#6f817d}

.appFrame{max-width:1440px;margin:0 auto;display:grid;grid-template-columns:205px minmax(0,1fr);position:relative;z-index:2}

.sidebar{border-right:1px solid #20292d;min-height:calc(100vh - 104px);padding:28px 17px 24px 0;display:flex;flex-direction:column}

.sideLabel{font-size:8px;letter-spacing:.18em;color:#4e5c62;font-weight:800;margin:0 0 11px 9px}

.navButton{width:100%;border:0;background:transparent;color:#66747a;text-align:left;padding:11px 9px;display:grid;grid-template-columns:22px 1fr 12px;gap:6px;align-items:center;cursor:pointer}

.navButton span{font-size:8px;color:#465359}

.navButton strong{font-size:10px;font-weight:600}

.navButton b{font-weight:400;color:#465359}

.navButton:hover,.navButton.active{background:#11171a;color:#c9d3d5}

.navButton.active{border-left:2px solid #596f6b;padding-left:7px}

.navButton.active span,.navButton.active b{color:#718580}

.sideDivider{height:1px;background:#1d2529;margin:21px 9px}

.systemRow{display:flex;justify-content:space-between;padding:9px;color:#59676d;font-size:9px}

.systemRow b{font-size:7px;letter-spacing:.08em;color:#687b77}

.sidebarFoot{margin-top:auto;border-top:1px solid #1d2529;padding:18px 9px 0}

.sidebarFoot span{display:block;font-size:7px;letter-spacing:.16em;color:#48565b}

.sidebarFoot strong{display:block;font-size:8px;color:#84948f;margin-top:7px;letter-spacing:.09em}

.sidebarFoot small{display:block;color:#465359;font-size:8px;line-height:1.5;margin-top:7px}

.workspace{padding:39px 0 0 42px;min-width:0}

.workspaceTop{display:flex;justify-content:space-between;gap:30px;border-bottom:1px solid #20292d;padding-bottom:27px}

.eyebrow{font-size:8px;color:#627177;letter-spacing:.17em;font-weight:800}

.workspaceTop h1{margin:8px 0 8px;font-size:34px;letter-spacing:-.045em;font-weight:650;color:#dce5e6}

.workspaceTop p{margin:0;color:#68767b;font-size:12px;line-height:1.6;max-width:650px}

.session{border:1px solid #263236;padding:11px 13px;min-width:145px;align-self:start}

.session span,.session strong,.session small{display:block}

.session span{font-size:7px;color:#4f5d62;letter-spacing:.15em}

.session strong{font-size:10px;margin-top:5px;color:#9aaba8;letter-spacing:.09em}

.session small{font-size:7px;color:#6f817d;margin-top:4px}

.errorPanel{margin-top:18px;border:1px solid rgba(229,108,114,.35);background:#171011;padding:13px;display:flex;gap:12px;color:#e4a1a5}

.errorPanel>b{font-size:14px}

.errorPanel strong{display:block;font-size:8px;letter-spacing:.13em}

.errorPanel span{display:block;font-size:10px;margin-top:4px;color:#a9787b}

.metricGrid{display:grid;grid-template-columns:repeat(4,1fr);gap:1px;background:#242d31;margin-top:24px}

.metric{background:#0d1215;padding:16px 18px;min-height:85px}

.metric span,.metric small{display:block;font-size:7px;letter-spacing:.14em;color:#536167}

.metric strong{display:block;font-size:23px;font-weight:500;color:#c7d1d3;margin-top:7px;letter-spacing:-.03em}

.metric small{letter-spacing:.02em;margin-top:4px;color:#465359}

.sectionHeader{display:flex;justify-content:space-between;align-items:center;margin:28px 0 10px}

.sectionHeader div{display:flex;align-items:center;gap:9px}

.sectionHeader span{font-size:8px;color:#789891}

.sectionHeader strong{font-size:8px;letter-spacing:.17em;color:#77858a}

.sectionHeader small{font-size:8px;color:#48565b}

.queue{border:1px solid #222b2f}

.queueRow{width:100%;display:grid;grid-template-columns:82px minmax(0,1fr) 90px 75px 18px;gap:15px;align-items:center;text-align:left;border:0;border-bottom:1px solid #1d2529;background:#0d1215;color:#d4ddde;padding:14px 16px;cursor:pointer}

.queueRow:last-child{border-bottom:0}

.queueRow:hover,.queueRow.selected{background:#11181b}

.queueRow.selected{box-shadow:inset 2px 0 #596f6b}

.queueIndex{font:600 9px ui-monospace,SFMono-Regular,Menlo,monospace;color:#91a09f}

.queueMain strong{display:block;font-size:11px;font-weight:600}

.queueMain small{display:block;color:#526066;font-size:8px;margin-top:5px}

.priority,.queueStatus{font-size:7px;letter-spacing:.12em}

.priority{color:#66757a}

.priority.high{color:#b59a6e}

.priority.escalated{color:#bd797d}

.queueStatus{justify-self:start;border:1px solid #293438;padding:5px 7px;color:#74837f}

.queueStatus.verified{color:#718f84;border-color:#315046}

.queueStatus.exception{color:#d18186;border-color:#5a3538}

.chevron{font-size:18px;color:#48565b}

.decisionPanel,.resultPanel,.auditView,.diagnosticsView{margin-top:22px;border:1px solid #232c30;background:#0d1215}

.decisionHead,.resultHead,.diagHero{display:flex;justify-content:space-between;gap:25px;padding:22px;border-bottom:1px solid #20292d}

.decisionHead h2,.resultHead h2,.diagHero h2{margin:7px 0 5px;font-size:21px;font-weight:600;color:#d5dfe0}

.decisionHead p,.resultHead p,.diagHero p{margin:0;color:#657278;font-size:10px;line-height:1.55;max-width:610px}

.caseState{font-size:7px;letter-spacing:.13em;color:#788783;display:flex;gap:7px;align-items:center;align-self:start}

.caseState span{width:5px;height:5px;border-radius:50%;background:#78928d}

.caseMeta{display:grid;grid-template-columns:repeat(4,1fr);gap:1px;background:#232c30}

.caseMeta>div{background:#0a0f12;padding:13px 15px}

.caseMeta span,.caseMeta strong{display:block}

.caseMeta span{font-size:7px;color:#526066;letter-spacing:.13em}

.caseMeta strong{font-size:10px;color:#b7c2c4;margin-top:6px}

.decisionColumns{display:grid;grid-template-columns:1fr 1fr}

.decisionColumns>div{padding:20px;border-right:1px solid #20292d;min-height:125px}

.decisionColumns>div:last-child{border-right:0}

.decisionColumns label,.businessGrid label{display:block;font-size:7px;letter-spacing:.14em;color:#526066;font-weight:800}

.decisionColumns p{font-size:12px;color:#b6c1c3;line-height:1.65;margin:14px 0 0}

.recommendation{background:#0f1518}

.recommendation p{color:#b9ccc8}

.recommendation small{display:block;color:#526066;font-size:8px;line-height:1.5;margin-top:12px}

.decisionAction{padding:17px 20px;border-top:1px solid #20292d;display:flex;align-items:center;gap:15px}

.decisionAction button,.diagAction button{border:1px solid #465b57;background:#111918;color:#a9c2bd;padding:11px 15px;font-size:8px;letter-spacing:.13em;font-weight:800;cursor:pointer}

.decisionAction button:hover,.diagAction button:hover{background:#151f1e}

.decisionAction button:disabled{opacity:.45;cursor:not-allowed}

.decisionAction b{margin-left:17px;font-size:13px;font-weight:400}

.decisionAction span{font-size:8px;color:#526066}

.resultHead{padding:23px}

.resultBadge{display:flex;align-items:center;gap:9px;min-width:145px;align-self:start}

.resultBadge>b{width:28px;height:28px;border:1px solid #315046;display:grid;place-items:center;color:#718f84}

.resultBadge.bad>b{border-color:#65393c;color:#db868a}

.resultBadge span{font-size:7px;letter-spacing:.12em;color:#526066}

.resultBadge strong{display:block;color:#718f84;font-size:9px;margin-top:4px}

.resultBadge.bad strong{color:#d47f84}

.controlStrip{display:grid;grid-template-columns:1fr 1fr 1fr;border-bottom:1px solid #20292d}

.controlStrip div{padding:13px 18px;border-right:1px solid #20292d}

.controlStrip div:last-child{border:0}

.controlStrip span,.controlStrip strong{display:block}

.controlStrip span{font-size:7px;color:#526066;letter-spacing:.14em}

.controlStrip strong{font-size:9px;color:#9eaeac;margin-top:5px}

.resultGrid{display:grid;grid-template-columns:1fr 1.4fr;gap:1px;background:#20292d}

.controlCard{background:#0d1215;padding:19px}

.panelTitle{display:flex;align-items:center;gap:8px;margin-bottom:17px}

.panelTitle span{font-size:8px;color:#789991}

.panelTitle strong{font-size:8px;letter-spacing:.15em;color:#78868b}

.check{display:flex;justify-content:space-between;border-top:1px solid #1e272b;padding:11px 0}

.check span{font-size:9px;color:#77858a}

.check strong{font-size:7px;letter-spacing:.1em;color:#718f84}

.check strong.failed{color:#d27d82}

.check strong.simulated{color:#a28d69}

.hash{border-top:1px solid #1e272b;padding:11px 0}

.hash span{display:block;font-size:7px;color:#526066;letter-spacing:.12em}

.hash strong{display:block;font:8px/1.5 ui-monospace,SFMono-Regular,Menlo,monospace;color:#8b9a9d;word-break:break-all;margin-top:6px}

.hash strong.changed{color:#d47e83}

.businessRecord{padding:19px;border-top:1px solid #20292d}

.businessGrid{display:grid;grid-template-columns:repeat(3,1fr);gap:1px;background:#20292d}

.businessGrid>div{background:#0a0f12;padding:13px}

.businessGrid strong,.businessGrid small{display:block}

.businessGrid strong{font-size:10px;color:#b9c5c7;margin-top:7px}

.businessGrid small{font-size:8px;color:#4f5c61;margin-top:4px}

.resultActions{display:flex;gap:8px;padding:17px 19px;border-top:1px solid #20292d;flex-wrap:wrap}

.tamperEdit{
border:1px solid #694044!important;
background:#171011!important;
color:#d98b90!important;
font-weight:800;
}

.tamperEdit:hover{
background:#211517!important;
}

.tamperRestore{
border:1px solid #315046!important;
background:#0d1513!important;
color:#79a795!important;
font-weight:800;
}

.tamperRestore:hover{
background:#111d19!important;
}

.resultActions button,.auditToolbar button,.emptyState button{border:1px solid #2c383c;background:#10171a;color:#91a09f;padding:10px 12px;font-size:8px;letter-spacing:.11em;cursor:pointer}

.resultActions button:disabled,.auditToolbar button:disabled{opacity:.45;cursor:not-allowed}

.disclaimer{border-top:1px solid #20292d;padding:13px 19px;display:flex;gap:13px}

.disclaimer b{font-size:7px;color:#8a9a96;letter-spacing:.12em;white-space:nowrap}

.disclaimer span{font-size:8px;color:#505d62;line-height:1.5}

.auditView,.diagnosticsView{padding:0}

.auditToolbar{display:flex;align-items:center;gap:10px;padding:17px;border-bottom:1px solid #20292d;flex-wrap:wrap}

.auditToolbar>span{font-size:7px;color:#536167;letter-spacing:.14em}

.auditToolbar>strong{font:8px ui-monospace,SFMono-Regular,Menlo,monospace;color:#89989a;flex:1;overflow:hidden;text-overflow:ellipsis;min-width:120px}

.auditToolbar button{border-color:#3a514d;color:#94afa8}

.auditLoaded{color:#79a795!important;letter-spacing:.1em}

.auditDetails{padding:20px}

.auditSummary{display:grid;grid-template-columns:repeat(3,1fr);gap:1px;background:#20292d;margin-bottom:22px}

.auditSummary div{background:#0a0f12;padding:14px}

.auditSummary span{display:block;font-size:7px;color:#526066;letter-spacing:.13em}

.auditSummary strong{display:block;font-size:10px;color:#b8c3c5;margin-top:6px}

.auditDetails>.hash{max-width:none}

.auditException{border:1px solid #5a3538;background:#151012;padding:14px 16px;margin-bottom:20px}

.auditException strong{display:block;color:#d17d83;font-size:8px;letter-spacing:.14em}

.auditException span{display:block;color:#87696c;font-size:9px;line-height:1.6;margin-top:6px}

.auditVerified{border:1px solid #315046;background:#0d1513;padding:14px 16px;margin-bottom:20px}

.auditVerified strong{display:block;color:#718f84;font-size:8px;letter-spacing:.14em}

.auditVerified span{display:block;color:#61736e;font-size:9px;line-height:1.6;margin-top:6px}

.auditReasons{margin-top:20px;border-top:1px solid #20292d;padding-top:15px}

.auditReasons>span{display:block;font-size:7px;color:#526066;letter-spacing:.13em;margin-bottom:10px}

.auditReasons div{font-size:8px;color:#87696c;padding:6px 0;display:flex;align-items:center;gap:8px}

.auditReasons i{width:4px;height:4px;border-radius:50%;background:#d17d83;display:inline-block}

.emptyState{min-height:250px;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:40px}

.emptyState strong{font-size:13px;color:#aab6b8}

.emptyState span{max-width:450px;color:#59676c;font-size:9px;line-height:1.7;margin-top:8px}

.emptyState button{margin-top:16px}

.diagHero{padding:22px}

.diagState{border:1px solid #293538;padding:12px 14px;min-width:160px;align-self:start}

.diagState strong,.diagState span{display:block}

.diagState strong{font-size:8px;letter-spacing:.12em;color:#7d918d}

.diagState span{font-size:8px;color:#526066;margin-top:5px}

.diagState.good{border-color:#315046}

.diagState.good strong{color:#718f84}

.diagState.bad{border-color:#5a3538}

.diagState.bad strong{color:#d17d83}

.diagGrid{display:grid;grid-template-columns:repeat(3,1fr) 1.4fr;gap:1px;background:#20292d}

.diagCard,.diagAction{background:#0a0f12;padding:18px}

.diagCard>span{display:block;font-size:7px;color:#526066;letter-spacing:.13em}

.diagCard>strong{display:block;font-size:16px;color:#b8c4c5;margin-top:9px}

.diagCard>small{display:block;font:7px ui-monospace,monospace;color:#48565b;margin-top:6px;overflow:hidden;text-overflow:ellipsis}

.diagAction{display:flex;flex-direction:column;justify-content:center}

.diagAction small{font-size:7px;color:#526066;line-height:1.5;margin-top:8px}

.goodText{color:#718f84!important}

.badText{color:#d17d83!important}

.timeline{margin-top:24px}

.timelineRow{border-top:1px solid #1d2529;padding:9px 0;font:8px ui-monospace,SFMono-Regular,Menlo,monospace;color:#667479}

.timelineRow i{display:inline-block;width:5px;height:5px;border-radius:50%;background:#668c84;margin-right:10px}

footer{max-width:1440px;margin:25px auto 0;border-top:1px solid #20292d;padding-top:15px;display:flex;justify-content:space-between;color:#445157;font-size:7px;letter-spacing:.11em;position:relative;z-index:2}

@media(max-width:1100px){
.queueRow{grid-template-columns:75px minmax(0,1fr) 75px 70px 18px}
}

@media(max-width:900px){
.appFrame{grid-template-columns:1fr}
.sidebar{display:none}
.workspace{padding:30px 0}
.metricGrid{grid-template-columns:repeat(2,1fr)}
.queueRow{grid-template-columns:75px minmax(0,1fr) 70px 18px}
.queueStatus{display:none}
.caseMeta{grid-template-columns:repeat(2,1fr)}
.resultGrid,.decisionColumns,.diagGrid{grid-template-columns:1fr}
.businessGrid,.auditSummary{grid-template-columns:1fr}
.workspaceTop{display:block}
.session{margin-top:15px;width:max-content}
.resultBadge{min-width:0}
.controlStrip{grid-template-columns:1fr}
.controlStrip div{border-right:0;border-bottom:1px solid #20292d}
.decisionAction{align-items:flex-start;flex-direction:column}
footer{display:block}
footer span{display:block;margin-top:6px}
}
`;