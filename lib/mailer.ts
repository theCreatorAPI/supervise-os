/**
 * Outbound email, through Resend's HTTP API.
 *
 * Called over plain `fetch` rather than through the SDK on purpose: the only
 * thing needed is one POST, and the last mail library added here (nodemailer)
 * broke the production build by conflicting with next-auth's peer range. An
 * HTTP call has no dependency to conflict with.
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

/**
 * Resend's shared sender, usable without owning a domain.
 *
 * It carries a hard limit: until a domain is verified in Resend, the API only
 * accepts recipients that match the account owner's own address. Inviting a real
 * student will be rejected with a 403 until then, which `sendMail` surfaces
 * verbatim rather than hiding.
 */
const DEFAULT_FROM = "onboarding@resend.dev";

export type MailResult = { ok: true } | { ok: false; error: string };

/** True when an API key is present, so callers can degrade gracefully. */
export function isMailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

/** The address every message is sent from. */
export function mailFromAddress(): string {
  return process.env.MAIL_FROM ?? DEFAULT_FROM;
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
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { ok: false, error: "Email is not configured on this deployment." };

  const address = mailFromAddress();
  // Quoted so a name containing a comma or period doesn't split the header.
  const from = fromName ? `"${fromName.replace(/"/g, "")}" <${address}>` : address;

  try {
    const response = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject,
        text,
        html,
        ...(replyTo ? { reply_to: replyTo } : {}),
      }),
    });

    if (!response.ok) {
      // Resend explains refusals in the body — an unverified domain, a bad key —
      // and that explanation is what the lecturer needs to see, not a status code.
      const detail = await response.text();
      let message = `Resend rejected the message (${response.status}).`;
      try {
        const parsed = JSON.parse(detail) as { message?: string };
        if (parsed.message) message = parsed.message;
      } catch {
        // Non-JSON body: the generic message above is the best available.
      }
      console.error("[sendMail]", response.status, detail);
      return { ok: false, error: message };
    }

    return { ok: true };
  } catch (err) {
    console.error("[sendMail]", err);
    return { ok: false, error: err instanceof Error ? err.message : "Could not send the email." };
  }
}
