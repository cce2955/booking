import { expect, test } from '@playwright/test';

test.describe('Booking homepage', () => {
  test('@smoke homepage responds and displays the application', async ({
    page,
  }) => {
    const response = await page.goto('/');

    expect(response, 'The homepage should return a response').not.toBeNull();
    expect(response?.ok(), 'The homepage response should be successful').toBe(
      true,
    );

    await expect(page).toHaveTitle(/restful-booker-platform demo/i);
    await expect(page.locator('body')).toBeVisible();
  });
});
