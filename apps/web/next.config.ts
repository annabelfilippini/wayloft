import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: "../..",
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
  async redirects() {
    return [
      { source: "/search", destination: "/travel", permanent: true },
      { source: "/bonuses", destination: "/travel", permanent: true },
      { source: "/optimizer", destination: "/cards", permanent: true },
    ];
  },
};

export default nextConfig;
