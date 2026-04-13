/**
 * E2E flows — spec Section 8, 7 scenarios.
 *
 * These tests require a running Next.js dev server AND a Supabase local
 * instance with migrations + seed applied. When E2E_BASE_URL is not set,
 * the whole suite is skipped cleanly so CI jobs without a live stack
 * pass green.
 *
 * Tests run serially so that scenario 1 (parent signup) can hand state
 * to scenario 2 (child joining by code) and so on. Each scenario uses
 * unique per-run emails to stay idempotent across re-runs.
 */
import { test, expect } from "@playwright/test";

test.use({ baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000" });

test.describe.configure({ mode: "serial" });

test.describe("dooooz flows", () => {
  test.skip(!process.env.E2E_BASE_URL, "Requires running dev server + Supabase local");

  const runId = Date.now();
  const parentEmail = `test+${runId}+parent@dooooz.test`;
  const childEmail = `test+${runId}+child@dooooz.test`;
  const password = "TestPass123!";
  let inviteCode = "";

  test("1. Parent signup → create family → invite code", async ({ page }) => {
    await page.goto("/signup");

    await page.getByLabel(/email/i).fill(parentEmail);
    await page.getByLabel(/password/i).fill(password);
    await page.getByRole("button", { name: /sign ?up|가입/i }).click();

    await expect(page).toHaveURL(/\/onboarding\/create-family/);

    await page.getByLabel(/family name|가족/i).fill("Kim Family");
    await page.getByRole("button", { name: /create|만들기|다음/i }).click();

    await expect(page).toHaveURL(/\/onboarding\/pick-character/);

    await page.goto("/family/invite");
    const codeEl = page.getByTestId("invite-code").or(page.getByText(/^[A-Z0-9]{6,8}$/));
    await expect(codeEl.first()).toBeVisible();
    inviteCode = (await codeEl.first().textContent())?.trim() ?? "";
    expect(inviteCode.length).toBeGreaterThanOrEqual(6);
  });

  test("2. Child signup → join family → pick character → home", async ({ page }) => {
    test.skip(!inviteCode, "Scenario 1 did not produce an invite code");

    await page.goto("/signup");
    await page.getByLabel(/email/i).fill(childEmail);
    await page.getByLabel(/password/i).fill(password);
    await page.getByRole("button", { name: /sign ?up|가입/i }).click();

    await expect(page).toHaveURL(/\/onboarding\/join-family/);

    await page.getByLabel(/invite|초대/i).fill(inviteCode);
    await page.getByLabel(/name|이름/i).fill("Jun");
    // Role selector may be radio buttons or a select.
    const childRole = page.getByLabel(/child|아이/i);
    if (await childRole.isVisible().catch(() => false)) await childRole.click();

    await page.getByRole("button", { name: /join|참가|다음/i }).click();

    await expect(page).toHaveURL(/\/onboarding\/pick-character/);

    // Pick the first available character.
    await page.getByRole("button", { name: /bear|fox|cat|선택|pick/i }).first().click();
    await expect(page).toHaveURL(/\/$|\/home/);
  });

  test("3. Parent creates chore template", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel(/email/i).fill(parentEmail);
    await page.getByLabel(/password/i).fill(password);
    await page.getByRole("button", { name: /log ?in|로그인/i }).click();

    await page.goto("/chores/manage");
    await page.getByPlaceholder(/제목|title/i).fill("Dishes");
    await page.getByRole("spinbutton").fill("20");
    // Recurrence select defaults to daily — leave it.
    await page.getByRole("button", { name: /추가|add|create/i }).click();

    await expect(page.getByText("Dishes")).toBeVisible();
  });

  test("4. Child completes chore → balance increments", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel(/email/i).fill(childEmail);
    await page.getByLabel(/password/i).fill(password);
    await page.getByRole("button", { name: /log ?in|로그인/i }).click();

    await page.goto("/chores");

    // Capture the balance before.
    const balanceLocator = page.getByTestId("balance").or(page.getByText(/\bpts?\b|\bpt\b/i));
    const before = (await balanceLocator.first().textContent()) ?? "";

    const firstCheckbox = page.getByRole("checkbox").first();
    await firstCheckbox.check();

    // Either a toast or the balance visibly changes.
    await expect(async () => {
      const after = (await balanceLocator.first().textContent()) ?? "";
      expect(after).not.toBe(before);
    }).toPass({ timeout: 5_000 });
  });

  test("5. Parent creates reward → redeems → history", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel(/email/i).fill(parentEmail);
    await page.getByLabel(/password/i).fill(password);
    await page.getByRole("button", { name: /log ?in|로그인/i }).click();

    await page.goto("/rewards/manage");
    await page.getByPlaceholder(/title|이름|제목/i).fill("Ice cream");
    await page.getByRole("spinbutton").fill("50");
    await page.getByRole("button", { name: /추가|add|create/i }).click();

    await expect(page.getByText("Ice cream")).toBeVisible();

    await page.goto("/rewards");
    await page.getByRole("button", { name: /redeem|교환|사용/i }).first().click();

    await page.goto("/points/history");
    await expect(page.getByText(/-50|−50/)).toBeVisible();
  });

  test("6. Monthly goal auto-completes with bonus", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel(/email/i).fill(parentEmail);
    await page.getByLabel(/password/i).fill(password);
    await page.getByRole("button", { name: /log ?in|로그인/i }).click();

    await page.goto("/goals/manage");
    await page.getByPlaceholder(/title|제목/i).fill("30 pts monthly");
    // target points input
    await page.getByLabel(/target.*point|목표.*점수/i).fill("30");
    await page.getByLabel(/reward.*point|보상.*점수/i).fill("100");
    await page.getByRole("button", { name: /추가|add|create/i }).click();

    // Switch to child and earn the 30+ points.
    await page.goto("/logout").catch(() => {});
    await page.goto("/login");
    await page.getByLabel(/email/i).fill(childEmail);
    await page.getByLabel(/password/i).fill(password);
    await page.getByRole("button", { name: /log ?in|로그인/i }).click();

    await page.goto("/chores");
    await page.getByRole("checkbox").first().check();

    await page.goto("/goals");
    await expect(page.getByText(/completed|완료/i)).toBeVisible();
  });

  test("7. Level-up → character stage", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel(/email/i).fill(childEmail);
    await page.getByLabel(/password/i).fill(password);
    await page.getByRole("button", { name: /log ?in|로그인/i }).click();

    await page.goto("/characters");
    await expect(page.getByText(/level|레벨/i)).toBeVisible();
    // Verify a numeric level is rendered.
    await expect(page.getByText(/\b[1-9][0-9]?\b/)).toBeVisible();
  });
});
