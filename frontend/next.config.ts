import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  turbopack: {
    root: "./",
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  rewrites: () => {
    return [
      {
        source: "/api/:path*",
        destination: "http://localhost:3002/:path*",
      },
    ];
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
