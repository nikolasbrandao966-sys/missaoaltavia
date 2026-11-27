import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  allowedDevOrigins: ["preview-chat-369bd77a-7325-4ed8-a705-ae864b5e852a.space-z.ai"],
  // Inclui o banco SQLite no pacote de deploy (necessário em hospedagens como Vercel)
  outputFileTracingIncludes: {
    "/**": ["./db/**"],
  },
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
};

export default nextConfig;
