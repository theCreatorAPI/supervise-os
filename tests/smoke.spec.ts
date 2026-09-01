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
