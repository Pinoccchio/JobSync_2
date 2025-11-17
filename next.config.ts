import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Disable ESLint during builds to prevent deployment failures on Vercel
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Disable TypeScript errors during builds to prevent deployment failures on Vercel
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
