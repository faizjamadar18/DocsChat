import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Proxy /api to localhost in local dev (when NEXT_PUBLIC_API_URL is not set or is localhost)
  async rewrites() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
    const isLocal = !apiUrl || apiUrl.includes('localhost') || apiUrl.includes('127.0.0.1');
    if (isLocal) {
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
