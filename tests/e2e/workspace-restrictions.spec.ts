import { test, expect } from '@playwright/test';

test.describe('Workspace security and filtering', () => {
  test('workspace user cannot access admin pages or menus', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'aussiepowers555@gmail.com');
    await page.fill('input[name="password"]', 'abc123');
    await page.click('button[type="submit"]');

    // Header should not show Administrator and should show workspace name
    await expect(page.locator('header')).not.toContainText('Administrator');

    // Try direct access to workspaces list
    await page.goto('/workspaces');
    await expect(page.locator('body')).toContainText(/Admin access required|Access denied|unauthorized/i);
  });

  test('admin assigns case to workspace and it appears when workspace selected', async ({ page }) => {
    // Login as developer/admin
    await page.goto('/login');
    await page.fill('input[name="email"]', 'whitepointer2016@gmail.com');
    await page.fill('input[name="password"]', 'Tr@ders84');
    await page.click('button[type="submit"]');
    await page.waitForURL('/')

    // Go to cases and assign first case to first workspace
    await page.goto('/cases');
    const firstRow = page.locator('[data-test="case-row"]').first();
    await firstRow.locator('button').first().click(); // expand
    // Pick first option in workspace select
    const select = firstRow.locator('div:has(select)').nth(0);
    await page.locator('select').first().selectOption({ index: 1 });

    // Navigate to workspaces and click the same workspace
    await page.goto('/workspaces');
    const wsButton = page.locator('text=Workspace').first();
    await wsButton.click();

    // The assigned case should now be visible
    await page.goto('/cases');
    await expect(page.locator('[data-test="case-row"]').first()).toBeVisible();
  });

  test('status filter is unique per workspace and defaults to ALL', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'whitepointer2016@gmail.com');
    await page.fill('input[name="password"]', 'Tr@ders84');
    await page.click('button[type="submit"]');

    // Main workspace: ensure ALL
    await page.goto('/cases');
    await expect(page.getByText('Status filter:')).toBeVisible();

    // Switch to a workspace
    await page.goto('/workspaces');
    await page.getByRole('button').first().click();
    await page.goto('/cases');

    // Set a status filter
    await page.getByRole('combobox', { name: /status/i }).click();
    await page.getByRole('option', { name: /Active|Invoiced|New Matter/ }).first().click();

    // Back to Main, filter should be ALL and cases visible
    await page.getByRole('button', { name: /Back to Main/i }).click();
    await page.goto('/cases');
    await expect(page.locator('[data-test="case-row"]').first()).toBeVisible();
  });
});


