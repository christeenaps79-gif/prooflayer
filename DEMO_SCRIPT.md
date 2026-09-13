# ProofLayer — 2-minute judge demo

## 0:00 — Problem

“Enterprise AI decisions generate logs, but ordinary logs are not strong evidence if someone later changes or disputes them. ProofLayer adds cryptographic evidence to important AI-assisted decisions.”

## 0:20 — Product

“This is the governance control plane. A normal business decision enters the workflow; evidence creation happens automatically in the backend.”

## 0:35 — Live decision

Select **Customer refund request** and click **Approve decision**.

Point to:

- EXECUTION INTEGRITY — VERIFIED
- Binding integrity — PASS
- Digital signature — PASS
- Transparency inclusion — PASS
- Cryptographic evidence hashes

Say:

“CooL created the evidence receipt and ProofLayer immediately verified it.”

## 1:00 — Audit

Open the audit record.

Say:

“The receipt can be retrieved independently from the business decision view.”

## 1:15 — Tamper test

Open Security Diagnostics and click **Simulate Record Alteration**.

Say:

“I'll now change the evidence after the execution has already been recorded.”

Point to:

- INTEGRITY EXCEPTION
- Binding integrity — FAILED
- Digital signature — FAILED

Say:

“The business decision did not change. The evidence did. The verification layer detected the alteration.”

## 1:40 — Restore

Click **Restore Verified Receipt**.

Say:

“The original receipt verifies again.”

## 1:50 — CooL role

“CooL is the cryptographic evidence layer. ProofLayer is the governance control plane that puts that capability into an enterprise decision and audit workflow.”

## Final boundary

“Cryptographic verification proves integrity of the recorded execution evidence. It does not claim that the AI decision itself is correct, fair, or safe.”
