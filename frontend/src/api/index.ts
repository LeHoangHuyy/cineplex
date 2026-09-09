import api from './client';
import { 
  User, Movie, Cinema, Room, Showtime, ShowtimeSeat, 
  Booking, Seat, DashboardStats, PageResponse 
} from '../types';

export const authApi = {
  login: (data: { email: string; password: string }) => 
    api.post<User>('/auth/login', data),
  register: (data: { email: string; password: string; fullName: string; phone?: string }) => 
    api.post<User>('/auth/register', data),
  getMe: () => 
    api.get<User>('/auth/me'),
  updateProfile: (data: { fullName: string; phone?: string; currentPassword?: string; newPassword?: string }) => 
    api.put<User>('/auth/profile', data),
};

export const movieApi = {
  getAll: (status?: string, search?: string, page?: number, size?: number, sortBy?: string, direction?: string) => 
    api.get<PageResponse<Movie>>('/movies', { params: { status, search, page, size, sortBy, direction } }),
  getById: (id: string) => 
    api.get<Movie>(`/movies/${id}`),
  getBySlug: (slug: string) => 
    api.get<Movie>(`/movies/slug/${slug}`),
};

export const cinemaApi = {
  getAll: (city?: string) => 
    api.get<Cinema[]>('/cinemas', { params: { city } }),
  getById: (id: string) => 
    api.get<Cinema>(`/cinemas/${id}`),
  getRooms: (cinemaId: string) => 
    api.get<Room[]>(`/cinemas/${cinemaId}/rooms`),
};

export const showtimeApi = {
  getByMovie: (movieId: string, date?: string) => 
    api.get<Showtime[]>(`/showtimes/movie/${movieId}`, { params: { date } }),
  getByCinema: (cinemaId: string, date?: string) => 
    api.get<Showtime[]>(`/showtimes/cinema/${cinemaId}`, { params: { date } }),
  getById: (id: string) => 
    api.get<Showtime>(`/showtimes/${id}`),
  getSeats: (showtimeId: string) => 
    api.get<ShowtimeSeat[]>(`/showtimes/${showtimeId}/seats`),
};

export const bookingApi = {
  holdSeats: (data: { showtimeId: string; seatIds: string[] }) => 
    api.post<{ success: boolean; message: string }>('/bookings/hold-seats', data),
  createBooking: (data: { showtimeId: string; seatIds: string[]; paymentMethod: string }) => 
    api.post<Booking>('/bookings', data),
  getById: (id: string) => 
    api.get<Booking>(`/bookings/${id}`),
  getByCode: (code: string) => 
    api.get<Booking>(`/bookings/code/${code}`),
  getMyBookings: (page?: number, size?: number) => 
    api.get<PageResponse<Booking>>('/bookings/my-bookings', { params: { page, size } }),
};

export const paymentApi = {
  confirm: (bookingId: string) => 
    api.post<Booking>(`/payments/confirm/${bookingId}`),
};

export const ticketApi = {
  verify: (ticketCode: string) => 
    api.get<{
      valid: boolean;
      ticketCode: string;
      movie: string;
      cinema: string;
      room: string;
      seat: string;
      seatType: string;
      startTime: string;
      customerName: string;
      status: string;
    }>(`/tickets/verify/${ticketCode}`),
};

export const adminApi = {
  getDashboardStats: () => 
    api.get<DashboardStats>('/admin/dashboard'),
  
  // Movies
  createMovie: (data: Partial<Movie>) => 
    api.post<Movie>('/admin/movies', data),
  updateMovie: (id: string, data: Partial<Movie>) => 
    api.put<Movie>(`/admin/movies/${id}`, data),
  deleteMovie: (id: string) => 
    api.delete(`/admin/movies/${id}`),
  
  // Cinemas
  createCinema: (data: Partial<Cinema>) => 
    api.post<Cinema>('/admin/cinemas', data),
  updateCinema: (id: string, data: Partial<Cinema>) => 
    api.put<Cinema>(`/admin/cinemas/${id}`, data),
  deleteCinema: (id: string) => 
    api.delete(`/admin/cinemas/${id}`),
  
  // Rooms
  createRoom: (data: Partial<Room>) => 
    api.post<Room>('/admin/rooms', data),
  updateRoom: (id: string, data: Partial<Room>) => 
    api.put<Room>(`/admin/rooms/${id}`, data),
  deleteRoom: (id: string) => 
    api.delete(`/admin/rooms/${id}`),
  getRoomSeats: (roomId: string) => 
    api.get<Seat[]>(`/admin/rooms/${roomId}/seats`),
  updateRoomSeats: (data: { roomId: string; seats: Partial<Seat>[] }) => 
    api.put<Seat[]>('/admin/rooms/seats', data),

  // Showtimes
  getAllShowtimes: (cinemaId?: string, search?: string, page?: number, size?: number) => 
    api.get<PageResponse<Showtime>>('/admin/showtimes', { params: { cinemaId, search, page, size } }),
  createShowtime: (data: { movieId: string; roomId: string; startTime: string; basePrice: number; status?: string }) => 
    api.post<Showtime>('/admin/showtimes', data),
  updateShowtime: (id: string, data: { movieId: string; roomId: string; startTime: string; basePrice: number; status?: string }) => 
    api.put<Showtime>(`/admin/showtimes/${id}`, data),
  deleteShowtime: (id: string) => 
    api.delete(`/admin/showtimes/${id}`),

  // Bookings
  getAllBookings: (status?: string, search?: string, page?: number, size?: number, sortBy?: string, direction?: string) => 
    api.get<PageResponse<Booking>>('/admin/bookings', { params: { status, search, page, size, sortBy, direction } }),
  getBookingDetail: (id: string) => 
    api.get<Booking>(`/admin/bookings/${id}`),

  // Users
  getAllUsers: (search?: string, page?: number, size?: number, sortBy?: string, direction?: string) => 
    api.get<PageResponse<User>>('/admin/users', { params: { search, page, size, sortBy, direction } }),
  updateUserStatus: (id: string, status: 'ACTIVE' | 'LOCKED') => 
    api.patch<User>(`/admin/users/${id}/status`, { status }),
};

export const uploadApi = {
  uploadImage: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post<{ url: string; originalName: string; size: number; contentType: string }>('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  deleteImage: (url: string) =>
    api.delete('/upload', { params: { url } }),
};


