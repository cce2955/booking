import {
  expect,
  test,
} from '@playwright/test';

import { HomePage } from '../../pages/HomePage';

test.describe('Booking homepage', () => {
  test('@smoke homepage responds and displays the application', async ({
    page,
  }) => {
    const homePage = new HomePage(page);

    const response = await homePage.open();

    expect(response).not.toBeNull();
    expect(response?.ok()).toBe(true);

    await expect(page).toHaveTitle(
      /restful-booker-platform demo/i,
    );

    await expect(homePage.heading).toBeVisible();
    await expect(homePage.bookNowLink).toBeVisible();
    await expect(
      homePage.checkAvailabilityButton,
    ).toBeVisible();
  });
});
