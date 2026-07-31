import type {
  APIRequestContext,
  APIResponse,
} from '@playwright/test';

import type {
  AuthLoginResponse,
  AuthValidationResponse,
  BookingData,
  CreatedBooking,
  RetrievedBooking,
  RoomsResponse,
  UpdatedBookingResponse,
} from '../data/booking-data';

export class BookingApiClient {
  private readonly createdBookingIds = new Set<number>();

  public constructor(
    private readonly request: APIRequestContext,
  ) {}

  public async getRooms(): Promise<RoomsResponse> {
    const response = await this.request.get('/api/room');

    await this.requireStatus(response, 200, 'retrieve rooms');

    return response.json() as Promise<RoomsResponse>;
  }


  public async getAvailableRooms(
    checkin: string,
    checkout: string,
  ): Promise<RoomsResponse> {
    const response = await this.request.get('/api/room', {
      params: {
        checkin,
        checkout,
      },
    });

    await this.requireStatus(
      response,
      200,
      'retrieve available rooms',
    );

    return response.json() as Promise<RoomsResponse>;
  }
  public async authenticate(
    username = process.env.ADMIN_USERNAME,
    password = process.env.ADMIN_PASSWORD,
  ): Promise<string> {
    if (!username || !password) {
      throw new Error(
        'ADMIN_USERNAME and ADMIN_PASSWORD must be configured.',
      );
    }

    const response = await this.request.post('/api/auth/login', {
      data: {
        username,
        password,
      },
    });

    await this.requireStatus(response, 200, 'authenticate');

    const body = (await response.json()) as AuthLoginResponse;

    if (!body.token) {
      throw new Error(
        'Authentication succeeded but no token was returned.',
      );
    }

    return body.token;
  }

  public async validateToken(
    token: string,
  ): Promise<AuthValidationResponse> {
    const response = await this.request.post('/api/auth/validate', {
      data: { token },
    });

    await this.requireStatus(response, 200, 'validate token');

    return response.json() as Promise<AuthValidationResponse>;
  }

  public async createBooking(
    booking: BookingData,
  ): Promise<CreatedBooking> {
    const response = await this.request.post('/api/booking', {
      data: booking,
    });

    await this.requireStatus(response, 201, 'create booking');

    const created = (await response.json()) as CreatedBooking;

    this.createdBookingIds.add(created.bookingid);

    return created;
  }

  public async getBooking(
    bookingId: number,
    token: string,
  ): Promise<RetrievedBooking> {
    const response = await this.request.get(
      `/api/booking/${bookingId}`,
      {
        headers: this.authHeaders(token),
      },
    );

    await this.requireStatus(
      response,
      200,
      `retrieve booking ${bookingId}`,
    );

    return response.json() as Promise<RetrievedBooking>;
  }


  public async updateBooking(
    bookingId: number,
    booking: BookingData,
    token: string,
  ): Promise<UpdatedBookingResponse> {
    const response = await this.request.put(
      `/api/booking/${bookingId}`,
      {
        headers: this.authHeaders(token),
        data: booking,
      },
    );

    await this.requireStatus(
      response,
      200,
      `update booking ${bookingId}`,
    );

    return response.json() as Promise<UpdatedBookingResponse>;
  }
  public async deleteBooking(
    bookingId: number,
    token: string,
  ): Promise<void> {
    const response = await this.request.delete(
      `/api/booking/${bookingId}`,
      {
        headers: this.authHeaders(token),
      },
    );

    await this.requireStatus(
      response,
      202,
      `delete booking ${bookingId}`,
    );

    this.createdBookingIds.delete(bookingId);
  }

  public async cleanupCreatedBookings(
    token: string,
  ): Promise<void> {
    const failures: string[] = [];

    for (const bookingId of this.createdBookingIds) {
      const response = await this.request.delete(
        `/api/booking/${bookingId}`,
        {
          headers: this.authHeaders(token),
        },
      );

      if (response.status() === 202 || response.status() === 404) {
        this.createdBookingIds.delete(bookingId);
        continue;
      }

      failures.push(
        `${bookingId}: received HTTP ${response.status()}`,
      );
    }

    if (failures.length > 0) {
      throw new Error(
        `Booking cleanup failed for ${failures.join(', ')}`,
      );
    }
  }

  private authHeaders(token: string): Record<string, string> {
    return {
      Cookie: `token=${token}`,
    };
  }

  private async requireStatus(
    response: APIResponse,
    expectedStatus: number,
    operation: string,
  ): Promise<void> {
    if (response.status() === expectedStatus) {
      return;
    }

    const body = await response.text();

    throw new Error(
      `Failed to ${operation}. ` +
        `Expected HTTP ${expectedStatus}, ` +
        `received ${response.status()}. ` +
        `Response: ${body}`,
    );
  }
}



