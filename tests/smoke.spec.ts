import { test, expect } from "@playwright/test";

const PASSWORD = "password123";

async function signIn(page: import("@playwright/test").Page, email: string, callbackUrl?: string) {
  await page.goto(callbackUrl ? `/sign-in?callbackUrl=${encodeURIComponent(callbackUrl)}` : "/sign-in");
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).fill(PASSWORD);
  await page.getByRole("button", { name: /sign in/i }).click();
}

test("landing page loads and shows the hero", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /project supervision/i })).toBeVisible();
  await expect(page.getByRole("navigation").getByRole("link", { name: /sign in/i })).toBeVisible();
});

test("rejects an unknown login with a generic error", async ({ page }) => {
  await page.goto("/sign-in");
  await page.getByLabel(/email/i).fill("nobody@demo.io");
  await page.getByLabel(/password/i).fill("wrong-password");
  await page.getByRole("button", { name: /sign in/i }).click();
  await expect(page.getByText(/don't match our records/i)).toBeVisible();
  await expect(page).toHaveURL(/sign-in/);
});

test("student can sign in and land on their dashboard", async ({ page }) => {
  await signIn(page, "student1@demo.io", "/student");
  await expect(page).toHaveURL(/\/student/);
});

test("lecturer can sign in and land on their dashboard", async ({ page }) => {
  await signIn(page, "lecturer1@demo.io", "/lecturer");
  await expect(page).toHaveURL(/\/lecturer/);
});

test("management can sign in and land on their dashboard", async ({ page }) => {
  await signIn(page, "management@demo.io", "/management");
  await expect(page).toHaveURL(/\/management/);
});

test("a student cannot reach a lecturer-only route", async ({ page }) => {
  await signIn(page, "student1@demo.io", "/student");
  await expect(page).toHaveURL(/\/student/);

  await page.goto("/lecturer");
  await expect(page).toHaveURL(/\/student/);
});

test("signed-out visitor is redirected away from a protected route", async ({ page }) => {
  await page.goto("/student");
  await expect(page).toHaveURL(/sign-in/);
});

/**
 * Walks every management screen from the admin flow sheet, including the two
 * detail pages reached from a table row. These render live database rows, so a
 * broken query or a missing relation shows up here as a 500 rather than only in
 * production.
 */
test("management can reach every admin screen", async ({ page }) => {
  await signIn(page, "management@demo.io", "/management");
  await expect(page).toHaveURL(/\/management/);

  const screens: [string, RegExp][] = [
    ["/management", /good (morning|afternoon|evening)/i],
    ["/management/students", /^Students$/],
    ["/management/lecturers", /^Lecturers$/],
    ["/management/projects", /^Projects$/],
    ["/management/submissions", /^Submissions$/],
    ["/management/meetings", /^Meetings$/],
    ["/management/notifications", /^Notifications$/],
    ["/management/settings", /^Settings$/],
    ["/management/help", /help & support/i],
    ["/management/workload", /lecturer workload/i],
    ["/management/at-risk", /department-wide risk/i],
  ];

  for (const [path, heading] of screens) {
    await page.goto(path);
    await expect(page.getByRole("heading", { name: heading, level: 1 })).toBeVisible();
  }

  // Drill into a lecturer and a project the way an admin actually would.
  await page.goto("/management/lecturers");
  await page.getByRole("link", { name: /^View$/ }).first().click();
  await expect(page.getByRole("heading", { name: /lecturer details/i, level: 1 })).toBeVisible();

  await page.goto("/management/projects");
  await page.getByRole("link", { name: /^View$/ }).first().click();
  await expect(page.getByRole("heading", { name: /project details/i, level: 1 })).toBeVisible();
});

/**
 * Walks the supervisor screens from the lecturer flow sheet, including the
 * project-approval path the dashboard links to. Approving creates a project and
 * its milestones, so the decision itself is not exercised here — only that the
 * queue and the review screen render with the seeded proposals.
 */
test("lecturer can reach every supervision screen", async ({ page }) => {
  await signIn(page, "lecturer1@demo.io", "/lecturer");
  await expect(page).toHaveURL(/\/lecturer/);

  const screens: [string, RegExp][] = [
    ["/lecturer", /good (morning|afternoon|evening)/i],
    ["/lecturer/students", /my students/i],
    ["/lecturer/submissions", /^Submissions$/],
    ["/lecturer/meetings", /^Meetings$/],
    ["/lecturer/notifications", /^Notifications$/],
    ["/lecturer/approvals", /project approvals/i],
    ["/lecturer/settings", /^Settings$/],
    ["/lecturer/help", /help & support/i],
  ];

  for (const [path, heading] of screens) {
    await page.goto(path);
    await expect(page.getByRole("heading", { name: heading, level: 1 })).toBeVisible();
  }

  // The dashboard routes approvals to their own screen rather than deciding inline.
  await page.goto("/lecturer");
  await page.getByRole("link", { name: /view approvals/i }).click();
  await expect(page).toHaveURL(/\/lecturer\/approvals/);

  // And the queue opens a full review screen with the decision form on it.
  await page.getByRole("link", { name: /^Review$/ }).first().click();
  await expect(page.getByRole("heading", { name: /project approval review/i, level: 1 })).toBeVisible();
  await expect(page.getByRole("button", { name: /approve project/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /request changes/i })).toBeVisible();
});

/**
 * The session switcher scopes every supervision screen to one intake. Asserting
 * the roster actually changes — not merely that the control exists — is the
 * point: a switcher that renders but filters nothing would pass a weaker test.
 */
test("lecturer can switch academic session and see a different cohort", async ({ page }) => {
  await signIn(page, "lecturer1@demo.io", "/lecturer");
  await expect(page).toHaveURL(/\/lecturer/);
  await page.goto("/lecturer/students");

  const picker = page.getByLabel("Academic session");
  await expect(picker).toBeVisible();

  const sessions = await picker.locator("option").allInnerTexts();
  expect(sessions.length).toBeGreaterThan(1);

  const rosterCount = () => page.getByRole("link", { name: /view project/i }).count();

  const first = await picker.inputValue();
  const before = await rosterCount();

  const other = sessions.find((s) => s.trim() !== first.trim());
  await picker.selectOption(other!.trim());
  await expect(picker).toHaveValue(other!.trim());

  const after = await rosterCount();
  expect(after).not.toBe(before);

  // The choice is a mode, not a per-page filter: it survives navigation.
  await page.goto("/lecturer");
  await expect(page.getByLabel("Academic session")).toHaveValue(other!.trim());
});

/** Walks the student screens from the student flow sheet. */
test("student can reach every project screen", async ({ page }) => {
  await signIn(page, "student1@demo.io", "/student");
  await expect(page).toHaveURL(/\/student/);

  const screens: [string, RegExp][] = [
    ["/student", /good (morning|afternoon|evening)/i],
    ["/student/project-approval", /project approval/i],
    ["/student/project", /my project/i],
    ["/student/submissions", /^Submissions$/],
    ["/student/meetings", /^Meetings$/],
    ["/student/notifications", /^Notifications$/],
    ["/student/settings", /^Settings$/],
    ["/student/help", /help & support/i],
  ];

  for (const [path, heading] of screens) {
    await page.goto(path);
    await expect(page.getByRole("heading", { name: heading, level: 1 })).toBeVisible();
  }

  // A submission opens its own detail screen, with feedback and next action.
  await page.goto("/student/submissions");
  await page.getByRole("link", { name: /view details/i }).first().click();
  await expect(page.getByRole("heading", { name: /submission details/i, level: 1 })).toBeVisible();
});

/**
 * The demo buttons land on the marketing page rather than a dashboard, because
 * the sign-in screen only learns the role after the credentials come back. What
 * matters is that the management credential works and the session it creates can
 * reach the management area.
 */
test("management can sign in from the demo buttons", async ({ page }) => {
  await page.goto("/sign-in");
  await page.getByRole("button", { name: /continue as management/i }).click();
  await expect(page).toHaveURL(/localhost:3000\/$/);

  await page.goto("/management");
  await expect(page.getByRole("heading", { name: /good (morning|afternoon|evening)/i, level: 1 })).toBeVisible();
});
