import { test, expect } from "@playwright/test";

test.describe("File Forge E2E", () => {
  test("Homepage loads and has correct title", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/File Forge/);
    await expect(page.locator("h1")).toContainText("File Forge");
  });

  test("Can navigate to PDF Watermark tool", async ({ page }) => {
    await page.goto("/pdf/watermark");
    await expect(page.locator("h1")).toContainText("PDF Watermark");
  });

  test("Can navigate to Image Crop tool", async ({ page }) => {
    await page.goto("/image/crop");
    await expect(page.locator("h1")).toContainText("Image Crop");
  });
});
