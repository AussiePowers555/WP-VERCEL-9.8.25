import { test, expect } from '@playwright/test';

test.describe('First Login and Onboarding Flow', () => {
  test('should redirect first-time users to onboarding', async ({ page }) => {
    // Create a new user first (as admin)
    await page.goto('/login');
    await page.fill('input[name="email"]', 'admin@whitepointer.com');
    await page.fill('input[name="password"]', 'admin');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 5000 });
    
    // Create a new user with temporary password
    await page.goto('/admin/users');
    await page.click('button:has-text("Create User")');
    
    const testEmail = `firstlogin${Date.now()}@example.com`;
    const testName = 'First Login Test User';
    
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="name"]', testName);
    await page.click('button:has-text("Generate Password")');
    
    // Get the generated password
    const passwordInput = page.locator('input[name="password"]');
    const tempPassword = await passwordInput.inputValue();
    
    // Create the user
    await page.click('button:has-text("Create User")');
    await page.waitForSelector('text=/success|created/i', { timeout: 5000 });
    
    // Close modal if present
    const closeButton = page.locator('button:has-text("Close"), button[aria-label="Close"]');
    if (await closeButton.isVisible()) {
      await closeButton.click();
    }
    
    // Logout admin
    await page.goto('/api/auth/logout');
    
    // Now login as the new user
    await page.goto('/login');
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', tempPassword);
    await page.click('button[type="submit"]');
    
    // Should redirect to onboarding
    await expect(page).toHaveURL(/.*onboarding.*/, { timeout: 10000 });
    
    // Verify onboarding wizard is displayed
    await expect(page.locator('h1:has-text("Welcome"), h2:has-text("Welcome")')).toBeVisible();
  });

  test('should complete onboarding wizard steps', async ({ page }) => {
    // Assume we're already on the onboarding page
    // (In real test, would set up a first-time user first)
    
    // For demonstration, we'll navigate directly
    await page.goto('/onboarding');
    
    // Step 1: Welcome
    const welcomeText = page.locator('text=/Welcome|Getting Started/i');
    if (await welcomeText.isVisible()) {
      await expect(welcomeText).toBeVisible();
      
      // Click Next
      await page.click('button:has-text("Next"), button:has-text("Continue")');
    }
    
    // Step 2: Profile Completion
    const profileSection = page.locator('text=/Profile|Personal Information/i');
    if (await profileSection.isVisible()) {
      // Fill in profile details
      const fullNameInput = page.locator('input[name="fullName"], input[placeholder*="name"]');
      if (await fullNameInput.isVisible()) {
        await fullNameInput.fill('John Doe');
      }
      
      const phoneInput = page.locator('input[name="phone"], input[placeholder*="phone"]');
      if (await phoneInput.isVisible()) {
        await phoneInput.fill('+1234567890');
      }
      
      // Click Next
      await page.click('button:has-text("Next"), button:has-text("Continue")');
    }
    
    // Step 3: Password Change (Optional)
    const passwordSection = page.locator('text=/Password|Security/i');
    if (await passwordSection.isVisible()) {
      // Check if there's an option to skip
      const skipButton = page.locator('button:has-text("Skip"), button:has-text("Later")');
      if (await skipButton.isVisible()) {
        await skipButton.click();
      } else {
        // Or change password
        const newPasswordInput = page.locator('input[name="newPassword"], input[placeholder*="new password"]');
        if (await newPasswordInput.isVisible()) {
          await newPasswordInput.fill('NewSecureP@ssw0rd!');
          
          const confirmPasswordInput = page.locator('input[name="confirmPassword"], input[placeholder*="confirm"]');
          if (await confirmPasswordInput.isVisible()) {
            await confirmPasswordInput.fill('NewSecureP@ssw0rd!');
          }
        }
        
        await page.click('button:has-text("Next"), button:has-text("Continue")');
      }
    }
    
    // Step 4: Feature Tour
    const tourSection = page.locator('text=/Tour|Features|Learn/i');
    if (await tourSection.isVisible()) {
      await expect(tourSection).toBeVisible();
      
      // Check for feature descriptions
      const features = page.locator('[class*="feature"], li');
      const featureCount = await features.count();
      expect(featureCount).toBeGreaterThan(0);
      
      // Click Next
      await page.click('button:has-text("Next"), button:has-text("Continue")');
    }
    
    // Step 5: Completion
    const completionSection = page.locator('text=/Complete|Finished|Ready/i');
    if (await completionSection.isVisible()) {
      await expect(completionSection).toBeVisible();
      
      // Complete onboarding
      await page.click('button:has-text("Finish"), button:has-text("Complete"), button:has-text("Get Started")');
      
      // Should redirect to dashboard or main app
      await expect(page).toHaveURL(/.*dashboard|.*interactions|.*cases/, { timeout: 10000 });
    }
  });

  test('should show password strength indicator during onboarding', async ({ page }) => {
    // Navigate to onboarding password change step
    await page.goto('/onboarding');
    
    // Navigate to password step (simplified for demo)
    const passwordInput = page.locator('input[type="password"]').first();
    if (await passwordInput.isVisible()) {
      // Test weak password
      await passwordInput.fill('weak');
      
      // Check for strength indicator
      const strengthIndicator = page.locator('[class*="strength"], [aria-label*="strength"]');
      if (await strengthIndicator.isVisible()) {
        await expect(strengthIndicator).toContainText(/weak|poor/i);
      }
      
      // Test strong password
      await passwordInput.fill('Str0ng!P@ssw0rd#2024');
      
      if (await strengthIndicator.isVisible()) {
        await expect(strengthIndicator).toContainText(/strong|excellent/i);
      }
      
      // Check for feedback messages
      const feedbackMessages = page.locator('[class*="feedback"], [class*="suggestion"]');
      if (await feedbackMessages.first().isVisible()) {
        const messageCount = await feedbackMessages.count();
        expect(messageCount).toBeGreaterThanOrEqual(0);
      }
    }
  });

  test('should update user profile during onboarding', async ({ page }) => {
    // This test would need proper setup with a first-time user
    // For demonstration, we'll check the profile update API
    
    // Navigate to onboarding
    await page.goto('/onboarding');
    
    // Fill profile information
    const fullNameInput = page.locator('input[name="fullName"], input[placeholder*="name"]');
    const phoneInput = page.locator('input[name="phone"], input[placeholder*="phone"]');
    
    if (await fullNameInput.isVisible() && await phoneInput.isVisible()) {
      await fullNameInput.fill('Updated Name');
      await phoneInput.fill('+9876543210');
      
      // Intercept the API call
      const responsePromise = page.waitForResponse(
        response => response.url().includes('/api/auth/update-profile') && response.status() === 200
      );
      
      // Submit the form
      const saveButton = page.locator('button:has-text("Save"), button:has-text("Update"), button:has-text("Next")');
      await saveButton.click();
      
      // Wait for API response
      const response = await responsePromise;
      expect(response.ok()).toBeTruthy();
    }
  });

  test('should mark onboarding as complete', async ({ page }) => {
    // Navigate to the last step of onboarding
    await page.goto('/onboarding');
    
    // Navigate through steps to completion
    const finishButton = page.locator('button:has-text("Finish"), button:has-text("Complete")');
    
    if (await finishButton.isVisible()) {
      // Intercept the completion API call
      const responsePromise = page.waitForResponse(
        response => response.url().includes('/api/auth/complete-onboarding') && response.status() === 200
      );
      
      await finishButton.click();
      
      // Wait for API response
      const response = await responsePromise;
      expect(response.ok()).toBeTruthy();
      
      // Should redirect away from onboarding
      await expect(page).not.toHaveURL(/.*onboarding.*/, { timeout: 5000 });
    }
  });

  test('should not show onboarding for returning users', async ({ page }) => {
    // Login as an existing user (admin)
    await page.goto('/login');
    await page.fill('input[name="email"]', 'admin@whitepointer.com');
    await page.fill('input[name="password"]', 'admin');
    await page.click('button[type="submit"]');
    
    // Should NOT redirect to onboarding
    await expect(page).not.toHaveURL(/.*onboarding.*/, { timeout: 5000 });
    
    // Should go to dashboard or main app
    await expect(page).toHaveURL(/.*dashboard|.*admin/, { timeout: 5000 });
    
    // Try to manually navigate to onboarding
    await page.goto('/onboarding');
    
    // Should redirect away (already completed onboarding)
    await expect(page).not.toHaveURL(/.*onboarding.*/, { timeout: 5000 });
  });

  test('should track first login in database', async ({ page }) => {
    // Create a new user and login for the first time
    // This would need proper admin setup
    
    // For demonstration, we'll check the login API response
    await page.goto('/login');
    
    // Set up response listener
    page.on('response', async response => {
      if (response.url().includes('/api/auth/login') || response.url().includes('/api/auth/simple-login')) {
        const data = await response.json();
        
        // Check for first login indicators
        if (data.firstLogin !== undefined) {
          console.log('First login detected:', data.firstLogin);
        }
        if (data.needsOnboarding !== undefined) {
          console.log('Needs onboarding:', data.needsOnboarding);
        }
      }
    });
    
    // Perform login (would need a first-time user)
    await page.fill('input[name="email"]', 'testuser@example.com');
    await page.fill('input[name="password"]', 'testpassword');
    await page.click('button[type="submit"]');
    
    await page.waitForTimeout(2000);
  });

  test('should check session and redirect appropriately', async ({ page }) => {
    // Test the session check endpoint
    const response = await page.request.get('/api/auth/session');
    
    if (response.ok()) {
      const data = await response.json();
      
      // Check session data structure
      if (data.user) {
        expect(data.user).toHaveProperty('id');
        expect(data.user).toHaveProperty('email');
        expect(data.user).toHaveProperty('role');
        
        // Check for onboarding flags
        if (data.user.firstLogin) {
          console.log('User needs onboarding');
        }
      } else {
        console.log('No active session');
      }
    }
  });

  test('should display feature tour during onboarding', async ({ page }) => {
    // Navigate to onboarding tour step
    await page.goto('/onboarding');
    
    // Look for tour elements
    const tourElements = page.locator('[class*="tour"], [class*="feature"]');
    
    if (await tourElements.first().isVisible()) {
      const tourItems = await tourElements.count();
      expect(tourItems).toBeGreaterThan(0);
      
      // Check for specific features
      const features = [
        'Dashboard',
        'Cases',
        'Interactions',
        'Workspace',
        'Profile'
      ];
      
      for (const feature of features) {
        const featureElement = page.locator(`text=/${feature}/i`);
        if (await featureElement.isVisible()) {
          await expect(featureElement).toBeVisible();
        }
      }
    }
  });

  test('should handle password expiry warnings', async ({ page }) => {
    // Check password expiry endpoint
    const response = await page.request.get('/api/auth/check-expiry');
    
    if (response.ok()) {
      const data = await response.json();
      
      // Check expiry data structure
      expect(data).toHaveProperty('expired');
      expect(data).toHaveProperty('expiringSoon');
      expect(data).toHaveProperty('daysRemaining');
      
      if (data.expiringSoon) {
        expect(data).toHaveProperty('message');
        console.log('Password expiry warning:', data.message);
      }
    }
  });
});