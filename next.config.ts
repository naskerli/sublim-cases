import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Native modulları server bundle-dan kənarda saxla.
  serverExternalPackages: [
    "better-sqlite3",
    "@prisma/adapter-better-sqlite3",
    "stripe",
  ],
};

export default nextConfig;
