/**
 * ScrollRestoration Component
 * Global scroll position management for better UX when navigating back
 *
 * This component:
 * 1. Saves the current scroll position before navigating to a new page
 * 2. Restores the scroll position when returning via back button
 * 3. Works across all pages in the application
 * 4. Uses sessionStorage to persist scroll positions during the session
 *
 * Implementation:
 * - Captures all link clicks to save scroll position before navigation
 * - Monitors pathname changes to restore scroll positions
 * - Uses sessionStorage with pathname as key
 */
'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

export function ScrollRestoration() {
  const pathname = usePathname();
  const previousPathname = useRef<string>(pathname);

  useEffect(() => {
    // Save scroll position when pathname is about to change
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest('a');

      // Check if it's a valid internal link
      if (link && link.href && !link.href.startsWith('#') && !link.target) {
        const url = new URL(link.href);
        // Only save for same-origin links
        if (url.origin === window.location.origin) {
          sessionStorage.setItem(
            `scroll-${pathname}`,
            window.scrollY.toString()
          );
        }
      }
    };

    // Add click listener with capture phase to catch all clicks
    document.addEventListener('click', handleClick, true);

    return () => {
      document.removeEventListener('click', handleClick, true);
    };
  }, [pathname]);

  useEffect(() => {
    // Only try to restore if pathname actually changed
    if (previousPathname.current !== pathname) {
      // Check if there's a saved scroll position for this page
      const savedPosition = sessionStorage.getItem(`scroll-${pathname}`);

      if (savedPosition) {
        const scrollPosition = parseInt(savedPosition, 10);

        // Use requestAnimationFrame to wait for the next paint
        requestAnimationFrame(() => {
          window.scrollTo(0, scrollPosition);

          // Try again after a short delay to handle async content loading
          setTimeout(() => {
            window.scrollTo(0, scrollPosition);
          }, 50);

          // Final attempt after content should be loaded
          setTimeout(() => {
            window.scrollTo(0, scrollPosition);
          }, 100);
        });

        // Clean up the saved position after restoration attempts
        setTimeout(() => {
          sessionStorage.removeItem(`scroll-${pathname}`);
        }, 150);
      }

      // Update the previous pathname
      previousPathname.current = pathname;
    }
  }, [pathname]);

  return null;
}
