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
      "/tools",
      "/calculators",
      "/business-ideas",
      "/affiliate-niches",
      "/digital-products",
      "/reports",
      "/products",
      "/categories",
      "/cart",
      "/checkout",
      "/shipping",
      "/refund",
      "/admin/products",
      "/admin/import",
      "/admin/orders",
      "/admin/fulfillment",
    ].map((source) => ({
      source: `${source}/:path*`,
      destination: source.startsWith("/admin") ? "/admin" : "/dashboard",
      permanent: false,
    }));
  },
};

export default nextConfig;
