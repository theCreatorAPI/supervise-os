import type { MetadataRoute } from "next";

/**
 * Web app manifest, so the dashboards install cleanly to a phone home screen —
 * which is how a supervisor checking submissions between lectures will actually
 * reach them.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Supervise OS",
    short_name: "Supervise",
    description:
      "Milestones, submissions, reviews and risk for every supervised project, in one live view.",
    start_url: "/",
    display: "standalone",
    background_color: "#f7f7f4",
    theme_color: "#4f5f31",
    orientation: "portrait-primary",
    categories: ["education", "productivity"],
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}
