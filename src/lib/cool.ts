/**
 * Server-side CooL SDK singleton.
 *
 * Uses CooL's built-in simulator mode (no attestation.provider set, so it
 * defaults to "local"). This works in Vercel/serverless — no hardware, no
 * sockets, no native modules required.
 *
 * Every receipt is clearly labelled "simulated" and the verifier reports
 * "simulated" (never "pass") on hardware-dependent domains.
 */
import { CooL, verifyEvidence, formatVerdict } from "cool-nwc";

// Singleton instance — reused across requests in the same serverless container.
// Construction does no I/O; the first record() call connects the evidence plane.
const cool = new CooL({
  applicationId: "SupportAI",
});

export { cool, verifyEvidence, formatVerdict };
