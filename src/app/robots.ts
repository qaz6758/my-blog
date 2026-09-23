// app/robots.ts
import { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/*", "/_next/*"],
    },
    sitemap: siteUrl("/sitemap.xml"),
  };
}