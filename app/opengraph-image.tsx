import { ImageResponse } from "next/og";

/**
 * The card that appears when a Supervise OS link is shared.
 *
 * Generated at build time from JSX rather than shipped as a binary, so the
 * wording and brand colours stay in sync with the app instead of drifting from
 * a stale export. System fonts only — no font file to load or keep in the repo.
 */

export const alt = "Supervise OS — project supervision, under control";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 80,
          background: "linear-gradient(135deg, #4f5f31 0%, #2d3a1b 55%, #141c0a 100%)",
          color: "#ffffff",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          {/* The mark, drawn from bordered divs — ImageResponse ships only a
              basic Latin font, so a symbol glyph renders as tofu. */}
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              background: "rgba(255,255,255,0.14)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                width: 30,
                height: 30,
                borderRadius: 999,
                border: "4px solid #f0f4e8",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div style={{ width: 8, height: 8, borderRadius: 999, background: "#f0f4e8" }} />
            </div>
          </div>
          <div style={{ fontSize: 30, letterSpacing: -0.5 }}>Supervise OS</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ fontSize: 76, lineHeight: 1.05, letterSpacing: -2, maxWidth: 900 }}>
            Project supervision, under control.
          </div>
          <div style={{ fontSize: 30, color: "rgba(255,255,255,0.72)", maxWidth: 880, lineHeight: 1.35 }}>
            Milestones, submissions, reviews and risk — tracked live for students,
            supervisors and the department.
          </div>
        </div>

        <div style={{ display: "flex", gap: 40, fontSize: 24, color: "rgba(255,255,255,0.6)" }}>
          <div style={{ display: "flex" }}>Risk flagged automatically</div>
          <div style={{ display: "flex" }}>Milestones end to end</div>
          <div style={{ display: "flex" }}>Supervisor load in view</div>
        </div>
      </div>
    ),
    size
  );
}
