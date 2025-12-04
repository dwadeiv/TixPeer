/**
 * Homepage E2E Tests
 *
 * Tests the main landing page functionality:
 * - Page loads correctly
 * - Navigation elements are present
 * - Location selector works
 * - Events section displays
 */

import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display the homepage', async ({ page }) => {
    // Check page title or main heading
    await expect(page).toHaveTitle(/TixPeer/i);
  });

  test('should have navigation header', async ({ page }) => {
    // Check for header navigation
    const header = page.locator('header');
    await expect(header).toBeVisible();

    // Check for logo/brand - TixPeer text in header
    const logo = page.locator('header').getByText('TixPeer');
    await expect(logo).toBeVisible();
  });

  test('should have user icon link when not authenticated', async ({ page }) => {
    // The header has a user icon button that links to /login when not authenticated
    const userButton = page.locator('header').locator('a[href="/login"]');
    await expect(userButton).toBeVisible();
  });

  test('should display location selector', async ({ page }) => {
    // Look for location button with "Any Location" text
    const locationButton = page.getByRole('button', { name: /any location/i });
    await expect(locationButton).toBeVisible();
  });

  test('should display trending events section', async ({ page }) => {
    // Check for "Trending Events" heading
    const trendingHeading = page.getByRole('heading', { name: /trending events/i });
    await expect(trendingHeading).toBeVisible();
  });

  test('should display event cards', async ({ page }) => {
    // Look for event cards with listings badges
    const listingsBadge = page.getByText(/\d+ listings/i).first();
    await expect(listingsBadge).toBeVisible();
  });

  test('should have date filter buttons', async ({ page }) => {
    // Check for filter by date section
    const filterText = page.getByText('Filter by Date:');
    await expect(filterText).toBeVisible();

    // Check for date filter buttons
    const allDatesButton = page.getByRole('button', { name: 'All Dates' });
    const todayButton = page.getByRole('button', { name: 'Today' });

    await expect(allDatesButton).toBeVisible();
    await expect(todayButton).toBeVisible();
  });

  test('should navigate to login page when clicking user icon', async ({ page }) => {
    const userLink = page.locator('header').locator('a[href="/login"]');
    await userLink.click();

    await expect(page).toHaveURL(/\/login/);
  });

  test('should have New Listing button', async ({ page }) => {
    // Check for "New Listing" button in header
    const newListingButton = page.getByRole('link', { name: /new listing/i });
    await expect(newListingButton).toBeVisible();
  });

  test('should have search input', async ({ page }) => {
    // Check for search input with placeholder
    const searchInput = page.getByPlaceholder(/search events/i);
    await expect(searchInput).toBeVisible();
  });
});
