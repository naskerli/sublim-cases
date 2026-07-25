import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Native modulları server bundle-dan kənarda saxla.
  serverExternalPackages: ["pg", "@prisma/adapter-pg", "stripe"],
};

export default nextConfig;
