import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // CooL SDK is ESM-only; Next.js handles this natively via bundler resolution.
  // No special config needed for serverless/Vercel — CooL's simulator mode
  // requires no hardware, no sockets, and no native modules.
};

export default nextConfig;
