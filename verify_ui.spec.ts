import { test } from '@playwright/test';

test('capture tv gallery', async ({ page }) => {
  await page.goto('http://localhost:3004');
  await page.waitForLoadState('networkidle');

  // Scroll to the gallery section
  await page.locator('#galeria').scrollIntoViewIfNeeded();

  // Wait a bit for animations
  await page.waitForTimeout(2000);

  await page.screenshot({ path: 'tv_gallery_updated.png' });

  // Full page for context
  await page.screenshot({ path: 'full_page_gallery.png', fullPage: true });
});
