import nodemailer, { type Transporter } from "nodemailer";

/**
 * Outbound email.
 *
 * Two transports, chosen by whichever is configured:
 *
 * - **SMTP** (Brevo, or any SMTP host) when SMTP_HOST is set. Preferred, because
 *   Brevo delivers to any recipient once a single sender address is verified.
 * - **Resend** otherwise, called over plain `fetch`. Kept as a fallback, but it
 *   only accepts the account owner's own address as a recipient until a domain
 *   is verified, so it cannot invite real students on its own.
 *
 * On sender addresses: mail is always sent from the one verified address in
 * MAIL_FROM, never as the supervisor's own. Sending as an arbitrary address
 * fails SPF, DKIM and DMARC, so those messages are dropped or land in spam —
 * worse than not sending, because nobody finds out. What the student sees
 * instead is the supervisor's *name* on the message and their address in
 * Reply-To, so replies reach the supervisor directly.
 *
 * Every helper here reports failure rather than throwing: an invitation that
 * could not be emailed is still a valid invitation, because the link can be
 * copied by hand.
 */

const RESEND_ENDPOINT = "https://api.resend.com/emails";

export type MailResult = { ok: true } | { ok: false; error: string };

let transporter: Transporter | undefined;

function smtpConfigured(): boolean {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD);
}

/** True when any transport is configured, so callers can degrade gracefully. */
export function isMailConfigured(): boolean {
  return smtpConfigured() || Boolean(process.env.RESEND_API_KEY);
}

/** The address every message is sent from. */
export function mailFromAddress(): string {
  return process.env.MAIL_FROM ?? process.env.SMTP_USER ?? "onboarding@resend.dev";
}

function getTransporter(): Transporter {
  if (transporter) return transporter;

  const port = Number(process.env.SMTP_PORT ?? 587);

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    // 465 is implicit TLS; 587 upgrades with STARTTLS.
    secure: port === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
  });

  return transporter;
}

export async function sendMail({
  to,
  subject,
  text,
  html,
  fromName,
  replyTo,
}: {
  to: string;
  subject: string;
  text: string;
  html: string;
  /** Display name shown to the recipient — normally the supervisor's. */
  fromName?: string;
  replyTo?: string;
}): Promise<MailResult> {
  const address = mailFromAddress();
  // Quoted so a name containing a comma or period doesn't split the header.
  const from = fromName ? `"${fromName.replace(/"/g, "")}" <${address}>` : address;

  if (smtpConfigured()) {
    try {
      await getTransporter().sendMail({ from, to, subject, text, html, replyTo });
      return { ok: true };
    } catch (err) {
      console.error("[sendMail:smtp]", err);
      return { ok: false, error: err instanceof Error ? err.message : "Could not send the email." };
    }
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { ok: false, error: "Email is not configured on this deployment." };

  try {
    const response = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: [to], subject, text, html, ...(replyTo ? { reply_to: replyTo } : {}) }),
    });

    if (!response.ok) {
      // Resend explains refusals in the body — an unverified domain, a bad key —
      // and that explanation is what the lecturer needs to see, not a status code.
      const detail = await response.text();
      let message = `The mail provider rejected the message (${response.status}).`;
      try {
        const parsed = JSON.parse(detail) as { message?: string };
        if (parsed.message) message = parsed.message;
      } catch {
        // Non-JSON body: the generic message above is the best available.
      }
      console.error("[sendMail:resend]", response.status, detail);
      return { ok: false, error: message };
    }

    return { ok: true };
  } catch (err) {
    console.error("[sendMail:resend]", err);
    return { ok: false, error: err instanceof Error ? err.message : "Could not send the email." };
  }
}
