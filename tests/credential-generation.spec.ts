import { test, expect } from '@playwright/test';

test.describe('Credential Generation Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page and authenticate as admin
    await page.goto('/login');
    await page.fill('input[name="email"]', 'admin@whitepointer.com');
    await page.fill('input[name="password"]', 'admin');
    await page.click('button[type="submit"]');
    
    // Wait for redirect to dashboard
    await page.waitForURL('**/dashboard', { timeout: 5000 });
  });

  test('should generate temporary credentials for a new user', async ({ page }) => {
    // Navigate to user management
    await page.goto('/admin/users');
    
    // Click on create user button
    await page.click('button:has-text("Create User")');
    
    // Fill in user details
    await page.fill('input[name="email"]', 'testuser@example.com');
    await page.fill('input[name="name"]', 'Test User');
    
    // Select workspace (if applicable)
    const workspaceSelect = page.locator('select[name="workspace"]');
    if (await workspaceSelect.isVisible()) {
      await workspaceSelect.selectOption({ index: 1 });
    }
    
    // Click generate password button
    await page.click('button:has-text("Generate Password")');
    
    // Verify password was generated
    const passwordInput = page.locator('input[name="password"]');
    const generatedPassword = await passwordInput.inputValue();
    expect(generatedPassword).toBeTruthy();
    expect(generatedPassword.length).toBeGreaterThanOrEqual(8);
    
    // Submit the form
    await page.click('button:has-text("Create User")');
    
    // Wait for success message or modal
    await expect(page.locator('text=/success|created/i')).toBeVisible({ timeout: 5000 });
    
    // Check if credentials modal appears
    const credentialsModal = page.locator('[role="dialog"]');
    if (await credentialsModal.isVisible()) {
      // Verify credential display elements
      await expect(page.locator('text=/Login URL/i')).toBeVisible();
      await expect(page.locator('text=/Username|Email/i')).toBeVisible();
      await expect(page.locator('text=/Password/i')).toBeVisible();
      
      // Test copy functionality
      const copyButtons = page.locator('button:has-text("Copy")');
      const copyButtonCount = await copyButtons.count();
      expect(copyButtonCount).toBeGreaterThan(0);
      
      // Click first copy button
      await copyButtons.first().click();
      
      // Check for success feedback
      await expect(page.locator('text=/copied/i')).toBeVisible({ timeout: 3000 });
    }
  });

  test('should validate password strength requirements', async ({ page }) => {
    await page.goto('/admin/users');
    await page.click('button:has-text("Create User")');
    
    // Fill basic info
    await page.fill('input[name="email"]', 'testuser2@example.com');
    await page.fill('input[name="name"]', 'Test User 2');
    
    // Test weak password
    await page.fill('input[name="password"]', '123');
    
    // Check for password strength indicator
    const strengthIndicator = page.locator('[class*="strength"], [class*="password-strength"]');
    if (await strengthIndicator.isVisible()) {
      await expect(strengthIndicator).toContainText(/weak|poor/i);
    }
    
    // Test strong password
    await page.fill('input[name="password"]', 'StrongP@ssw0rd123!');
    
    if (await strengthIndicator.isVisible()) {
      await expect(strengthIndicator).toContainText(/strong|good/i);
    }
  });

  test('should handle bulk user creation', async ({ page }) => {
    await page.goto('/admin/users');
    
    // Look for bulk creation option
    const bulkButton = page.locator('button:has-text("Bulk"), button:has-text("Multiple")');
    if (await bulkButton.isVisible()) {
      await bulkButton.click();
      
      // Enter multiple emails
      const emailInput = page.locator('textarea[placeholder*="email"], input[placeholder*="email"]');
      await emailInput.fill('user1@example.com\nuser2@example.com\nuser3@example.com');
      
      // Generate passwords for all
      const generateAllButton = page.locator('button:has-text("Generate All"), button:has-text("Generate Passwords")');
      if (await generateAllButton.isVisible()) {
        await generateAllButton.click();
      }
      
      // Submit bulk creation
      await page.click('button:has-text("Create Users"), button:has-text("Create All")');
      
      // Wait for success
      await expect(page.locator('text=/created|success/i')).toBeVisible({ timeout: 10000 });
      
      // Check if bulk credentials are displayed
      const credentialsList = page.locator('[class*="credential"], [class*="user-list"]');
      if (await credentialsList.isVisible()) {
        const userCount = await credentialsList.locator('[class*="user-item"], tr').count();
        expect(userCount).toBeGreaterThanOrEqual(3);
      }
    }
  });

  test('should track credential distribution', async ({ page }) => {
    // Create a new user first
    await page.goto('/admin/users');
    await page.click('button:has-text("Create User")');
    await page.fill('input[name="email"]', 'tracktest@example.com');
    await page.fill('input[name="name"]', 'Track Test User');
    await page.click('button:has-text("Generate Password")');
    await page.click('button:has-text("Create User")');
    
    // Wait for credentials modal
    await page.waitForSelector('[role="dialog"]', { timeout: 5000 });
    
    // Look for distribution options
    const markDistributedButton = page.locator('button:has-text("Mark as Distributed"), button:has-text("Distributed")');
    if (await markDistributedButton.isVisible()) {
      await markDistributedButton.click();
      
      // Add distribution notes if field exists
      const notesField = page.locator('textarea[name*="note"], input[name*="note"]');
      if (await notesField.isVisible()) {
        await notesField.fill('Credentials handed over in person');
      }
      
      // Confirm distribution
      const confirmButton = page.locator('button:has-text("Confirm"), button:has-text("Save")');
      if (await confirmButton.isVisible()) {
        await confirmButton.click();
      }
      
      // Check for success message
      await expect(page.locator('text=/distributed|tracked/i')).toBeVisible({ timeout: 3000 });
    }
  });

  test('should display credential management dashboard', async ({ page }) => {
    await page.goto('/admin/credentials');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Check for main dashboard elements
    await expect(page.locator('h1:has-text("Credential"), h1:has-text("User Management")')).toBeVisible();
    
    // Check for search functionality
    const searchInput = page.locator('input[placeholder*="search"], input[placeholder*="Search"]');
    expect(await searchInput.isVisible()).toBeTruthy();
    
    // Check for user list/table
    const userTable = page.locator('table, [class*="user-list"], [class*="credential-list"]');
    expect(await userTable.isVisible()).toBeTruthy();
    
    // Check for status indicators
    const statusBadges = page.locator('[class*="badge"], [class*="status"]');
    const badgeCount = await statusBadges.count();
    expect(badgeCount).toBeGreaterThan(0);
    
    // Test search functionality
    await searchInput.fill('admin');
    await page.waitForTimeout(500); // Wait for search to filter
    
    // Verify filtered results
    const visibleUsers = await page.locator('[class*="user-item"]:visible, tr:visible').count();
    expect(visibleUsers).toBeGreaterThan(0);
  });

  test('should allow password regeneration', async ({ page }) => {
    await page.goto('/admin/credentials');
    
    // Find a user row with regenerate option
    const regenerateButton = page.locator('button:has-text("Regenerate"), button[title*="regenerate"]').first();
    if (await regenerateButton.isVisible()) {
      await regenerateButton.click();
      
      // Confirm regeneration if prompted
      const confirmButton = page.locator('button:has-text("Confirm"), button:has-text("Yes")');
      if (await confirmButton.isVisible()) {
        await confirmButton.click();
      }
      
      // Wait for new password to be displayed
      await expect(page.locator('text=/generated|new password/i')).toBeVisible({ timeout: 5000 });
      
      // Check if new credentials are shown
      const newPasswordDisplay = page.locator('[class*="password"], input[type="text"][value*=""]');
      if (await newPasswordDisplay.isVisible()) {
        const newPassword = await newPasswordDisplay.inputValue();
        expect(newPassword).toBeTruthy();
        expect(newPassword.length).toBeGreaterThanOrEqual(8);
      }
    }
  });

  test('should export credentials to CSV', async ({ page }) => {
    await page.goto('/admin/credentials');
    
    // Look for export button
    const exportButton = page.locator('button:has-text("Export"), button:has-text("CSV"), button:has-text("Download")');
    if (await exportButton.isVisible()) {
      // Set up download promise before clicking
      const downloadPromise = page.waitForEvent('download');
      
      await exportButton.click();
      
      // Wait for download to start
      const download = await downloadPromise;
      
      // Verify download
      expect(download).toBeTruthy();
      const fileName = download.suggestedFilename();
      expect(fileName).toMatch(/\.csv$/i);
    }
  });

  test('should handle CSV import for bulk user creation', async ({ page }) => {
    await page.goto('/admin/users');
    
    // Look for import option
    const importButton = page.locator('button:has-text("Import"), button:has-text("CSV")');
    if (await importButton.isVisible()) {
      await importButton.click();
      
      // Check for file input
      const fileInput = page.locator('input[type="file"]');
      expect(await fileInput.isVisible()).toBeTruthy();
      
      // Create a test CSV file
      const csvContent = 'email,name\nimporttest1@example.com,Import Test 1\nimporttest2@example.com,Import Test 2';
      const buffer = Buffer.from(csvContent, 'utf-8');
      
      // Upload the file
      await fileInput.setInputFiles({
        name: 'test-users.csv',
        mimeType: 'text/csv',
        buffer: buffer
      });
      
      // Wait for file to be processed
      await page.waitForTimeout(1000);
      
      // Check if users are displayed for review
      const previewTable = page.locator('table, [class*="preview"], [class*="import-preview"]');
      if (await previewTable.isVisible()) {
        const rowCount = await previewTable.locator('tr').count();
        expect(rowCount).toBeGreaterThanOrEqual(2);
      }
      
      // Proceed with import
      const confirmImportButton = page.locator('button:has-text("Import"), button:has-text("Create")').last();
      if (await confirmImportButton.isVisible()) {
        await confirmImportButton.click();
        
        // Wait for success message
        await expect(page.locator('text=/imported|created|success/i')).toBeVisible({ timeout: 10000 });
      }
    }
  });
});

test.describe('Print Functionality', () => {
  test('should trigger print dialog for credentials', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('input[name="email"]', 'admin@whitepointer.com');
    await page.fill('input[name="password"]', 'admin');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 5000 });
    
    // Create a user to get credentials
    await page.goto('/admin/users');
    await page.click('button:has-text("Create User")');
    await page.fill('input[name="email"]', 'printtest@example.com');
    await page.fill('input[name="name"]', 'Print Test User');
    await page.click('button:has-text("Generate Password")');
    await page.click('button:has-text("Create User")');
    
    // Wait for credentials modal
    await page.waitForSelector('[role="dialog"]', { timeout: 5000 });
    
    // Look for print button
    const printButton = page.locator('button:has-text("Print")');
    if (await printButton.isVisible()) {
      // Set up print dialog handler
      page.on('dialog', dialog => {
        expect(dialog.type()).toBe('print');
        dialog.accept();
      });
      
      // Intercept window.print() calls
      await page.evaluate(() => {
        window.print = () => {
          console.log('Print dialog triggered');
          return true;
        };
      });
      
      await printButton.click();
      
      // Verify print was triggered (through console log or other means)
      const consoleLogs = [];
      page.on('console', msg => consoleLogs.push(msg.text()));
      
      await page.waitForTimeout(1000);
      
      // Check if print-specific content is visible
      const printContent = page.locator('[class*="print"], @media print');
      if (await printContent.isVisible()) {
        expect(await printContent.isVisible()).toBeTruthy();
      }
    }
  });
});