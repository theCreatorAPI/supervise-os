"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { SESSION_COOKIE } from "@/lib/academic-session";

/**
 * Remembers which academic session the signed-in user is looking at.
 *
 * Kept in a cookie rather than the URL because it is a mode, not a filter: it
 * applies across the dashboard, roster, submissions, meetings and approvals at
 * once, and threading a query parameter through every link between them would
 * leave one stale link able to silently switch cohort mid-flow.
 */
export async function setAcademicSession(value: string) {
  const session = await auth();
  if (!session?.user) return { error: "Not signed in." };

  // Shape-checked rather than trusted: this value is written by the browser and
  // is later compared against session strings read from the database.
  if (!/^\d{4}\/\d{4}$/.test(value)) return { error: "Not a valid session." };

  (await cookies()).set(SESSION_COOKIE, value, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });

  revalidatePath("/lecturer", "layout");

  return { success: true };
}
