import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Treat Prisma as external package to prevent Turbopack bundling issues
  serverExternalPackages: ['@prisma/client', '@prisma/engines'],
};

export default nextConfig;
