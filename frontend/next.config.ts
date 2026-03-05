import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /** Transpile Arco Design for proper SSR / CSS handling */
  transpilePackages: ["@arco-design/web-react"],

  /** Proxy /api requests to the backend server */
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://localhost:8000/api/:path*",
      },
      {
        source: "/uploads/:path*",
        destination: "http://localhost:8000/uploads/:path*",
      },
    ];
  },
};

export default nextConfig;
