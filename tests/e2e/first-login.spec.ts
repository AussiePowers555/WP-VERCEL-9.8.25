import { test, expect } from '@playwright/test';

test.describe('First Login Flow', () => {
  // Create a test user with first_login = true
  const testEmail = 'testuser@example.com';
  const tempPassword = 'TempPass123!';
  const newPassword = 'NewSecurePass123!';

  test('workspace user first login forces password change', async ({ page }) => {
    // Attempt to login with temporary password
    await page.goto('/login');
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', tempPassword);
    await page.click('button[type="submit"]');
    
    // Should redirect to first-login page
    await expect(page).toHaveURL('/first-login');
    
    // Verify password change form is displayed
    await expect(page.getByText(/set your password/i)).toBeVisible();
    
    // Test password validation - too short
    await page.fill('input[id="password"]', 'short');
    await page.fill('input[id="confirmPassword"]', 'short');
    await page.click('button[type="submit"]');
    await expect(page.getByText(/must be at least 8 characters/i)).toBeVisible();
    
    // Test password mismatch
    await page.fill('input[id="password"]', 'Password123!');
    await page.fill('input[id="confirmPassword"]', 'DifferentPass123!');
    await page.click('button[type="submit"]');
    await expect(page.getByText(/passwords do not match/i)).toBeVisible();
    
    // Test password complexity
    await page.fill('input[id="password"]', 'simplepassword');
    await page.fill('input[id="confirmPassword"]', 'simplepassword');
    await page.click('button[type="submit"]');
    await expect(page.getByText(/must contain at least one uppercase/i)).toBeVisible();
    
    // Set valid password
    await page.fill('input[id="password"]', newPassword);
    await page.fill('input[id="confirmPassword"]', newPassword);
    await page.click('button[type="submit"]');
    
    // Should show success and redirect to dashboard
    await expect(page.getByText(/password changed successfully/i)).toBeVisible();
    await page.waitForURL('/');
  });

  test('subsequent login does not require password change', async ({ page }) => {
    // Login again with new password
    await page.goto('/login');
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', newPassword);
    await page.click('button[type="submit"]');
    
    // Should go directly to dashboard, not first-login
    await expect(page).toHaveURL('/');
    await expect(page).not.toHaveURL('/first-login');
  });

  test('unauthenticated access to first-login redirects to login', async ({ page }) => {
    // Try to access first-login page directly without authentication
    await page.goto('/first-login');
    
    // Should redirect to login page
    await expect(page).toHaveURL('/login');
  });
});