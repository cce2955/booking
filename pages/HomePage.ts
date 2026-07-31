import type {
  Locator,
  Page,
  Response,
} from '@playwright/test';

import type {
  BookingDates,
} from '../data/booking-data';

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export class HomePage {
  public readonly heading: Locator;
  public readonly bookNowLink: Locator;
  public readonly checkAvailabilityButton: Locator;
  public readonly checkInInput: Locator;
  public readonly checkOutInput: Locator;
  public readonly roomCards: Locator;

  private readonly calendar: Locator;
  private readonly currentCalendarMonth: Locator;
  private readonly previousMonthButton: Locator;
  private readonly nextMonthButton: Locator;

  public constructor(
    private readonly page: Page,
  ) {
    this.heading = page.getByRole('heading', {
      name: 'Welcome to Shady Meadows B&B',
    });

    this.bookNowLink = page.getByRole('link', {
      name: 'Book Now',
      exact: true,
    });

    this.checkAvailabilityButton = page.getByRole('button', {
      name: 'Check Availability',
      exact: true,
    });

    const dateInputs = page.locator(
      '.react-datepicker-wrapper input',
    );

    this.checkInInput = dateInputs.nth(0);
    this.checkOutInput = dateInputs.nth(1);

    this.roomCards = page.locator('.room-card');

    this.calendar = page.getByRole('dialog', {
      name: 'Choose Date',
      exact: true,
    });

    this.currentCalendarMonth = this.calendar.locator(
      '.react-datepicker__current-month',
    );

    this.previousMonthButton = this.calendar.getByRole(
      'button',
      {
        name: 'Previous Month',
        exact: true,
      },
    );

    this.nextMonthButton = this.calendar.getByRole(
      'button',
      {
        name: 'Next Month',
        exact: true,
      },
    );
  }

  public async open(): Promise<Response | null> {
    return this.page.goto('/');
  }

  public async goToBookingSection(): Promise<void> {
    await this.bookNowLink.click();

    await this.checkAvailabilityButton.waitFor({
      state: 'visible',
    });
  }

  public async selectStayDates(
    dates: BookingDates,
  ): Promise<void> {
    await this.selectDate(
      this.checkInInput,
      dates.checkin,
    );

    await this.selectDate(
      this.checkOutInput,
      dates.checkout,
    );
  }

  public async checkAvailability(): Promise<Response> {
    const responsePromise = this.page.waitForResponse(
      response =>
        response.url().includes('/api/room?') &&
        response.request().method() === 'GET',
    );

    await this.checkAvailabilityButton.click();

    return responsePromise;
  }

  public firstAvailableRoom(): Locator {
    return this.roomCards.first();
  }

  public async openFirstAvailableRoom(): Promise<string> {
    const roomCard = this.firstAvailableRoom();

    const roomType = (
      await roomCard
        .getByRole('heading')
        .first()
        .innerText()
    ).trim();

    await Promise.all([
      this.page.waitForURL(/\/reservation\/\d+/),
      roomCard.getByRole('link', {
        name: 'Book now',
        exact: true,
      }).click(),
    ]);

    return roomType;
  }

  private async selectDate(
    input: Locator,
    isoDate: string,
  ): Promise<void> {
    const targetDate = this.parseIsoDate(isoDate);
    const targetMonthIndex =
      targetDate.getUTCFullYear() * 12 +
      targetDate.getUTCMonth();

    await input.click();

    await this.calendar.waitFor({
      state: 'visible',
    });

    for (let attempt = 0; attempt < 36; attempt += 1) {
      const visibleMonthIndex = await this.getVisibleMonthIndex();

      if (visibleMonthIndex === targetMonthIndex) {
        break;
      }

      if (visibleMonthIndex < targetMonthIndex) {
        await this.nextMonthButton.click();
      } else {
        await this.previousMonthButton.click();
      }

      if (attempt === 35) {
        throw new Error(
          `Could not navigate the calendar to ${isoDate}.`,
        );
      }
    }

    const accessibleDateName =
      this.formatAccessibleDate(targetDate);

    await this.calendar.getByRole('gridcell', {
      name: accessibleDateName,
      exact: true,
    }).click();

    await this.calendar.waitFor({
      state: 'hidden',
    });
  }

  private async getVisibleMonthIndex(): Promise<number> {
    const monthLabel = (
      await this.currentCalendarMonth.innerText()
    ).trim();

    const [monthName, yearText] =
      monthLabel.split(/\s+/);

    const monthIndex = MONTH_NAMES.indexOf(monthName);
    const year = Number(yearText);

    if (
      monthIndex === -1 ||
      !Number.isInteger(year)
    ) {
      throw new Error(
        `Unexpected calendar month label: ${monthLabel}`,
      );
    }

    return year * 12 + monthIndex;
  }

  private parseIsoDate(isoDate: string): Date {
    const [year, month, day] = isoDate
      .split('-')
      .map(Number);

    if (
      !year ||
      !month ||
      !day
    ) {
      throw new Error(
        `Expected an ISO date, received: ${isoDate}`,
      );
    }

    return new Date(
      Date.UTC(year, month - 1, day),
    );
  }

  private formatAccessibleDate(
    date: Date,
  ): string {
    const formattedDate =
      new Intl.DateTimeFormat('en-GB', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        timeZone: 'UTC',
      }).format(date);

    return `Choose ${formattedDate}`;
  }
}
