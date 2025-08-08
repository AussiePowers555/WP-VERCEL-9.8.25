import { test, expect } from '@playwright/test';

test.describe('Contact Auto-Provisioning', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto('/login');
    await page.fill('input[name="email"]', 'whitepointer2016@gmail.com');
    await page.fill('input[name="password"]', 'Tr@ders84');
    await page.click('button[type="submit"]');
    
    // Wait for redirect to dashboard
    await page.waitForURL('/');
  });

  test('admin creates contact → workspace & user auto-generated', async ({ page }) => {
    // Navigate to contacts page
    await page.goto('/contacts');
    
    // Click on Add Contact button
    await page.getByRole('button', { name: /add contact/i }).click();
    
    // Fill in contact form
    await page.fill('input[name="name"]', 'Acme Insurance');
    await page.fill('input[name="email"]', 'claims@acme.com');
    await page.selectOption('select[name="type"]', 'Insurer');
    await page.fill('input[name="phone"]', '1800 123 456');
    await page.fill('input[name="company"]', 'Acme Insurance Co');
    await page.fill('textarea[name="address"]', '123 Insurance St, Sydney NSW 2000');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Check for credentials modal
    await expect(page.getByRole('dialog', { name: /workspace user created/i })).toBeVisible();
    
    // Verify credentials are displayed
    const username = await page.locator('[data-test="username"]').innerText();
    const tempPassword = await page.locator('[data-test="temp-password"]').innerText();
    expect(username).toBe('claims@acme.com');
    expect(tempPassword).not.toBe('');
    
    // Test copy credentials button
    await page.getByRole('button', { name: /copy all/i }).click();
    await expect(page.getByText(/copied!/i)).toBeVisible();
    
    // Close modal
    await page.getByRole('button', { name: /close/i }).click();
    
    // Verify contact appears in the list
    await page.selectOption('button[role="tab"]', 'Insurer');
    await expect(page.getByText('Acme Insurance')).toBeVisible();
  });

  test('send welcome email functionality', async ({ page }) => {
    // Navigate to contacts page
    await page.goto('/contacts');
    
    // Create a new contact
    await page.getByRole('button', { name: /add contact/i }).click();
    
    await page.fill('input[name="name"]', 'Test Lawyer');
    await page.fill('input[name="email"]', 'lawyer@test.com');
    await page.selectOption('select[name="type"]', 'Lawyer');
    await page.fill('input[name="phone"]', '02 9876 5432');
    await page.fill('input[name="company"]', 'Test Legal Services');
    
    await page.click('button[type="submit"]');
    
    // Wait for credentials modal
    await expect(page.getByRole('dialog', { name: /workspace user created/i })).toBeVisible();
    
    // Click send welcome email
    await page.getByRole('button', { name: /send welcome email/i }).click();
    
    // Expect success toast
    await expect(page.getByText(/welcome email sent/i)).toBeVisible();
    
    // Modal should close
    await expect(page.getByRole('dialog')).not.toBeVisible();
  });

  test('non-company contact types do not trigger auto-provisioning', async ({ page }) => {
    // Navigate to contacts page
    await page.goto('/contacts');
    
    // Create a client contact (should not trigger workspace creation)
    await page.getByRole('button', { name: /add contact/i }).click();
    
    await page.fill('input[name="name"]', 'John Doe');
    await page.fill('input[name="email"]', 'john@example.com');
    await page.selectOption('select[name="type"]', 'Client');
    await page.fill('input[name="phone"]', '0412 345 678');
    
    await page.click('button[type="submit"]');
    
    // Should not show credentials modal
    await expect(page.getByRole('dialog', { name: /workspace user created/i })).not.toBeVisible();
    
    // Should show success toast
    await expect(page.getByText(/contact added/i)).toBeVisible();
  });
});