export type BookingDates = {
  checkin: string;
  checkout: string;
};

export type BookingData = {
  roomid: number;
  firstname: string;
  lastname: string;
  depositpaid: boolean;
  bookingdates: BookingDates;
  email: string;
  phone: string;
};

export type CreatedBooking = {
  bookingid: number;
  roomid: number;
  firstname: string;
  lastname: string;
  depositpaid: boolean;
  bookingdates: BookingDates;
};

export type BookingValidationError = {
  errors: string[];
};

export type Room = {
  roomid: number;
  roomName: string;
  roomPrice: number;
  type: string;
  accessible: boolean;
  description: string;
  features: string[];
  image: string;
};

export type RoomsResponse = {
  rooms: Room[];
};

export type RoomReportEntry = {
  start: string;
  end: string;
  title: string;
};

export type RoomReportResponse = {
  report: RoomReportEntry[];
};

export type AuthCredentials = {
  username: string;
  password: string;
};

export type AuthValidationResponse = {
  valid: boolean;
};

export type AuthLoginResponse = {
  token: string;
};

export type RetrievedBooking = CreatedBooking;

export type UpdatedBookingResponse = {
  booking: RetrievedBooking;
  bookingid: number;
};
