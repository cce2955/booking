import {
  expect,
  test,
} from '../../fixtures/test-fixtures';

function shiftDate(
  dateString: string,
  numberOfDays: number,
): string {
  const date = new Date(`${dateString}T12:00:00.000Z`);

  date.setUTCDate(date.getUTCDate() + numberOfDays);

  return date.toISOString().slice(0, 10);
}

test.describe('Booking API updates', () => {
  test('@regression fully updates an existing booking', async ({
    bookingApi,
    authToken,
    bookingData,
  }) => {
    const originalAvailability = await test.step(
      'Find a room for the original booking',
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

    const originalBooking = {
      ...bookingData,
      roomid: originalAvailability.rooms[0].roomid,
    };

    const created = await test.step(
      'Create the original booking',
      async () => {
        return bookingApi.createBooking(originalBooking);
      },
    );

    const updatedDates = {
      checkin: shiftDate(
        originalBooking.bookingdates.checkin,
        30,
      ),
      checkout: shiftDate(
        originalBooking.bookingdates.checkout,
        30,
      ),
    };

    const updatedAvailability = await test.step(
      'Find a room for the updated dates',
      async () => {
        const rooms = await bookingApi.getAvailableRooms(
          updatedDates.checkin,
          updatedDates.checkout,
        );

        expect(
          rooms.rooms.length,
          'At least one room should be available for the update',
        ).toBeGreaterThan(0);

        return rooms;
      },
    );

    const suffix = Date.now().toString().slice(-6);

    const updatedBooking = {
      ...originalBooking,
      roomid: updatedAvailability.rooms[0].roomid,
      firstname: `Up${suffix}`,
      lastname: `Full${suffix}`,
      depositpaid: true,
      bookingdates: updatedDates,
    };

    try {
      const updateResponse = await test.step(
        'Replace the complete booking',
        async () => {
          return bookingApi.updateBooking(
            created.bookingid,
            updatedBooking,
            authToken,
          );
        },
      );

      expect(updateResponse.bookingid).toBe(
        created.bookingid,
      );

      expect(updateResponse.booking).toMatchObject({
        bookingid: created.bookingid,
        roomid: updatedBooking.roomid,
        firstname: updatedBooking.firstname,
        lastname: updatedBooking.lastname,
        depositpaid: true,
        bookingdates: updatedBooking.bookingdates,
      });

      await test.step(
        'Verify the updated values were persisted',
        async () => {
          const retrieved = await bookingApi.getBooking(
            created.bookingid,
            authToken,
          );

          expect(retrieved).toMatchObject({
            bookingid: created.bookingid,
            roomid: updatedBooking.roomid,
            firstname: updatedBooking.firstname,
            lastname: updatedBooking.lastname,
            depositpaid: true,
            bookingdates: updatedBooking.bookingdates,
          });

          expect(retrieved.firstname).not.toBe(
            originalBooking.firstname,
          );

          expect(retrieved.bookingdates).not.toEqual(
            originalBooking.bookingdates,
          );

          expect(retrieved.depositpaid).not.toBe(
            originalBooking.depositpaid,
          );
        },
      );
    } finally {
      await test.step('Delete the updated booking', async () => {
        await bookingApi.deleteBooking(
          created.bookingid,
          authToken,
        );
      });
    }
  });
});
