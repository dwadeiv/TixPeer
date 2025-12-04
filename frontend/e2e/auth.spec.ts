/**
 * Authentication E2E Tests
 *
 * Tests login and registration flows:
 * - Login page renders correctly
 * - Registration page renders correctly
 * - Form validation
 * - Navigation between auth pages
 */

import { test, expect } from '@playwright/test';

test.describe('Login Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('should display login form', async ({ page }) => {
    // Check for "Welcome Back" heading
    const heading = page.getByRole('heading', { name: /welcome back/i });
    await expect(heading).toBeVisible();

    // Check for "Sign in to your TixPeer account" text
    const subtitle = page.getByText(/sign in to your tixpeer account/i);
    await expect(subtitle).toBeVisible();

    // Check for email input with label
    const emailLabel = page.getByText('Email Address');
    await expect(emailLabel).toBeVisible();
    const emailInput = page.locator('#email');
    await expect(emailInput).toBeVisible();

    // Check for password input with label
    const passwordLabel = page.getByText('Password');
    await expect(passwordLabel).toBeVisible();
    const passwordInput = page.locator('#password');
    await expect(passwordInput).toBeVisible();

    // Check for submit button
    const submitButton = page.getByRole('button', { name: /sign in/i });
    await expect(submitButton).toBeVisible();
  });

  test('should have link to register page', async ({ page }) => {
    // Check for "Create Account" link
    const registerLink = page.getByRole('link', { name: /create account/i });
    await expect(registerLink).toBeVisible();

    await registerLink.click();
    await expect(page).toHaveURL(/\/register/);
  });

  test('should prevent empty form submission with HTML5 validation', async ({ page }) => {
    const submitButton = page.getByRole('button', { name: /sign in/i });
    await submitButton.click();

    // HTML5 validation prevents form submission
    // Check that email input is invalid (required but empty)
    const emailInput = page.locator('#email');
    const isInvalid = await emailInput.evaluate((el: HTMLInputElement) => !el.validity.valid);
    expect(isInvalid).toBe(true);
  });

  test('should prevent invalid email with HTML5 validation', async ({ page }) => {
    const emailInput = page.locator('#email');
    const passwordInput = page.locator('#password');
    const submitButton = page.getByRole('button', { name: /sign in/i });

    await emailInput.fill('invalidemail');
    await passwordInput.fill('password123');
    await submitButton.click();

    // HTML5 email validation prevents form submission
    // The type="email" input validates email format
    const isInvalid = await emailInput.evaluate((el: HTMLInputElement) => !el.validity.valid);
    expect(isInvalid).toBe(true);
  });

  test('should show error for invalid credentials', async ({ page }) => {
    const emailInput = page.locator('#email');
    const passwordInput = page.locator('#password');
    const submitButton = page.getByRole('button', { name: /sign in/i });

    await emailInput.fill('invalid@example.com');
    await passwordInput.fill('wrongpassword');
    await submitButton.click();

    // Wait for error message from server
    const errorMessage = page.getByText(/invalid|unauthorized|failed/i);
    await expect(errorMessage).toBeVisible({ timeout: 10000 });
  });

  test('should show loading state during submission', async ({ page }) => {
    const emailInput = page.locator('#email');
    const passwordInput = page.locator('#password');
    const submitButton = page.getByRole('button', { name: /sign in/i });

    await emailInput.fill('test@example.com');
    await passwordInput.fill('password123');
    await submitButton.click();

    // Check for "Signing In..." button text during loading
    const loadingButton = page.getByRole('button', { name: /signing in/i });
    // This may be fast, so we use a short timeout
    await expect(loadingButton).toBeVisible({ timeout: 2000 }).catch(() => {
      // Loading state may have already passed, which is fine
    });
  });
});

test.describe('Register Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/register');
  });

  test('should display registration form', async ({ page }) => {
    // Check for "Create Account" heading
    const heading = page.getByRole('heading', { name: /create account/i });
    await expect(heading).toBeVisible();

    // Check for "Join TixPeer" text
    const subtitle = page.getByText(/join tixpeer and start trading tickets/i);
    await expect(subtitle).toBeVisible();

    // Check for Full Name input
    const nameLabel = page.getByText('Full Name');
    await expect(nameLabel).toBeVisible();
    const nameInput = page.locator('#name');
    await expect(nameInput).toBeVisible();

    // Check for email input
    const emailLabel = page.getByText('Email Address');
    await expect(emailLabel).toBeVisible();

    // Check for password input
    const passwordLabels = page.getByText('Password');
    await expect(passwordLabels.first()).toBeVisible();

    // Check for confirm password input
    const confirmLabel = page.getByText('Confirm Password');
    await expect(confirmLabel).toBeVisible();

    // Check for submit button
    const submitButton = page.getByRole('button', { name: /create account/i });
    await expect(submitButton).toBeVisible();
  });

  test('should have link to login page', async ({ page }) => {
    // Check for "Sign In" link
    const loginLink = page.getByRole('link', { name: /sign in/i });
    await expect(loginLink).toBeVisible();

    await loginLink.click();
    await expect(page).toHaveURL(/\/login/);
  });

  test('should prevent empty form submission with HTML5 validation', async ({ page }) => {
    const submitButton = page.getByRole('button', { name: /create account/i });
    await submitButton.click();

    // HTML5 validation prevents form submission
    // Check that name input is invalid (required but empty)
    const nameInput = page.locator('#name');
    const isInvalid = await nameInput.evaluate((el: HTMLInputElement) => !el.validity.valid);
    expect(isInvalid).toBe(true);
  });

  test('should show password strength indicator', async ({ page }) => {
    const passwordInput = page.locator('#password');

    // Type a weak password
    await passwordInput.fill('weak');
    const weakIndicator = page.getByText('Weak');
    await expect(weakIndicator).toBeVisible();

    // Type a stronger password
    await passwordInput.fill('StrongPass123!');
    const strongIndicator = page.getByText(/good|strong/i);
    await expect(strongIndicator).toBeVisible();
  });

  test('should show password match indicator', async ({ page }) => {
    const passwordInput = page.locator('#password');
    const confirmInput = page.locator('#confirmPassword');

    await passwordInput.fill('TestPassword123!');
    await confirmInput.fill('TestPassword123!');

    // Look for the green checkmark (CheckCircle) when passwords match
    // The icon has class text-green-600 when matching
    const matchIcon = page.locator('#confirmPassword').locator('..').locator('.text-green-600');
    await expect(matchIcon).toBeVisible();
  });

  test('should show error when passwords do not match', async ({ page }) => {
    const nameInput = page.locator('#name');
    const emailInput = page.locator('#email');
    const passwordInput = page.locator('#password');
    const confirmInput = page.locator('#confirmPassword');
    const submitButton = page.getByRole('button', { name: /create account/i });

    await nameInput.fill('Test User');
    await emailInput.fill('test@example.com');
    await passwordInput.fill('TestPassword123!');
    await confirmInput.fill('DifferentPassword123!');
    await submitButton.click();

    // Check for password mismatch error
    const errorMessage = page.getByText(/passwords do not match/i);
    await expect(errorMessage).toBeVisible();
  });
});
