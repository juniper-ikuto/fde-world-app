import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://www.fdeworld.com";
  const now = new Date();
  return [
    { url: base,              lastModified: now, changeFrequency: "daily",   priority: 1.0 },
    { url: `${base}/signup`,  lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/auth`,    lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/privacy`, lastModified: now, changeFrequency: "yearly",  priority: 0.2 },
  ];
}
