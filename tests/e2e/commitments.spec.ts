import { test, expect } from '@playwright/test';

test.describe('Commitments Page', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate directly to commitments page - assuming dev server is running
    await page.goto('http://localhost:3000/commitments', { waitUntil: 'domcontentloaded' });
  });

  test('should load commitments page without errors', async ({ page }) => {
    // Wait for page to load
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    
    // Verify no error messages appear
    const errorMessage = page.locator('text=/failed to load|error|unable to fetch/i');
    await expect(errorMessage).not.toBeVisible();
    
    // Verify the page loaded successfully with title (checking for h1 or h2)
    await expect(page.locator('h1:has-text("Commitments"), h2:has-text("Commitments")')).toBeVisible();
    
    // Verify New Commitment button is visible
    await expect(page.locator('button').filter({ hasText: 'New Commitment' })).toBeVisible();
  });

  test('should create and save a new commitment', async ({ page }) => {
    // Wait for page to load
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    
    // Click on "New Commitment" or "Add Commitment" button
    const newCommitmentButton = page.locator('button').filter({ 
      hasText: /new commitment|add commitment|create commitment/i 
    });
    
    if (await newCommitmentButton.isVisible()) {
      await newCommitmentButton.click();
      
      // Fill in commitment form
      await page.fill('input[name="title"], input[placeholder*="title"]', 'Test Commitment');
      await page.fill('textarea[name="description"], textarea[placeholder*="description"]', 'Test commitment description');
      
      // Set amount if field exists
      const amountField = page.locator('input[name="amount"], input[placeholder*="amount"]');
      if (await amountField.isVisible()) {
        await amountField.fill('1000');
      }
      
      // Set date if field exists
      const dateField = page.locator('input[type="date"]');
      if (await dateField.isVisible()) {
        const today = new Date().toISOString().split('T')[0];
        await dateField.fill(today);
      }
      
      // Save the commitment
      await page.click('button:has-text("Save"), button:has-text("Create"), button:has-text("Submit")');
      
      // Wait for save to complete
      await page.waitForLoadState('networkidle');
      
      // Verify no errors
      const errorMessage = page.locator('text=/error|failed/i');
      await expect(errorMessage).not.toBeVisible();
      
      // Verify success message or that commitment appears in list
      const successIndicator = page.locator('text=/success|saved|created/i, text="Test Commitment"');
      await expect(successIndicator).toBeVisible();
    }
  });

  test('should display commitments list without errors', async ({ page }) => {
    // Wait for content to load
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    
    // Check that either a table or "no commitments" message appears
    const tableVisible = await page.locator('table').isVisible().catch(() => false);
    const noCommitmentsVisible = await page.locator('text=/no commitments/i').isVisible().catch(() => false);
    expect(tableVisible || noCommitmentsVisible).toBeTruthy();
    
    // Ensure no error state
    const errorState = page.locator('.error, [data-error], text=/error|failed to load/i');
    await expect(errorState).not.toBeVisible();
  });
});