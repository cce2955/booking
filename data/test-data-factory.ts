import type {
  BookingData,
  BookingDates,
} from './booking-data';

type BookingOverrides =
  Partial<Omit<BookingData, 'bookingdates'>> & {
    bookingdates?: Partial<BookingDates>;
  };

function addUtcDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function createUniqueBookingData(
  overrides: BookingOverrides = {},
): BookingData {
  const now = new Date();
  now.setUTCHours(12, 0, 0, 0);

  const uniqueSuffix =
    `${Date.now().toString().slice(-6)}` +
    `${Math.floor(Math.random() * 90 + 10)}`;

  const phoneSuffix = Math.floor(
    Math.random() * 100_000_000,
  )
    .toString()
    .padStart(8, '0');

  const defaultBooking: BookingData = {
    roomid: 1,
    firstname: `Chris${uniqueSuffix}`,
    lastname: `Auto${uniqueSuffix}`,
    depositpaid: false,
    bookingdates: {
      checkin: formatDate(addUtcDays(now, 1)),
      checkout: formatDate(addUtcDays(now, 3)),
    },
    email: `chris.${uniqueSuffix}@example.com`,
    phone: `555${phoneSuffix}`,
  };

  return {
    ...defaultBooking,
    ...overrides,
    bookingdates: {
      ...defaultBooking.bookingdates,
      ...overrides.bookingdates,
    },
  };
}
