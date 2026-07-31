import type {
  Response,
  Locator,
  Page,
} from '@playwright/test';

export class HomePage {
  public readonly heading: Locator;
  public readonly bookNowLink: Locator;
  public readonly checkAvailabilityButton: Locator;

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
    });
  }

  public async open(): Promise<Response | null> {
    return this.page.goto('/');
  }
}

