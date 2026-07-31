import type {
  Locator,
  Page,
  Response,
} from '@playwright/test';

import type { BookingData } from '../data/booking-data';

type GuestDetails = Pick<
  BookingData,
  'firstname' | 'lastname' | 'email' | 'phone'
>;

export class ReservationPage {
  public readonly firstnameInput: Locator;
  public readonly lastnameInput: Locator;
  public readonly emailInput: Locator;
  public readonly phoneInput: Locator;
  public readonly confirmationHeading: Locator;
  public readonly returnHomeLink: Locator;

  private readonly bookingForm: Locator;

  public constructor(
    private readonly page: Page,
  ) {
    this.bookingForm = page.locator('form');

    this.firstnameInput = page.getByRole('textbox', {
      name: 'Firstname',
      exact: true,
    });

    this.lastnameInput = page.getByRole('textbox', {
      name: 'Lastname',
      exact: true,
    });

    this.emailInput = page.getByRole('textbox', {
      name: 'Email',
      exact: true,
    });

    this.phoneInput = page.getByRole('textbox', {
      name: 'Phone',
      exact: true,
    });

    this.confirmationHeading = page.getByRole('heading', {
      name: 'Booking Confirmed',
      exact: true,
    });

    this.returnHomeLink = page.getByRole('link', {
      name: 'Return home',
      exact: true,
    });
  }

  public async open(
    roomId: number,
    checkin: string,
    checkout: string,
  ): Promise<Response | null> {
    return this.page.goto(
      `/reservation/${roomId}` +
        `?checkin=${checkin}&checkout=${checkout}`,
    );
  }

  public roomHeading(roomType: string): Locator {
    return this.page.getByRole('heading', {
      name: `${roomType} Room`,
      exact: true,
    }).first();
  }

  public confirmationDates(
    checkin: string,
    checkout: string,
  ): Locator {
    return this.page.getByText(
      `${checkin} - ${checkout}`,
      {
        exact: true,
      },
    );
  }

  public async showGuestForm(): Promise<void> {
    await this.page.getByRole('button', {
      name: 'Reserve Now',
      exact: true,
    }).click();

    await this.firstnameInput.waitFor({
      state: 'visible',
    });
  }

  public async fillGuestDetails(
    guest: GuestDetails,
  ): Promise<void> {
    await this.firstnameInput.fill(guest.firstname);
    await this.lastnameInput.fill(guest.lastname);
    await this.emailInput.fill(guest.email);
    await this.phoneInput.fill(guest.phone);
  }

  public async submitReservation(): Promise<Response> {
    const responsePromise = this.page.waitForResponse(
      response =>
        response.url().endsWith('/api/booking') &&
        response.request().method() === 'POST',
    );

    await this.bookingForm.getByRole('button', {
      name: 'Reserve Now',
      exact: true,
    }).click();

    return responsePromise;
  }
}
