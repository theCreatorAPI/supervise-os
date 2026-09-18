import type { MetadataRoute } from "next";
import { siteUrl } from "./layout";

/**
 * Only the marketing and entry pages are public. Everything behind a session —
 * the three dashboards, uploads, auth callbacks — is disallowed: those URLs
 * carry student names and project data, and there is nothing there a crawler
 * could index anyway once the route guard redirects it.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/student/", "/lecturer/", "/management/", "/activate/", "/api/"],
    },
    sitemap: new URL("/sitemap.xml", siteUrl).toString(),
    host: siteUrl.toString(),
  };
}
