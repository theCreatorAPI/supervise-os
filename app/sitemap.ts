import type { MetadataRoute } from "next";
import { siteUrl } from "./layout";

/**
 * The publicly indexable surface, which is only the three unauthenticated
 * pages. Dashboard routes are deliberately absent — they're session-gated and
 * disallowed in robots.txt, so listing them would just advertise URLs that
 * redirect.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const entry = (path: string, priority: number, changeFrequency: "monthly" | "yearly") => ({
    url: new URL(path, siteUrl).toString(),
    lastModified: new Date(),
    changeFrequency,
    priority,
  });

  return [entry("/", 1, "monthly"), entry("/sign-in", 0.5, "yearly"), entry("/sign-up", 0.5, "yearly")];
}
