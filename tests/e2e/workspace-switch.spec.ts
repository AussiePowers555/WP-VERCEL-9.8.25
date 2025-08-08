import { test, expect } from '@playwright/test';

test.describe('Workspace Switching', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto('/login');
    await page.fill('input[name="email"]', 'whitepointer2016@gmail.com');
    await page.fill('input[name="password"]', 'Tr@ders84');
    await page.click('button[type="submit"]');
    await page.waitForURL('/');
  });

  test('admin sees Main Workspace by default', async ({ page }) => {
    // Verify Main Workspace is displayed in header
    await expect(page.locator('header')).toContainText('Main Workspace');
    
    // Verify admin badge is visible
    await expect(page.getByText('Administrator')).toBeVisible();
  });

  test('admin can switch to a specific workspace', async ({ page }) => {
    // Navigate to workspaces page
    await page.goto('/workspaces');
    
    // Create a test workspace first
    await page.goto('/contacts');
    await page.getByRole('button', { name: /add contact/i }).click();
    
    await page.fill('input[name="name"]', 'Test Insurance Co');
    await page.fill('input[name="email"]', 'test@insurance.com');
    await page.selectOption('select[name="type"]', 'Insurer');
    await page.fill('input[name="phone"]', '1800 999 888');
    await page.fill('input[name="company"]', 'Test Insurance Company');
    
    await page.click('button[type="submit"]');
    
    // Close credentials modal
    await page.getByRole('button', { name: /close/i }).click();
    
    // Go to workspaces page
    await page.goto('/workspaces');
    
    // Click on the Test Insurance workspace
    await page.getByRole('button', { name: /test insurance/i }).click();
    
    // Verify workspace name changes in header
    await expect(page.locator('header')).toContainText('Insurer: Test Insurance Co Workspace');
    
    // Verify Back to Main button appears
    await expect(page.getByRole('button', { name: /back to main/i })).toBeVisible();
  });

  test('Back to Main button returns to main workspace', async ({ page }) => {
    // Navigate to workspaces and select one
    await page.goto('/workspaces');
    
    // Assuming at least one workspace exists, click the first one
    const firstWorkspace = page.locator('button[role="button"]').first();
    await firstWorkspace.click();
    
    // Verify we're in a specific workspace (not Main)
    await expect(page.locator('header')).not.toContainText('Main Workspace');
    
    // Click Back to Main
    await page.getByRole('button', { name: /back to main/i }).click();
    
    // Verify we're back in Main Workspace
    await expect(page.locator('header')).toContainText('Main Workspace');
  });

  test('workspace context persists across page navigation', async ({ page }) => {
    // Switch to a workspace
    await page.goto('/workspaces');
    const firstWorkspace = page.locator('button[role="button"]').first();
    await firstWorkspace.click();
    
    // Get the workspace name
    const workspaceName = await page.locator('header h1').textContent();
    
    // Navigate to different pages
    await page.goto('/cases');
    await expect(page.locator('header h1')).toHaveText(workspaceName || '');
    
    await page.goto('/fleet');
    await expect(page.locator('header h1')).toHaveText(workspaceName || '');
    
    await page.goto('/contacts');
    await expect(page.locator('header h1')).toHaveText(workspaceName || '');
  });

  test('workspace filtering affects case and bike visibility', async ({ page }) => {
    // In Main Workspace, count total cases
    await page.goto('/cases');
    const totalCases = await page.locator('[data-test="case-row"]').count();
    
    // Switch to a specific workspace
    await page.goto('/workspaces');
    const firstWorkspace = page.locator('button[role="button"]').first();
    await firstWorkspace.click();
    
    // Count cases in specific workspace (should be less than or equal to total)
    await page.goto('/cases');
    const workspaceCases = await page.locator('[data-test="case-row"]').count();
    expect(workspaceCases).toBeLessThanOrEqual(totalCases);
  });

  test('keyboard shortcut Alt+M returns to main workspace', async ({ page }) => {
    // Switch to a workspace
    await page.goto('/workspaces');
    const firstWorkspace = page.locator('button[role="button"]').first();
    await firstWorkspace.click();
    
    // Verify we're in a specific workspace
    await expect(page.locator('header')).not.toContainText('Main Workspace');
    
    // Press Alt+M
    await page.keyboard.press('Alt+M');
    
    // Verify we're back in Main Workspace
    await expect(page.locator('header')).toContainText('Main Workspace');
  });
});

test.describe('Workspace User Access', () => {
  test('workspace user sees only their workspace', async ({ page }) => {
    // Login as a workspace user
    await page.goto('/login');
    await page.fill('input[name="email"]', 'workspace.user@example.com');
    await page.fill('input[name="password"]', 'WorkspacePass123!');
    await page.click('button[type="submit"]');
    
    // Should see their specific workspace name
    await expect(page.locator('header')).toContainText('Workspace');
    
    // Should NOT see Main Workspace
    await expect(page.locator('header')).not.toContainText('Main Workspace');
    
    // Should NOT see Back to Main button
    await expect(page.getByRole('button', { name: /back to main/i })).not.toBeVisible();
    
    // Should NOT see Administrator badge
    await expect(page.getByText('Administrator')).not.toBeVisible();
  });

  test('workspace user cannot access workspace switching', async ({ page }) => {
    // Login as workspace user
    await page.goto('/login');
    await page.fill('input[name="email"]', 'workspace.user@example.com');
    await page.fill('input[name="password"]', 'WorkspacePass123!');
    await page.click('button[type="submit"]');
    
    // Try to navigate to workspaces page
    await page.goto('/workspaces');
    
    // Should be redirected or show access denied
    await expect(page.locator('body')).toContainText(/access denied|unauthorized/i);
  });
});