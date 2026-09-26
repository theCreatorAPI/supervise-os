import nodemailer, { type Transporter } from "nodemailer";

/**
 * Outbound email, over SMTP.
 *
 * On sender addresses: mail is always sent through the one authenticated SMTP
 * account, never as the supervisor's own address. Sending as an arbitrary
 * address fails SPF, DKIM and DMARC, so those messages are dropped or land in
 * spam — which is worse than not sending at all, because nobody finds out.
 *
 * What the student sees instead is the supervisor's *name* on the message and
 * their address in Reply-To, so replies reach the supervisor directly. The only
 * part that is not the supervisor's is the envelope address, which is the part
 * the receiving server checks.
 *
 * Every helper here reports failure rather than throwing: an invitation that
 * could not be emailed is still a valid invitation, because the link can be
 * copied by hand.
 */

export type MailResult = { ok: true } | { ok: false; error: string };

let transporter: Transporter | undefined;

/** True when SMTP credentials are present, so callers can degrade gracefully. */
export function isMailConfigured(): boolean {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD);
}

function getTransporter(): Transporter {
  if (transporter) return transporter;

  const port = Number(process.env.SMTP_PORT ?? 587);

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    // 465 is implicit TLS; 587 upgrades with STARTTLS.
    secure: port === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });

  return transporter;
}

/** The address every message is actually sent from. */
export function mailFromAddress(): string {
  return process.env.MAIL_FROM ?? process.env.SMTP_USER ?? "";
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
  if (!isMailConfigured()) {
    return { ok: false, error: "Email is not configured on this deployment." };
  }

  const address = mailFromAddress();
  if (!address) return { ok: false, error: "No sender address is configured." };

  try {
    await getTransporter().sendMail({
      // Quoted so a name containing a comma or period doesn't split the header.
      from: fromName ? `"${fromName.replace(/"/g, "")}" <${address}>` : address,
      to,
      subject,
      text,
      html,
      replyTo,
    });

    return { ok: true };
  } catch (err) {
    console.error("[sendMail]", err);
    return { ok: false, error: err instanceof Error ? err.message : "Could not send the email." };
  }
}
