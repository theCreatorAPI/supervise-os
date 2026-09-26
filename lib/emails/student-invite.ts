/**
 * The invitation a student receives when their supervisor adds them.
 *
 * Plain inline styles and a table-free layout: this has to survive Gmail,
 * Outlook and university webmail, none of which support a stylesheet. The text
 * part is not an afterthought — some university mail clients strip HTML
 * entirely, and the link has to work there too.
 */

/** Demo accounts use addresses nobody reads, so replies are pointed elsewhere. */
export function isDemoAccount(email: string): boolean {
  return email.toLowerCase().endsWith("@demo.io");
}

/**
 * Where a student's reply should go: their real supervisor, or — when the
 * invitation came from a demo account, whose @demo.io address nobody reads — the
 * address in DEMO_REPLY_TO, falling back to the sending account.
 *
 * Read from the environment rather than written here so a personal address is
 * not committed to a repository that may be public.
 */
export function replyToFor(supervisorEmail: string): string {
  if (!isDemoAccount(supervisorEmail)) return supervisorEmail;

  return process.env.DEMO_REPLY_TO ?? process.env.MAIL_FROM ?? process.env.SMTP_USER ?? supervisorEmail;
}

export function studentInviteEmail({
  studentName,
  supervisorName,
  activationUrl,
}: {
  studentName: string;
  supervisorName: string;
  activationUrl: string;
}) {
  const subject = `${supervisorName} invited you to Supervise OS`;

  const text = [
    `Hello ${studentName},`,
    "",
    `${supervisorName} has added you as a supervised student on Supervise OS.`,
    "",
    "Set your password and activate your account here:",
    activationUrl,
    "",
    "This link is unique to you — don't forward it.",
    "",
    "If you weren't expecting this, you can ignore this email.",
  ].join("\n");

  const html = `
<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6;color:#1a1c18;max-width:560px;margin:0 auto;padding:24px">
  <p style="margin:0 0 16px">Hello ${escapeHtml(studentName)},</p>

  <p style="margin:0 0 16px">
    <strong>${escapeHtml(supervisorName)}</strong> has added you as a supervised student on Supervise OS.
  </p>

  <p style="margin:0 0 24px">Set your password to activate your account:</p>

  <p style="margin:0 0 24px">
    <a href="${activationUrl}"
       style="display:inline-block;background:#4f5f31;color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:10px;font-weight:600">
      Activate my account
    </a>
  </p>

  <p style="margin:0 0 8px;font-size:13px;color:#5b6153">
    Or paste this link into your browser:
  </p>
  <p style="margin:0 0 24px;font-size:13px;word-break:break-all">
    <a href="${activationUrl}" style="color:#4f5f31">${escapeHtml(activationUrl)}</a>
  </p>

  <p style="margin:0 0 8px;font-size:13px;color:#5b6153">
    This link is unique to you — please don't forward it.
  </p>
  <p style="margin:0;font-size:13px;color:#5b6153">
    If you weren't expecting this, you can ignore this email.
  </p>
</div>`.trim();

  return { subject, text, html };
}

/** Names and URLs land in markup, so they are escaped rather than trusted. */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
