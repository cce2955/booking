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

  bookingData: async ({}, use) => {
    await use(createUniqueBookingData());
  },
});

export { expect };
