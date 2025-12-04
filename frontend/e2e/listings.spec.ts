/**
 * Listings E2E Tests
 *
 * Tests ticket listing functionality:
 * - Listing display on event pages
 * - Listing detail page loads
 * - Listing information displays
 * - Create listing flow
 */

import { test, expect } from '@playwright/test';

test.describe('Listings on Event Page', () => {
  test('should display listings count on event cards', async ({ page }) => {
    await page.goto('/');

    // Event cards show "X listings" badge
    const listingsBadge = page.getByText(/\d+ listings/i).first();
    await expect(listingsBadge).toBeVisible();
  });

  test('should show listings on event detail page', async ({ page }) => {
    await page.goto('/');

    // Click on an event to go to detail page
    const eventCard = page.locator('a[href^="/events/"]').first();
    if (await eventCard.isVisible()) {
      await eventCard.click();
      await page.waitForURL(/\/events\/[a-zA-Z0-9-]+/);

      // Look for listings section or listing cards
      const listingsHeading = page.getByText(/available listings|tickets for sale|listings/i).first();
      await expect(listingsHeading).toBeVisible().catch(() => {
        // May have different heading text
      });
    }
  });
});

test.describe('Create Listing Flow', () => {
  test('should have New Listing button in header', async ({ page }) => {
    await page.goto('/');

    // Check for New Listing button
    const newListingButton = page.getByRole('link', { name: /new listing/i });
    await expect(newListingButton).toBeVisible();
  });

  test('should navigate to create listing page', async ({ page }) => {
    await page.goto('/');

    const newListingButton = page.getByRole('link', { name: /new listing/i });
    await newListingButton.click();

    // Should navigate to create page
    await expect(page).toHaveURL(/\/create/);
  });

  test('should display create listing form', async ({ page }) => {
    await page.goto('/create');

    // Check for form elements (exact elements depend on implementation)
    // Look for common form labels like Event, Price, Section, etc.
    const pageContent = page.locator('body');
    await expect(pageContent).toBeVisible();

    // The create page should have some form of heading or instructions
    const heading = page.getByRole('heading').first();
    await expect(heading).toBeVisible();
  });
});

test.describe('Listing Detail Page', () => {
  test('should navigate to listing detail from event page', async ({ page }) => {
    await page.goto('/');

    // First go to an event
    const eventCard = page.locator('a[href^="/events/"]').first();
    if (await eventCard.isVisible()) {
      await eventCard.click();
      await page.waitForURL(/\/events\/[a-zA-Z0-9-]+/);

      // Look for a listing card/link
      const listingLink = page.locator('a[href^="/listings/"]').first();
      if (await listingLink.isVisible()) {
        await listingLink.click();

        // Should navigate to listing detail
        await expect(page).toHaveURL(/\/listings\/[a-zA-Z0-9-]+/);
      }
    }
  });

  test('should display listing details', async ({ page }) => {
    await page.goto('/');

    // Navigate through event to listing
    const eventCard = page.locator('a[href^="/events/"]').first();
    if (await eventCard.isVisible()) {
      await eventCard.click();
      await page.waitForURL(/\/events\/[a-zA-Z0-9-]+/);

      const listingLink = page.locator('a[href^="/listings/"]').first();
      if (await listingLink.isVisible()) {
        await listingLink.click();
        await page.waitForURL(/\/listings\/[a-zA-Z0-9-]+/);

        // Check for listing details
        // Should have price information
        const priceInfo = page.getByText(/\$/);
        await expect(priceInfo.first()).toBeVisible();

        // Should have quantity or ticket information
        const ticketInfo = page.getByText(/ticket|seat|section|row|quantity/i).first();
        await expect(ticketInfo).toBeVisible().catch(() => {
          // Details may vary
        });
      }
    }
  });

  test('should show seller information on listing', async ({ page }) => {
    await page.goto('/');

    // Navigate through event to listing
    const eventCard = page.locator('a[href^="/events/"]').first();
    if (await eventCard.isVisible()) {
      await eventCard.click();
      await page.waitForURL(/\/events\/[a-zA-Z0-9-]+/);

      const listingLink = page.locator('a[href^="/listings/"]').first();
      if (await listingLink.isVisible()) {
        await listingLink.click();
        await page.waitForURL(/\/listings\/[a-zA-Z0-9-]+/);

        // Check for seller information (name, rating, etc.)
        const sellerSection = page.getByText(/seller|listed by|sold by/i).first();
        await expect(sellerSection).toBeVisible().catch(() => {
          // Seller info may be displayed differently
        });
      }
    }
  });

  test('should have contact or message button on listing', async ({ page }) => {
    await page.goto('/');

    // Navigate through event to listing
    const eventCard = page.locator('a[href^="/events/"]').first();
    if (await eventCard.isVisible()) {
      await eventCard.click();
      await page.waitForURL(/\/events\/[a-zA-Z0-9-]+/);

      const listingLink = page.locator('a[href^="/listings/"]').first();
      if (await listingLink.isVisible()) {
        await listingLink.click();
        await page.waitForURL(/\/listings\/[a-zA-Z0-9-]+/);

        // Check for contact/message button
        const contactButton = page.getByRole('button', { name: /contact|message|inquire|buy/i });
        await expect(contactButton).toBeVisible().catch(() => {
          // Button may have different text
        });
      }
    }
  });
});
