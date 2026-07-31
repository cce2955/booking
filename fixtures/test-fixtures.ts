import {
  test as base,
  expect,
} from '@playwright/test';

import { BookingApiClient } from '../clients/BookingApiClient';
import type { BookingData } from '../data/booking-data';
import { createUniqueBookingData } from '../data/test-data-factory';

type QaFixtures = {
  authToken: string;
  bookingApi: BookingApiClient;
  bookingData: BookingData;
};

function formatFutureDate(daysFromToday: number): string {
  const date = new Date();
  date.setUTCHours(12, 0, 0, 0);
  date.setUTCDate(date.getUTCDate() + daysFromToday);

  return date.toISOString().slice(0, 10);
}

export const test = base.extend<QaFixtures>({
  authToken: async ({ request }, use) => {
    const client = new BookingApiClient(request);
    const token = await client.authenticate();
    const validation = await client.validateToken(token);

    if (!validation.valid) {
      throw new Error(
        'The booking API returned an invalid authentication token.',
      );
    }

    await use(token);
  },

  bookingApi: async (
    { request, authToken },
    use,
    testInfo,
  ) => {
    const client = new BookingApiClient(request);

    await use(client);

    try {
      await client.cleanupCreatedBookings(authToken);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : String(error);

      await testInfo.attach('cleanup-failure', {
        body: message,
        contentType: 'text/plain',
      });

      throw error;
    }
  },

  bookingData: async ({}, use, testInfo) => {
    const checkinOffset = 1 + testInfo.workerIndex * 4;

    await use(
      createUniqueBookingData({
        bookingdates: {
          checkin: formatFutureDate(checkinOffset),
          checkout: formatFutureDate(checkinOffset + 2),
        },
      }),
    );
  },
});

export { expect };
