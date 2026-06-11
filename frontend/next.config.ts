import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Only proxy /api to localhost when NEXT_PUBLIC_API_URL is not set (local dev)
  async rewrites() {
    if (!process.env.NEXT_PUBLIC_API_URL) {
      return [
        {
          source: "/api/:path*",
          destination: "http://localhost:8000/api/:path*",
        },
      ];
    }
    return [];
  },
};

export default nextConfig;
