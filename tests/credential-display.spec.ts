import { test, expect } from '@playwright/test';

test.describe('Enhanced Credential Display System', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page
    await page.goto('/login');
    
    // Login as admin
    await page.fill('input[type="email"]', 'admin@example.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    // Wait for dashboard to load
    await page.waitForURL('**/dashboard');
  });

  test('should display enhanced credential modal when creating a user', async ({ page }) => {
    // Navigate to users page
    await page.goto('/admin/users');
    
    // Click add user button
    await page.click('text=Add User');
    
    // Fill in user details
    await page.fill('input[id="email"]', 'testuser@example.com');
    await page.selectOption('select[name="role"]', 'workspace_user');
    
    // Submit form
    await page.click('button:has-text("Create User")');
    
    // Wait for modal to appear
    await page.waitForSelector('text=User Created Successfully!');
    
    // Verify credential fields are displayed
    await expect(page.locator('text=Login URL')).toBeVisible();
    await expect(page.locator('text=Username')).toBeVisible();
    await expect(page.locator('text=Password')).toBeVisible();
    
    // Verify copy buttons are present
    const copyButtons = page.locator('button:has-text("Copy")');
    await expect(copyButtons).toHaveCount(3); // Individual field copy buttons
    
    // Verify action buttons
    await expect(page.locator('button:has-text("Copy All")')).toBeVisible();
    await expect(page.locator('button:has-text("Print")')).toBeVisible();
    await expect(page.locator('button:has-text("Copy as JSON")')).toBeVisible();
    await expect(page.locator('button:has-text("WhatsApp")')).toBeVisible();
  });

  test('should copy credentials to clipboard', async ({ page, context }) => {
    // Grant clipboard permissions
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    
    // Navigate to users page
    await page.goto('/admin/users');
    
    // Create a test user
    await page.click('text=Add User');
    await page.fill('input[id="email"]', 'clipboard-test@example.com');
    await page.selectOption('select[name="role"]', 'workspace_user');
    await page.click('button:has-text("Create User")');
    
    // Wait for modal
    await page.waitForSelector('text=User Created Successfully!');
    
    // Test copy individual field (password)
    const passwordCopyButton = page.locator('button').filter({ hasText: /^Copy$/ }).nth(2);
    await passwordCopyButton.click();
    
    // Verify feedback
    await expect(page.locator('text=Password copied')).toBeVisible();
    
    // Test copy all
    await page.click('button:has-text("Copy All")');
    await expect(page.locator('text=Credentials copied')).toBeVisible();
  });

  test('should mark credentials as distributed', async ({ page }) => {
    // Navigate to users page
    await page.goto('/admin/users');
    
    // Create a test user
    await page.click('text=Add User');
    await page.fill('input[id="email"]', 'distribution-test@example.com');
    await page.selectOption('select[name="role"]', 'workspace_user');
    await page.click('button:has-text("Create User")');
    
    // Wait for modal
    await page.waitForSelector('text=User Created Successfully!');
    
    // Add distribution notes
    await page.fill('textarea[id="notes"]', 'Sent via WhatsApp to John on test date');
    
    // Mark as distributed
    await page.click('button:has-text("Mark as Shared")');
    
    // Verify confirmation
    await expect(page.locator('text=Credentials marked as distributed')).toBeVisible();
  });

  test('should handle workspace creation with credentials', async ({ page }) => {
    // Navigate to workspaces page
    await page.goto('/workspaces');
    
    // Click new workspace
    await page.click('text=New Workspace');
    
    // Fill workspace details
    await page.fill('input[name="name"]', 'Test Law Firm');
    await page.fill('input[name="email"]', 'admin@testlawfirm.com');
    await page.fill('input[name="password"]', 'TestPass123!');
    
    // Submit
    await page.click('button:has-text("Create Workspace")');
    
    // Verify credential modal appears
    await page.waitForSelector('text=User Created Successfully!');
    await expect(page.locator('text=Test Law Firm')).toBeVisible();
  });

  test('should print credentials', async ({ page }) => {
    // Navigate to users page  
    await page.goto('/admin/users');
    
    // Create a test user
    await page.click('text=Add User');
    await page.fill('input[id="email"]', 'print-test@example.com');
    await page.selectOption('select[name="role"]', 'workspace_user');
    await page.click('button:has-text("Create User")');
    
    // Wait for modal
    await page.waitForSelector('text=User Created Successfully!');
    
    // Mock print dialog
    await page.evaluate(() => {
      window.print = () => {
        console.log('Print dialog opened');
        return true;
      };
    });
    
    // Click print button
    await page.click('button:has-text("Print")');
    
    // Verify toast notification
    await expect(page.locator('text=Print dialog opened')).toBeVisible();
  });

  test('should handle mobile fallback for clipboard', async ({ page, browserName }) => {
    // Skip for non-mobile browsers
    if (browserName !== 'webkit') {
      test.skip();
    }
    
    // Navigate to users page
    await page.goto('/admin/users');
    
    // Create a test user
    await page.click('text=Add User');
    await page.fill('input[id="email"]', 'mobile-test@example.com');
    await page.selectOption('select[name="role"]', 'workspace_user');
    await page.click('button:has-text("Create User")');
    
    // Wait for modal
    await page.waitForSelector('text=User Created Successfully!');
    
    // Test copy with fallback
    await page.click('button:has-text("Copy All")');
    
    // Should still show success even with fallback
    await expect(page.locator('text=copied').first()).toBeVisible();
  });
});