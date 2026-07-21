import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
      "/products",
      "/categories",
      "/cart",
      "/digital-products",
      "/lead-packs",
      "/business-ideas",
      "/calculators",
      "/tools",
      "/affiliate-niches",
      "/legacy-delivery",
      "/checkout"
    ].map((source) => ({
      source: `${source}/:path*`,
      destination: "/pricing",
      permanent: true,
    }));
  },
};

export default nextConfig;
