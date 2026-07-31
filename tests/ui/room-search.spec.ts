import {
  expect,
  test,
} from '../../fixtures/test-fixtures';

import {
  HomePage,
} from '../../pages/HomePage';

import {
  ReservationPage,
} from '../../pages/ReservationPage';

test.describe('Room availability search', () => {
  test('@smoke guest can search and open an available room', async ({
    page,
    bookingData,
  }) => {
    const homePage = new HomePage(page);

    await test.step('Open the booking section', async () => {
      const response = await homePage.open();

      expect(response).not.toBeNull();
      expect(response?.ok()).toBe(true);

      await homePage.goToBookingSection();
    });

    await test.step('Select the stay dates', async () => {
      await homePage.selectStayDates(
        bookingData.bookingdates,
      );

      const expectedCheckin =
        formatDisplayDate(
          bookingData.bookingdates.checkin,
        );

      const expectedCheckout =
        formatDisplayDate(
          bookingData.bookingdates.checkout,
        );

      await expect(
        homePage.checkInInput,
      ).toHaveValue(expectedCheckin);

      await expect(
        homePage.checkOutInput,
      ).toHaveValue(expectedCheckout);
    });

    await test.step(
      'Search for available rooms',
      async () => {
        const response =
          await homePage.checkAvailability();

        expect(response.status()).toBe(200);

        await expect(
          homePage.firstAvailableRoom(),
        ).toBeVisible();
      },
    );

    const selectedRoomType = await test.step(
      'Open the first available room',
      async () => {
        return homePage.openFirstAvailableRoom();
      },
    );

    await test.step(
      'Verify the selected room page',
      async () => {
        const reservationPage =
          new ReservationPage(page);

        await expect(page).toHaveURL(
          /\/reservation\/\d+\?checkin=\d{4}-\d{2}-\d{2}&checkout=\d{4}-\d{2}-\d{2}/,
        );

        await expect(
          reservationPage.roomHeading(
            selectedRoomType,
          ),
        ).toBeVisible();
      },
    );
  });
});

function formatDisplayDate(
  isoDate: string,
): string {
  const [year, month, day] = isoDate.split('-');

  return `${day}/${month}/${year}`;
}
