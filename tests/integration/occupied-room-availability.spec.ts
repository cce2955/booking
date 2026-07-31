import type {
  RoomsResponse,
} from '../../data/booking-data';

import {
  expect,
  test,
} from '../../fixtures/test-fixtures';

import {
  HomePage,
} from '../../pages/HomePage';

test.describe('Booking availability integration', () => {
  test('@regression occupied room is excluded from search results', async ({
    page,
    bookingApi,
    authToken,
    bookingData,
  }) => {
    let createdBookingId: number | undefined;

    const initialAvailability = await test.step(
      'Find an initially available room',
      async () => {
        const rooms = await bookingApi.getAvailableRooms(
          bookingData.bookingdates.checkin,
          bookingData.bookingdates.checkout,
        );

        expect(
          rooms.rooms.length,
          'At least one room should initially be available',
        ).toBeGreaterThan(0);

        return rooms;
      },
    );

    const occupiedRoom = initialAvailability.rooms[0];

    try {
      const created = await test.step(
        'Reserve the room through the API',
        async () => {
          return bookingApi.createBooking({
            ...bookingData,
            roomid: occupiedRoom.roomid,
          });
        },
      );

      createdBookingId = created.bookingid;

      const homePage = new HomePage(page);

      await test.step(
        'Search the same dates through the browser',
        async () => {
          const navigationResponse =
            await homePage.open();

          expect(navigationResponse).not.toBeNull();
          expect(navigationResponse?.ok()).toBe(true);

          await homePage.goToBookingSection();

          await homePage.selectStayDates(
            bookingData.bookingdates,
          );
        },
      );

      const availabilityResponse = await test.step(
        'Capture the browser availability response',
        async () => {
          return homePage.checkAvailability();
        },
      );

      expect(availabilityResponse.status()).toBe(200);

      const responseUrl = new URL(
        availabilityResponse.url(),
      );

      expect(
        responseUrl.searchParams.get('checkin'),
      ).toBe(bookingData.bookingdates.checkin);

      expect(
        responseUrl.searchParams.get('checkout'),
      ).toBe(bookingData.bookingdates.checkout);

      const availabilityBody =
        await availabilityResponse.json() as RoomsResponse;

      await test.step(
        'Verify the backend excluded the occupied room',
        async () => {
          expect(
            availabilityBody.rooms.map(
              room => room.roomid,
            ),
          ).not.toContain(occupiedRoom.roomid);
        },
      );

      await test.step(
        'Verify the frontend excluded the occupied room',
        async () => {
          await expect(
            homePage.roomCardById(
              occupiedRoom.roomid,
            ),
          ).toHaveCount(0);
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
