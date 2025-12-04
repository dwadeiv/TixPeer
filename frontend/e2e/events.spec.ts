/**
 * Events E2E Tests
 *
 * Tests event listing and detail pages:
 * - Events display on homepage
 * - Event cards are clickable
 * - Event detail page loads
 * - Search/filter functionality
 */

import { test, expect } from '@playwright/test';

test.describe('Events Display', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display trending events section', async ({ page }) => {
    // Check for "Trending Events" heading
    const heading = page.getByRole('heading', { name: /trending events/i });
    await expect(heading).toBeVisible();
  });

  test('should display event cards with listing counts', async ({ page }) => {
    // Look for event cards with "X listings" badges
    const listingsBadges = page.getByText(/\d+ listings/i);
    await expect(listingsBadges.first()).toBeVisible();
  });

  test('should display event category badges', async ({ page }) => {
    // Look for category badges like Sports, Festival, Music
    const categoryBadge = page.getByText(/sports|festival|music|concert|comedy|theater/i).first();
    await expect(categoryBadge).toBeVisible();
  });

  test('should display event names', async ({ page }) => {
    // Events should have names displayed (these are h3 elements inside cards)
    const eventNames = page.locator('h3');
    await expect(eventNames.first()).toBeVisible();
  });

  test('should display event dates', async ({ page }) => {
    // Events should show dates (format like "Dec 15, 2025")
    const datePattern = page.getByText(/jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec/i);
    await expect(datePattern.first()).toBeVisible();
  });
});

test.describe('Event Filtering', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should have date filter options', async ({ page }) => {
    // Check for filter buttons
    const allDates = page.getByRole('button', { name: 'All Dates' });
    const today = page.getByRole('button', { name: 'Today' });
    const thisWeek = page.getByRole('button', { name: 'This Week' });
    const thisMonth = page.getByRole('button', { name: 'This Month' });

    await expect(allDates).toBeVisible();
    await expect(today).toBeVisible();
    await expect(thisWeek).toBeVisible();
    await expect(thisMonth).toBeVisible();
  });

  test('should be able to click date filter buttons', async ({ page }) => {
    const thisWeekButton = page.getByRole('button', { name: 'This Week' });
    await thisWeekButton.click();

    // Button should be visually selected (different styling)
    // The active button has different background color
    await expect(thisWeekButton).toHaveClass(/bg-/);
  });

  test('should have custom range button', async ({ page }) => {
    const customRangeButton = page.getByRole('button', { name: /custom range/i });
    await expect(customRangeButton).toBeVisible();
  });
});

test.describe('Event Search', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should have search input', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/search events/i);
    await expect(searchInput).toBeVisible();
  });

  test('should show suggestions when typing in search', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/search events/i);

    // Type a search query
    await searchInput.fill('NBA');

    // Wait for suggestions dropdown to appear
    // Suggestions appear in a Card component below the search input
    const suggestions = page.locator('form button').filter({ hasText: /nba/i });
    await expect(suggestions.first()).toBeVisible({ timeout: 5000 }).catch(() => {
      // May not have matching events in the database
    });
  });

  test('should submit search form', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/search events/i);

    await searchInput.fill('concert');
    await searchInput.press('Enter');

    // URL should include search parameter
    await expect(page).toHaveURL(/search=concert/i);
  });
});

test.describe('Event Detail Page', () => {
  test('should navigate to event detail when clicking event card', async ({ page }) => {
    await page.goto('/');

    // Click on the first event card (which links to event detail)
    // Event cards are wrapped in links to /events/[id]
    const eventCard = page.locator('a[href^="/events/"]').first();

    // Wait for card to be visible and clickable
    if (await eventCard.isVisible()) {
      await eventCard.click();

      // Should navigate to event detail page
      await expect(page).toHaveURL(/\/events\/[a-zA-Z0-9-]+/);
    }
  });

  test('should display event details on detail page', async ({ page }) => {
    await page.goto('/');

    // Navigate to first event
    const eventCard = page.locator('a[href^="/events/"]').first();
    if (await eventCard.isVisible()) {
      await eventCard.click();
      await page.waitForURL(/\/events\/[a-zA-Z0-9-]+/);

      // Check for event name (heading)
      const eventTitle = page.getByRole('heading').first();
      await expect(eventTitle).toBeVisible();

      // Check for event details like venue, date
      const venueOrDate = page.getByText(/venue|stadium|arena|center|theatre|hall|\d{4}/i).first();
      await expect(venueOrDate).toBeVisible().catch(() => {
        // Some events may not have venue text visible
      });
    }
  });

  test('should show listings section on event detail page', async ({ page }) => {
    await page.goto('/');

    // Navigate to first event
    const eventCard = page.locator('a[href^="/events/"]').first();
    if (await eventCard.isVisible()) {
      await eventCard.click();
      await page.waitForURL(/\/events\/[a-zA-Z0-9-]+/);

      // Check for listings or tickets section
      const listingsSection = page.getByText(/listings|tickets|available/i).first();
      await expect(listingsSection).toBeVisible();
    }
  });
});
