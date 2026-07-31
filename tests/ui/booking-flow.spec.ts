import type {
  CreatedBooking,
} from '../../data/booking-data';

import {
  expect,
  test,
} from '../../fixtures/test-fixtures';

import {
  ReservationPage,
} from '../../pages/ReservationPage';

test.describe('Guest room reservation', () => {
  test('@smoke guest can reserve an available room', async ({
    page,
    bookingApi,
    authToken,
    bookingData,
  }) => {
    let createdBookingId: number | undefined;

    const availableRooms = await test.step(
      'Find an available room through the API',
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

    try {
      await test.step(
        'Open the selected room',
        async () => {
          const response = await reservationPage.open(
            room.roomid,
            bookingData.bookingdates.checkin,
            bookingData.bookingdates.checkout,
          );

          expect(response).not.toBeNull();
          expect(response?.ok()).toBe(true);

          await expect(
            reservationPage.roomHeading(room.type),
          ).toBeVisible();
        },
      );

      await test.step(
        'Enter the guest information',
        async () => {
          await reservationPage.showGuestForm();
          await reservationPage.fillGuestDetails(
            bookingData,
          );

          await expect(
            reservationPage.firstnameInput,
          ).toHaveValue(bookingData.firstname);

          await expect(
            reservationPage.lastnameInput,
          ).toHaveValue(bookingData.lastname);

          await expect(
            reservationPage.emailInput,
          ).toHaveValue(bookingData.email);

          await expect(
            reservationPage.phoneInput,
          ).toHaveValue(bookingData.phone);
        },
      );

      const created = await test.step(
        'Submit the reservation',
        async () => {
          const bookingResponse =
            await reservationPage.submitReservation();

          expect(bookingResponse.status()).toBe(201);

          return bookingResponse.json() as Promise<CreatedBooking>;
        },
      );

      createdBookingId = created.bookingid;

      expect(created).toMatchObject({
        roomid: room.roomid,
        firstname: bookingData.firstname,
        lastname: bookingData.lastname,
        depositpaid: false,
        bookingdates: bookingData.bookingdates,
      });

      await test.step(
        'Verify the confirmation screen',
        async () => {
          await expect(
            reservationPage.confirmationHeading,
          ).toBeVisible();

          await expect(
            reservationPage.confirmationDates(
              bookingData.bookingdates.checkin,
              bookingData.bookingdates.checkout,
            ),
          ).toBeVisible();

          await expect(
            reservationPage.returnHomeLink,
          ).toBeVisible();
        },
      );

      await test.step(
        'Verify the booking through the API',
        async () => {
          const persisted = await bookingApi.getBooking(
            created.bookingid,
            authToken,
          );

          expect(persisted).toMatchObject({
            bookingid: created.bookingid,
            roomid: room.roomid,
            firstname: bookingData.firstname,
            lastname: bookingData.lastname,
            depositpaid: false,
            bookingdates: bookingData.bookingdates,
          });
        },
      );
    } finally {
      if (createdBookingId !== undefined) {
        await bookingApi.deleteBooking(
          createdBookingId,
          authToken,
        );
      }
    }
  });
});
