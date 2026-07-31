import {
  expect,
  test,
} from '../../fixtures/test-fixtures';

import type {
  BookingValidationError,
} from '../../data/booking-data';

import {
  createUniqueBookingData,
} from '../../data/test-data-factory';

test.describe('Booking API validation', () => {
  test('@regression rejects blank required customer fields', async ({
    request,
  }) => {
    const invalidBooking = createUniqueBookingData({
      firstname: '',
      lastname: '',
      email: '',
      phone: '',
    });

    const response = await request.post('/api/booking', {
      data: invalidBooking,
    });

    expect(response.status()).toBe(400);
    expect(response.headers()['content-type']).toContain(
      'application/json',
    );

    const body =
      (await response.json()) as BookingValidationError;

    expect(body.errors).toEqual(
      expect.arrayContaining([
        'Firstname should not be blank',
        'Lastname should not be blank',
        'size must be between 11 and 21',
      ]),
    );

    expect(body).not.toHaveProperty('bookingid');
  });

  test('@regression rejects a ten-character phone number', async ({
    request,
  }) => {
    const invalidBooking = createUniqueBookingData({
      phone: '1234567890',
    });

    const response = await request.post('/api/booking', {
      data: invalidBooking,
    });

    expect(response.status()).toBe(400);

    const body =
      (await response.json()) as BookingValidationError;

    expect(body.errors).toContain(
      'size must be between 11 and 21',
    );

    expect(body).not.toHaveProperty('bookingid');
  });

  test('@regression rejects a malformed email address', async ({
    request,
  }) => {
    const invalidBooking = createUniqueBookingData({
      email: 'not-an-email',
    });

    const response = await request.post('/api/booking', {
      data: invalidBooking,
    });

    expect(response.status()).toBe(400);

    const body =
      (await response.json()) as BookingValidationError;

    expect(body.errors).toContain(
      'must be a well-formed email address',
    );

    expect(body).not.toHaveProperty('bookingid');
  });
});
