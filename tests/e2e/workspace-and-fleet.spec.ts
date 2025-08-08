import { test, expect } from '@playwright/test';

test.describe('Workspace + Fleet core flows', () => {
  test('dev login autofill, seed bikes, create contact unique email, generate temp password, first login change password', async ({ page }) => {
    // Go to login and autofill dev creds
    await page.goto('/login');
    await expect(page).toHaveURL(/login/);
    await page.getByRole('button', { name: /Auto-fill/i }).click();
    await page.getByRole('button', { name: /Sign In/i }).click();
    await page.waitForURL(/\/$/);

    // Go to Fleet and trigger import (idempotent)
    await page.goto('/fleet');
    await page.getByRole('button', { name: /Import From Backup/i }).click();
    await expect(page.getByText(/Available Bikes \(/)).toBeVisible();

    // Create contact with unique email
    const uniqueEmail = `playwright_${Date.now()}@example.com`;
    await page.goto('/contacts');
    await page.getByRole('button', { name: /Add Contact/i }).click();
    await page.getByLabel(/Name/i).fill('Playwright User');
    await page.getByLabel(/Company/i).fill('Test Co');
    await page.getByLabel(/Email/i).fill(uniqueEmail);
    await page.getByLabel(/Type/i).selectOption('Lawyer');
    await page.getByLabel(/Create Workspace Access/i).check();
    await page.getByRole('button', { name: /Create/i }).click();

    // Credentials modal should display temp password
    const tempPassword = await page.locator('text=Temporary Password').locator('xpath=following::p[1]').innerText();
    await page.getByRole('button', { name: /Close/i }).click();

    // Log out and test first login
    await page.goto('/login');
    await page.getByLabel(/Email/i).fill(uniqueEmail);
    await page.getByLabel(/Password/i).fill(tempPassword.trim());
    await page.getByRole('button', { name: /Sign In/i }).click();
    await page.waitForURL(/first-login/);

    // Change password
    await page.getByLabel(/New Password/i).fill('PwTest!2345');
    await page.getByLabel(/Confirm Password/i).fill('PwTest!2345');
    await page.getByRole('button', { name: /Set Password/i }).click();
    await page.waitForURL(/\/$/);

    // Duplicate email attempt blocked
    await page.goto('/contacts');
    await page.getByRole('button', { name: /Add Contact/i }).click();
    await page.getByLabel(/Email/i).fill(uniqueEmail);
    await page.getByRole('button', { name: /Create/i }).click();
    await expect(page.getByText(/already exists/i)).toBeVisible();
  });
});


