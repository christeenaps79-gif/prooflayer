# ProofLayer — AI Governance Control Plane

ProofLayer is an enterprise AI governance prototype that creates independently verifiable evidence for important AI-assisted business decisions.

> **Proof for every important AI action.**

## The problem

Enterprise AI decisions are often surrounded by ordinary application logs. Those logs can be changed, deleted, or disputed after the fact. A timestamp or database row records what a system says happened; it does not by itself provide tamper-evident evidence of the recorded execution.

ProofLayer adds a cryptographic evidence layer to an AI governance workflow so an auditor can later verify whether the recorded execution evidence is still intact.

## What the prototype does

The core workflow is:

```text
Business case
    ↓
AI recommendation
    ↓
Policy / operational decision
    ↓
ProofLayer records execution with CooL
    ↓
Cryptographic evidence receipt
    ↓
Automatic verification
    ↓
Audit record
```

The security diagnostic demonstrates the reverse path:

```text
Verified receipt
    ↓
Receipt metadata is altered
    ↓
CooL verification
    ↓
Binding integrity FAILED
Digital signature FAILED
    ↓
INTEGRITY EXCEPTION
```

Restoring the original receipt returns verification to a valid state.

## Why CooL matters

CooL is the cryptographic evidence layer inside ProofLayer. It is not the governance dashboard itself.

ProofLayer uses the CooL SDK directly on the server:

- `cool.record(...)` creates the self-contained evidence receipt.
- `verifyEvidence(...)` independently checks the receipt.
- Input/output values are represented through commitments rather than being exposed as plaintext evidence fields.
- The receipt contains integrity and signature information that allows later verification.
- The prototype exposes the resulting evidence through the audit and security-diagnostic views.

The application therefore turns CooL's evidence primitives into an enterprise governance workflow rather than presenting CooL as a standalone demo.

## Architecture

```text
┌───────────────────────────────┐
│ Next.js Control Plane         │
│ Decision Operations           │
│ Audit Records                 │
│ Security Diagnostics          │
└──────────────┬────────────────┘
               │
               ▼
┌───────────────────────────────┐
│ Next.js Server API            │
│ POST /api/evidence            │
│ GET  /api/evidence            │
│ GET  /api/evidence/:recordId  │
│ POST /api/verify              │
└──────────────┬────────────────┘
               │
               ▼
┌───────────────────────────────┐
│ CooL SDK (cool-nwc)           │
│ record() → evidence receipt   │
│ verifyEvidence() → verdict    │
└──────────────┬────────────────┘
               │
               ▼
┌───────────────────────────────┐
│ Evidence Store                │
│ Local filesystem / runtime    │
│ memory fallback               │
└───────────────────────────────┘
```

## Repository structure

```text
src/
├── app/
│   ├── api/
│   │   ├── evidence/             # Create/retrieve evidence
│   │   └── verify/               # Server-side CooL verification
│   ├── page.tsx                  # Governance control plane
│   └── layout.tsx
├── components/
│   ├── ParticleSwarm.ts          # Intro visual system
│   └── SystemIntro.tsx
└── lib/
    ├── cool.ts                   # CooL SDK initialization/export
    └── evidence-store.ts         # Prototype evidence persistence
```

## Run locally

Requirements:

- Node.js 20+
- npm

Install dependencies:

```bash
npm install
```

Check TypeScript:

```bash
npm run typecheck
```

Build:

```bash
npm run build
```

Run:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Demo flow

1. Enter the ProofLayer control plane.
2. Select a decision case.
3. Approve/process the decision.
4. ProofLayer calls CooL and automatically verifies the returned receipt.
5. Open the audit record to inspect the stored receipt.
6. Open Security Diagnostics.
7. Run **Simulate Record Alteration**.
8. Show the resulting integrity exception.
9. Restore the verified receipt.

### The key demo statement

> “The business decision is not being re-decided here. ProofLayer is checking whether the evidence of the recorded execution has been altered.”

## Important boundary

CooL establishes evidence about the recorded execution and detects subsequent modification of that evidence. It does **not** establish that an AI recommendation or business decision was correct, fair, unbiased, or safe.

This prototype also uses CooL's simulated attestation path, which is explicitly shown in the UI. A production deployment would connect an appropriate real attestation provider.

## Persistence limitation

The prototype's evidence store is intentionally lightweight for the hackathon. Locally it writes evidence to `.data/evidence` and keeps an in-memory fallback. Serverless filesystem storage should not be treated as durable production persistence on Vercel.

For a production deployment, replace the prototype store with a managed persistent store such as private object storage or a database while retaining the same `saveEvidence()` / `getEvidence()` interface.

## Security design decisions

- CooL operations run server-side rather than exposing signing/verification logic as a browser-only operation.
- Evidence is verified automatically immediately after creation.
- The tamper demonstration changes the evidence object itself and sends that altered object back through the same verification API.
- The UI does not claim that cryptographic integrity equals AI correctness.
- Attestation is visibly labeled as simulated instead of being presented as hardware-backed production attestation.

## Future work

- Durable managed evidence storage for production deployments.
- Authentication and role-based access control.
- Policy-engine integration for real enterprise policies.
- Real model/version registry and deployment identity.
- Production attestation provider integration.
- Immutable audit retention and export workflows.
- SIEM/GRC integration and alerting for integrity exceptions.

## License

Prototype created for hackathon evaluation.
