import type { MetadataRoute } from "next";

import { absoluteUrl, siteUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/applications",
        "/chat",
        "/forgot-password",
        "/login",
        "/moderation",
        "/profile",
        "/projects/new",
        "/reset-password",
        "/signup",
        "/verify-email",
      ],
    },
    sitemap: absoluteUrl("/sitemap.xml"),
    host: siteUrl.origin,
  };
}
