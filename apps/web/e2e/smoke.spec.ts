import { test, expect } from "@playwright/test";

test.describe("Smoke tests", () => {
  test("sign-in page loads", async ({ page }) => {
    await page.goto("/auth/signin");
    await expect(page).toHaveURL(/\/auth\/signin/);
    // Page should contain sign-in related content
    await expect(page.locator("body")).toBeVisible();
  });

  test("unauthenticated user is redirected from admin", async ({ page }) => {
    await page.goto("/admin/users");
    // Should redirect to sign-in with callbackUrl
    await expect(page).toHaveURL(/\/auth\/signin/);
  });

  test("home page loads", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("body")).toBeVisible();
  });
});
