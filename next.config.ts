import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  eslint: {
    // Advertir pero no fallar el build por errores de ESLint
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Advertir pero no fallar el build por errores de TypeScript
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
