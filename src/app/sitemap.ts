import type { MetadataRoute } from "next";

const siteUrl = "https://www.marketvibe1.com";
const previewImageUrl = `${siteUrl}/marketvibe-email-preview.png`;

const publicRoutes: Array<{
  path: string;
  priority: number;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  images?: string[];
}> = [
  { path: "/", priority: 1.0, changeFrequency: "weekly", images: [previewImageUrl] },
  { path: "/sample", priority: 0.95, changeFrequency: "weekly", images: [previewImageUrl] },
  { path: "/pricing", priority: 0.9, changeFrequency: "weekly", images: [previewImageUrl] },
  { path: "/about", priority: 0.7, changeFrequency: "monthly" },
  { path: "/faq", priority: 0.7, changeFrequency: "monthly" },
  { path: "/contact", priority: 0.65, changeFrequency: "monthly" },
  { path: "/compliance", priority: 0.55, changeFrequency: "monthly" },
  { path: "/acceptable-use", priority: 0.45, changeFrequency: "monthly" },
  { path: "/privacy", priority: 0.45, changeFrequency: "yearly" },
  { path: "/terms", priority: 0.45, changeFrequency: "yearly" },
  { path: "/refund-policy", priority: 0.4, changeFrequency: "yearly" },
  { path: "/billing-help", priority: 0.4, changeFrequency: "monthly" },
  { path: "/data-requests", priority: 0.35, changeFrequency: "yearly" },
  { path: "/security", priority: 0.35, changeFrequency: "yearly" },
  { path: "/cookies", priority: 0.35, changeFrequency: "yearly" },
  { path: "/impressum", priority: 0.3, changeFrequency: "yearly" },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return publicRoutes.map((route) => ({
    url: `${siteUrl}${route.path}`,
    lastModified,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
    ...(route.images ? { images: route.images } : {}),
  }));
}
