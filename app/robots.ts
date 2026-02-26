import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/feed", "/account", "/saved", "/check-email", "/api/"],
      },
    ],
    sitemap: "https://www.fdeworld.com/sitemap.xml",
  };
}
