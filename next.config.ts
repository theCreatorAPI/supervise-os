import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

/**
 * Students upload submissions straight from the browser to Supabase Storage via
 * a one-shot signed URL, so the storage origin has to be allowed in connect-src.
 * Derived from the configured project rather than hardcoded or wildcarded, so a
 * deployment only ever permits its own Supabase project — and an unset variable
 * narrows the policy rather than widening it.
 */
const supabaseOrigin = (() => {
  if (!process.env.SUPABASE_URL) return "";
  try {
    return new URL(process.env.SUPABASE_URL).origin;
  } catch {
    return "";
  }
})();

const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      // 'unsafe-eval' is only needed in dev — React's dev-mode debugging/HMR uses eval(),
      // but React never uses it in production builds.
      `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
      "style-src 'self' 'unsafe-inline' fonts.googleapis.com",
      "img-src 'self' data: blob:",
      "font-src 'self' fonts.gstatic.com",
      `connect-src 'self'${supabaseOrigin ? ` ${supabaseOrigin}` : ""}${isDev ? " ws:" : ""}`,
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; "),
  },
];

/**
 * Submitted files are previewed in an iframe on the review screen, which the
 * blanket `frame-ancestors 'none'` above blocks outright — the preview pane
 * silently rendered nothing. This relaxes framing to same-origin for that one
 * route, and only that route.
 *
 * Safe to do here specifically because `/api/uploads/[submissionId]` requires a
 * session, checks the requester is the project's student, its supervisor, or
 * management, and pins Content-Type to application/pdf or octet-stream — it can
 * never return HTML for the embedded document to execute as.
 *
 * X-Frame-Options has to be relaxed alongside it: browsers that still honour the
 * older header would keep blocking the frame even once the CSP allows it.
 */
const uploadPreviewHeaders = securityHeaders.map((header) => {
  if (header.key === "X-Frame-Options") return { key: header.key, value: "SAMEORIGIN" };
  if (header.key === "Content-Security-Policy") {
    return { key: header.key, value: header.value.replace("frame-ancestors 'none'", "frame-ancestors 'self'") };
  }
  return header;
});

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
      // Declared after the catch-all so these win for the uploads route.
      {
        source: "/api/uploads/:path*",
        headers: uploadPreviewHeaders,
      },
    ];
  },
};

export default nextConfig;
