import { createHmac, timingSafeEqual } from "crypto";

/**
 * Binds an issued upload path to the student and milestone it was issued for.
 *
 * The browser uploads straight to storage and then tells the server "this object
 * is my submission". Without a signature that claim is unverified: the client
 * chooses what path to send back, so it could point a submission at any object
 * it can name. Signing the triple at issue time and checking it at finalize time
 * means the server only ever accepts a path it handed out itself, for the
 * milestone and student it handed it out for.
 *
 * Stateless by design — no pending-upload table to write, expire or clean up.
 */

function secret(): string {
  const value = process.env.NEXTAUTH_SECRET;
  if (!value) throw new Error("NEXTAUTH_SECRET is required to sign upload tokens.");
  return value;
}

function payload(userId: string, milestoneId: string, storedName: string) {
  return `${userId}:${milestoneId}:${storedName}`;
}

export function signUploadPath(userId: string, milestoneId: string, storedName: string): string {
  return createHmac("sha256", secret()).update(payload(userId, milestoneId, storedName)).digest("hex");
}

export function verifyUploadPath(
  userId: string,
  milestoneId: string,
  storedName: string,
  signature: string
): boolean {
  const expected = signUploadPath(userId, milestoneId, storedName);

  // Compared with a constant-time check: a plain === leaks how much of the
  // signature matched through timing, which is enough to forge one byte at a time.
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(signature, "utf8");
  if (a.length !== b.length) return false;

  return timingSafeEqual(a, b);
}
