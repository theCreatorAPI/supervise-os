/**
 * Outbound email, over HTTP.
 *
 * Two providers, chosen by whichever key is present:
 *
 * - **Brevo** (BREVO_API_KEY). Preferred: it verifies a single sender address
 *   rather than a whole domain, so it can deliver to real students.
 * - **Resend** (RESEND_API_KEY) as a fallback. Without a verified domain it only
 *   accepts the account owner's own address as a recipient, so it cannot invite
 *   students on its own.
 *
 * Both are called with plain `fetch` and no SDK. That is deliberate: the mail
 * library that used to sit here (nodemailer) broke the production build by
 * conflicting with next-auth's peer range, and papering over that needed an npm
 * override. An HTTP call has no dependency to conflict with.
 *
 * On sender addresses: mail is always sent from the one verified address in
 * MAIL_FROM, never as the supervisor's own. Sending as an arbitrary address
 * fails SPF, DKIM and DMARC, so those messages are dropped or land in spam.
 * What the student sees instead is the supervisor's *name* on the message and
 * their address in Reply-To, so replies reach the supervisor directly.
 *
 * A caveat worth knowing: both providers accept a message and validate the
 * sender afterwards, so a success here means "accepted for delivery", not
 * "delivered". If MAIL_FROM is not a verified sender the message is dropped
 * later and only the provider's dashboard shows it. Keeping MAIL_FROM verified
 * is a deployment concern, not something this code can check per send.
 *
 * Every helper reports failure rather than throwing: an invitation that could
 * not be emailed is still a valid invitation, because the link can be copied.
 */

const BREVO_ENDPOINT = "https://api.brevo.com/v3/smtp/email";
const RESEND_ENDPOINT = "https://api.resend.com/emails";

export type MailResult = { ok: true } | { ok: false; error: string };

/** True when a provider is configured, so callers can degrade gracefully. */
export function isMailConfigured(): boolean {
  return Boolean(process.env.BREVO_API_KEY || process.env.RESEND_API_KEY);
}

/** The address every message is sent from. Must be verified with the provider. */
export function mailFromAddress(): string {
  return process.env.MAIL_FROM ?? "onboarding@resend.dev";
}

/** Providers explain refusals in the body; that text is what a lecturer needs. */
async function describeFailure(response: Response, fallback: string): Promise<string> {
  const detail = await response.text();
  try {
    const parsed = JSON.parse(detail) as { message?: string };
    if (parsed.message) return parsed.message;
  } catch {
    // Non-JSON body: the caller's generic message is the best available.
  }
  return fallback;
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
  const brevoKey = process.env.BREVO_API_KEY;

  if (brevoKey) {
    try {
      const response = await fetch(BREVO_ENDPOINT, {
        method: "POST",
        headers: { "api-key": brevoKey, "content-type": "application/json", accept: "application/json" },
        body: JSON.stringify({
          sender: { email: address, ...(fromName ? { name: fromName } : {}) },
          to: [{ email: to }],
          subject,
          textContent: text,
          htmlContent: html,
          ...(replyTo ? { replyTo: { email: replyTo } } : {}),
        }),
      });

      if (!response.ok) {
        const message = await describeFailure(response, `Brevo rejected the message (${response.status}).`);
        console.error("[sendMail:brevo]", response.status, message);
        return { ok: false, error: message };
      }

      return { ok: true };
    } catch (err) {
      console.error("[sendMail:brevo]", err);
      return { ok: false, error: err instanceof Error ? err.message : "Could not send the email." };
    }
  }

  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) return { ok: false, error: "Email is not configured on this deployment." };

  // Quoted so a name containing a comma or period doesn't split the header.
  const from = fromName ? `"${fromName.replace(/"/g, "")}" <${address}>` : address;

  try {
    const response = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: [to], subject, text, html, ...(replyTo ? { reply_to: replyTo } : {}) }),
    });

    if (!response.ok) {
      const message = await describeFailure(response, `Resend rejected the message (${response.status}).`);
      console.error("[sendMail:resend]", response.status, message);
      return { ok: false, error: message };
    }

    return { ok: true };
  } catch (err) {
    console.error("[sendMail:resend]", err);
    return { ok: false, error: err instanceof Error ? err.message : "Could not send the email." };
  }
}
