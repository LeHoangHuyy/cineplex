import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Ticket as TicketIcon, Calendar, Clock, MapPin, QrCode, CheckCircle, Film, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { Booking } from '../../types';
import { bookingApi } from '../../api';
import { useAuth } from '../../contexts/AuthContext';
import { ETicketCard } from '../../components/customer/ETicketCard';

export const MyTicketsPage: React.FC = () => {
  const { user, openAuthModal } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const ITEMS_PER_PAGE = 5;

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    fetchMyBookings(currentPage);
  }, [user, currentPage]);

  const fetchMyBookings = async (page: number = currentPage) => {
    setLoading(true);
    try {
      const res = await bookingApi.getMyBookings(page - 1, ITEMS_PER_PAGE);
      setBookings(res.data.content || []);
      setTotalPages(res.data.totalPages || 1);
      setTotalElements(res.data.totalElements || 0);
    } catch (err) {
      console.error('Error fetching bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 text-center py-20 px-4">
        <div className="max-w-md mx-auto bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <TicketIcon className="w-12 h-12 text-emerald-600 mx-auto" />
          <h2 className="text-xl font-bold text-slate-900">Xem Lịch Sử Đặt Vé</h2>
          <p className="text-xs text-slate-500">
            Vui lòng đăng nhập tài khoản để tra cứu thông tin vé điện tử và mã QR soát vé.
          </p>
          <button
            onClick={() => openAuthModal('login')}
            className="py-3 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition shadow-lg shadow-emerald-600/30"
          >
            Đăng Nhập Ngay
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 flex items-center gap-2.5">
            <TicketIcon className="w-7 h-7 text-emerald-600" />
            VÉ CỦA TÔI & LỊCH SỬ ĐẶT VÉ
          </h1>
          <p className="text-xs text-slate-500">
            Danh sách tất cả các vé xem phim bạn đã đặt trên hệ thống Cineplex.
          </p>
        </div>

        {/* Selected Booking Modal / Detail */}
        {selectedBooking && (
          <div className="bg-white p-6 rounded-3xl border border-emerald-500/40 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <QrCode className="w-5 h-5 text-emerald-600" />
                CHI TIẾT VÉ ĐIỆN TỬ: {selectedBooking.bookingCode}
              </h3>
              <button
                onClick={() => setSelectedBooking(null)}
                className="text-xs text-slate-500 hover:text-slate-900 px-3 py-1 bg-slate-100 hover:bg-slate-200 font-bold rounded-lg transition"
              >
                Đóng
              </button>
            </div>
            <ETicketCard booking={selectedBooking} />
          </div>
        )}

        {/* Bookings List */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-slate-200 rounded-3xl animate-pulse" />
            ))}
          </div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-3">
            <Film className="w-12 h-12 text-slate-400 mx-auto" />
            <h4 className="text-lg font-bold text-slate-800">Bạn chưa có đơn đặt vé nào</h4>
            <p className="text-xs text-slate-500">
              Hãy chọn những bộ phim bom tấn hấp dẫn và đặt vé ngay hôm nay!
            </p>
            <Link
              to="/movies"
              className="inline-block mt-2 py-2.5 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition shadow-md shadow-emerald-600/30"
            >
              Duyệt Phim Chiếu
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => {
              const showtime = booking.showtime;
              const movie = showtime?.movie;
              const cinema = showtime?.cinema;
              const room = showtime?.room;

              const showtimeDate = showtime?.startTime
                ? new Date(showtime.startTime)
                : new Date();
              const formattedDate = showtimeDate.toLocaleDateString('vi-VN', {
                weekday: 'short',
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
              });
              const formattedTime = showtimeDate.toLocaleTimeString('vi-VN', {
                hour: '2-digit',
                minute: '2-digit',
              });

              const isConfirmed = booking.status === 'CONFIRMED';
              const seatCodes = booking.tickets?.map((t) => t.seatCode).join(', ') || '';

              return (
                <div
                  key={booking.id}
                  className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 hover:border-emerald-300 shadow-sm transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="flex gap-4 items-center">
                    {movie?.posterUrl && (
                      <img
                        src={movie.posterUrl}
                        alt={movie.title}
                        className="w-16 sm:w-20 aspect-[2/3] object-cover rounded-xl border border-slate-200 shrink-0 shadow-sm"
                      />
                    )}

                    <div className="space-y-1 text-xs">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            isConfirmed
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {isConfirmed ? 'ĐÃ XÁC NHẬN' : booking.status}
                        </span>
                        <span className="font-mono text-slate-400 font-semibold">{booking.bookingCode}</span>
                      </div>

                      <h3 className="font-black text-slate-900 text-base leading-tight">
                        {movie?.title}
                      </h3>

                      <p className="text-slate-500 flex items-center gap-2">
                        <span className="text-slate-800 font-semibold">{cinema?.name}</span>
                        <span>•</span>
                        <span className="text-emerald-600 font-bold">{room?.name}</span>
                      </p>

                      <p className="text-slate-500 flex items-center gap-3">
                        <span className="capitalize">{formattedDate} ({formattedTime})</span>
                        <span>•</span>
                        <span>Ghế: <strong className="text-amber-600">{seatCodes}</strong></span>
                      </p>
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100 gap-3">
                    <span className="font-black text-lg text-emerald-600">
                      {new Intl.NumberFormat('vi-VN', {
                        style: 'currency',
                        currency: 'VND',
                      }).format(booking.totalAmount)}
                    </span>

                    <button
                      onClick={() => setSelectedBooking(booking)}
                      className="py-2 px-4 rounded-xl bg-slate-100 hover:bg-emerald-600 hover:text-white text-slate-700 font-bold text-xs transition flex items-center gap-1.5 shadow-sm border border-slate-200"
                    >
                      <QrCode className="w-4 h-4" />
                      Xem Vé & QR
                    </button>
                  </div>
                </div>
              );
            })}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-6">
                <button
                  onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white transition shadow-sm"
                  title="Trang trước"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`w-9 h-9 rounded-xl text-xs font-bold transition shadow-sm ${
                      currentPage === pageNum
                        ? 'bg-emerald-600 text-white shadow-emerald-600/30'
                        : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {pageNum}
                  </button>
                ))}

                <button
                  onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white transition shadow-sm"
                  title="Trang sau"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
