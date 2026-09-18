import { ImageResponse } from "next/og";

/**
 * Home-screen icon for iOS, which ignores SVG favicons and wants a PNG.
 *
 * The mark is drawn from bordered divs rather than a glyph: ImageResponse only
 * ships a basic Latin font, so a symbol character like ◎ sends it looking for a
 * dynamic font at build time and renders tofu when that lookup fails.
 */

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#4f5f31",
        }}
      >
        {/* Outer ring */}
        <div
          style={{
            width: 118,
            height: 118,
            borderRadius: 999,
            border: "10px solid rgba(240,244,232,0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {/* Inner ring */}
          <div
            style={{
              width: 62,
              height: 62,
              borderRadius: 999,
              border: "10px solid #f0f4e8",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {/* Centre dot */}
            <div style={{ width: 20, height: 20, borderRadius: 999, background: "#f0f4e8" }} />
          </div>
        </div>
      </div>
    ),
    size
  );
}
