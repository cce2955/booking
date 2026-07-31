import {
  expect,
  test,
} from '../../fixtures/test-fixtures';

import {
  ReservationPage,
} from '../../pages/ReservationPage';

test.describe('Reservation form validation', () => {
  test('@regression rejects an empty guest form', async ({
    page,
    bookingApi,
    bookingData,
  }) => {
    const availableRooms = await test.step(
      'Find an available room',
      async () => {
        const rooms = await bookingApi.getAvailableRooms(
          bookingData.bookingdates.checkin,
          bookingData.bookingdates.checkout,
        );

        expect(
          rooms.rooms.length,
          'At least one room should be available',
        ).toBeGreaterThan(0);

        return rooms;
      },
    );

    const room = availableRooms.rooms[0];
    const reservationPage = new ReservationPage(page);

    await test.step(
      'Open the room and reveal the guest form',
      async () => {
        const response = await reservationPage.open(
          room.roomid,
          bookingData.bookingdates.checkin,
          bookingData.bookingdates.checkout,
        );

        expect(response).not.toBeNull();
        expect(response?.ok()).toBe(true);

        await reservationPage.showGuestForm();
      },
    );

    const validationResponse = await test.step(
      'Submit the empty form',
      async () => {
        return reservationPage.submitReservation();
      },
    );

    expect(validationResponse.status()).toBe(400);

    await test.step(
      'Verify the server validation messages',
      async () => {
        await expect(
          reservationPage.validationAlert,
        ).toBeVisible();

        await expect(
          reservationPage.validationAlert,
        ).toContainText(
          'Firstname should not be blank',
        );

        await expect(
          reservationPage.validationAlert,
        ).toContainText(
          'Lastname should not be blank',
        );

        await expect(
          reservationPage.validationAlert,
        ).toContainText(
          'size must be between 11 and 21',
        );

        await expect(
          reservationPage.validationAlert,
        ).toContainText(
          'size must be between 3 and 30',
        );

        await expect(
          reservationPage.validationAlert,
        ).toContainText(
          'size must be between 3 and 18',
        );

        await expect(
          reservationPage.confirmationHeading,
        ).not.toBeVisible();
      },
    );
  });
});
