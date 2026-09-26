/**
 * The seeded demo logins, shared by the sign-in and sign-up screens so the two
 * can never advertise different accounts. Also listed in DEMO_ACCOUNTS.md.
 *
 * These exist because the app is a demo: anyone can sign in as any role. That is
 * the point here, and the reason `npm run db:seed` must never be pointed at a
 * deployment with real students in it.
 */

export type DemoAccount = {
  role: "STUDENT" | "LECTURER" | "MANAGEMENT";
  label: string;
  email: string;
};

export const DEMO_ACCOUNTS: DemoAccount[] = [
  { role: "STUDENT", label: "Continue as a student", email: "student1@demo.io" },
  { role: "LECTURER", label: "Continue as a lecturer", email: "lecturer1@demo.io" },
  { role: "MANAGEMENT", label: "Continue as management", email: "management@demo.io" },
];

export const DEMO_PASSWORD = "password123";
