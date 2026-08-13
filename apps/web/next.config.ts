import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  transpilePackages: [
    "@genusns/genome-visuals",
    "@genusns/ui-tokens",
    "@genusns/pipeline",
    "@genusns/rights",
  ],
  serverExternalPackages: ["sharp"],
  reactStrictMode: true,
};

export default nextConfig;
