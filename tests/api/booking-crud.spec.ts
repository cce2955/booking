import { expect, test } from '@playwright/test';

import { BookingApiClient } from '../../clients/BookingApiClient';
import { createUniqueBookingData } from '../../data/test-data-factory';

test.describe('Booking API lifecycle', () => {
  test('@smoke creates, retrieves, and deletes a booking', async ({
    request,
  }) => {
    const bookingApi = new BookingApiClient(request);

    const token = await test.step(
      'Authenticate with the booking service',
      async () => {
        const authToken = await bookingApi.authenticate();
        const validation =
          await bookingApi.validateToken(authToken);

        expect(validation.valid).toBe(true);

        return authToken;
      },
    );

    const generatedData = createUniqueBookingData();

    const availableRooms = await test.step(
      'Find an available room for the generated dates',
      async () => {
        const rooms = await bookingApi.getAvailableRooms(
          generatedData.bookingdates.checkin,
          generatedData.bookingdates.checkout,
        );

        expect(
          rooms.rooms.length,
          'At least one room should be available',
        ).toBeGreaterThan(0);

        return rooms;
      },
    );

    const selectedRoom = availableRooms.rooms[0];

    const booking = {
      ...generatedData,
      roomid: selectedRoom.roomid,
    };

    const created = await test.step(
      'Create a unique booking',
      async () => {
        const result = await bookingApi.createBooking(booking);

        expect(result.bookingid).toBeGreaterThan(0);
        expect(result).toMatchObject({
          roomid: booking.roomid,
          firstname: booking.firstname,
          lastname: booking.lastname,
          depositpaid: booking.depositpaid,
          bookingdates: booking.bookingdates,
        });

        return result;
      },
    );

    await test.info().attach('created-booking', {
      body: JSON.stringify(
        {
          bookingid: created.bookingid,
          testData: booking,
        },
        null,
        2,
      ),
      contentType: 'application/json',
    });

    try {
      await test.step(
        'Retrieve and verify persisted booking values',
        async () => {
          const retrieved = await bookingApi.getBooking(
            created.bookingid,
            token,
          );

          expect(retrieved).toMatchObject({
            roomid: booking.roomid,
            firstname: booking.firstname,
            lastname: booking.lastname,
            depositpaid: booking.depositpaid,
            bookingdates: booking.bookingdates,
          });
        },
      );
    } finally {
      await test.step('Delete the created booking', async () => {
        await bookingApi.deleteBooking(
          created.bookingid,
          token,
        );
      });
    }
  });
});
