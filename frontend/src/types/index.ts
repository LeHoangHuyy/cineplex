export type Role = 'ROLE_CUSTOMER' | 'ROLE_ADMIN';
export type UserStatus = 'ACTIVE' | 'LOCKED';

export interface User {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  role: Role;
  status: UserStatus;
  token?: string;
}

export type MovieStatus = 'NOW_SHOWING' | 'COMING_SOON' | 'ENDED';
export type AgeRating = 'P' | 'K' | 'T13' | 'T16' | 'T18' | 'C';

export interface Movie {
  id: string;
  title: string;
  slug: string;
  description: string;
  durationMinutes: number;
  genre: string;
  director?: string;
  castMembers?: string;
  posterUrl: string;
  bannerUrl?: string;
  trailerUrl?: string;
  ageRating: AgeRating;
  releaseDate: string;
  endDate?: string;
  status: MovieStatus;
  createdAt: string;
}

export type RoomType = 'STANDARD_2D' | 'IMAX_3D' | 'FOUR_DX';

export interface Room {
  id: string;
  cinemaId: string;
  cinemaName?: string;
  name: string;
  totalRows: number;
  totalCols: number;
  roomType: RoomType;
  totalSeats?: number;
}

export interface Cinema {
  id: string;
  name: string;
  address: string;
  city: string;
  phone?: string;
  imageUrl?: string;
  rooms?: Room[];
}

export type SeatType = 'REGULAR' | 'VIP' | 'COUPLE';

export interface Seat {
  id: string;
  seatRow: string;
  seatNumber: number;
  seatCode: string;
  seatType: SeatType;
  rowIndex: number;
  colIndex: number;
}

export type ShowtimeStatus = 'SCHEDULED' | 'ONGOING' | 'COMPLETED' | 'CANCELLED';

export interface Showtime {
  id: string;
  movie: Movie;
  room: Room;
  cinema: Cinema;
  startTime: string;
  endTime: string;
  basePrice: number;
  status: ShowtimeStatus;
  availableSeatsCount: number;
  totalSeatsCount: number;
}

export interface ShowtimeSeat {
  showtimeSeatId: string;
  seatId: string;
  seatRow: string;
  seatNumber: number;
  seatCode: string;
  seatType: SeatType;
  rowIndex: number;
  colIndex: number;
  price: number;
  status: 'AVAILABLE' | 'HOLDING' | 'BOOKED';
  isHeldByCurrentUser: boolean;
}

export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'EXPIRED';
export type PaymentMethod = 'ZALOPAY' | 'MOMO' | 'VNPAY';
export type PaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED';

export interface Ticket {
  id: string;
  ticketCode: string;
  seatCode: string;
  seatRow: string;
  seatNumber: number;
  seatType: SeatType;
  price: number;
  qrCodeBase64?: string;
}

export interface Payment {
  id: string;
  bookingId: string;
  paymentMethod: PaymentMethod;
  transactionCode: string;
  amount: number;
  status: PaymentStatus;
  qrCodeData?: string;
  qrCodeBase64?: string;
  paidAt?: string;
  createdAt: string;
}

export interface Booking {
  id: string;
  bookingCode: string;
  userId: string;
  userFullName: string;
  userEmail: string;
  userPhone?: string;
  showtime: Showtime;
  totalAmount: number;
  status: BookingStatus;
  expiresAt: string;
  createdAt: string;
  tickets: Ticket[];
  payment?: Payment;
}

export interface DashboardStats {
  totalTicketsSold: number;
  totalBookings: number;
  totalRevenue: number;
  totalCustomers: number;
  totalMovies: number;
  totalCinemas: number;
  revenueLast7Days: {
    date: string;
    revenue: number;
    ticketsCount: number;
  }[];
  topMovies: {
    title: string;
    posterUrl: string;
    ticketsCount: number;
    revenue: number;
  }[];
  bookingStatusDistribution: Record<string, number>;
}

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

