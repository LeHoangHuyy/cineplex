import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Film, Calendar, Clock, MapPin, Ticket, ShieldAlert, ArrowLeft, CheckCircle2, QrCode } from 'lucide-react';
import { Showtime, ShowtimeSeat, Booking, PaymentMethod } from '../../types';
import { showtimeApi, bookingApi } from '../../api';
import { useAuth } from '../../contexts/AuthContext';
import { SeatMap } from '../../components/customer/SeatMap';
import { PaymentModal } from '../../components/customer/PaymentModal';
import { ETicketCard } from '../../components/customer/ETicketCard';

export const BookingPage: React.FC = () => {
  const { showtimeId } = useParams<{ showtimeId: string }>();
  const navigate = useNavigate();
  const { user, openAuthModal } = useAuth();

  const [showtime, setShowtime] = useState<Showtime | null>(null);
  const [seats, setSeats] = useState<ShowtimeSeat[]>([]);
  const [selectedSeatIds, setSelectedSeatIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Active Booking & Payment Modal
  const [createdBooking, setCreatedBooking] = useState<Booking | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState<Booking | null>(null);

  useEffect(() => {
    if (!showtimeId) return;
    fetchShowtimeAndSeats();

    // Auto-refresh seat status every 10 seconds to reflect Redis lock releases / other bookings
    const interval = setInterval(() => {
      fetchSeatsOnly();
    }, 10000);

    return () => clearInterval(interval);
  }, [showtimeId]);

  const fetchShowtimeAndSeats = async () => {
    if (!showtimeId) return;
    setLoading(true);
    try {
      const [stRes, seatsRes] = await Promise.all([
        showtimeApi.getById(showtimeId),
        showtimeApi.getSeats(showtimeId),
      ]);
      setShowtime(stRes.data);
      setSeats(seatsRes.data);
    } catch (err) {
      console.error('Error fetching booking data:', err);
      setError('Không tìm thấy thông tin suất chiếu hoặc ghế.');
    } finally {
      setLoading(false);
    }
  };

  const fetchSeatsOnly = async () => {
    if (!showtimeId || confirmedBooking) return;
    try {
      const seatsRes = await showtimeApi.getSeats(showtimeId);
      setSeats(seatsRes.data);
    } catch (err) {
      console.error('Error refreshing seats:', err);
    }
  };

  const handleToggleSeat = (seat: ShowtimeSeat) => {
    setError(null);
    if (selectedSeatIds.includes(seat.seatId)) {
      setSelectedSeatIds(selectedSeatIds.filter((id) => id !== seat.seatId));
    } else {
      if (selectedSeatIds.length >= 8) {
        setError('Bạn chỉ có thể đặt tối đa 8 ghế trong một đơn hàng.');
        return;
      }
      setSelectedSeatIds([...selectedSeatIds, seat.seatId]);
    }
  };

  const selectedSeats = seats.filter((s) => selectedSeatIds.includes(s.seatId));
  const totalPrice = selectedSeats.reduce((sum, s) => sum + s.price, 0);

  const handleProceedToBooking = async () => {
    if (!user) {
      openAuthModal('login');
      return;
    }

    if (selectedSeatIds.length === 0) {
      setError('Vui lòng chọn ít nhất 1 ghế để tiếp tục.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      // 1. Hold seats in Redis
      await bookingApi.holdSeats({
        showtimeId: showtimeId!,
        seatIds: selectedSeatIds,
      });

      // 2. Create Booking in database
      const res = await bookingApi.createBooking({
        showtimeId: showtimeId!,
        seatIds: selectedSeatIds,
        paymentMethod: 'ZALOPAY',
      });

      setCreatedBooking(res.data);
      setIsPaymentModalOpen(true);
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          'Không thể giữ ghế. Ghế có thể đã bị người khác chọn. Vui lòng thử lại!'
      );
      // Refresh seat status
      fetchSeatsOnly();
    } finally {
      setSubmitting(false);
    }
  };

  const handlePaymentSuccess = (confirmed: Booking) => {
    setIsPaymentModalOpen(false);
    setConfirmedBooking(confirmed);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!showtime) {
    return (
      <div className="min-h-screen bg-slate-50 text-center py-20">
        <h2 className="text-xl font-bold text-slate-800 mb-2">Suất chiếu không tồn tại</h2>
        <Link to="/movies" className="text-emerald-600 font-bold hover:underline">
          &larr; Quay lại danh sách phim
        </Link>
      </div>
    );
  }

  const movie = showtime.movie;
  const cinema = showtime.cinema;
  const room = showtime.room;

  const showtimeDate = new Date(showtime.startTime);
  const formattedDate = showtimeDate.toLocaleDateString('vi-VN', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const formattedTime = showtimeDate.toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Top Breadcrumb & Showtime Info Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
              title="Quay lại"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-600 text-white">
                  {movie?.ageRating || 'P'}
                </span>
                <h1 className="text-lg sm:text-2xl font-black text-slate-900">{movie?.title}</h1>
              </div>
              <p className="text-xs text-slate-500 flex flex-wrap items-center gap-3">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                  {cinema?.name} ({room?.name})
                </span>
                <span>•</span>
                <span className="flex items-center gap-1 capitalize">
                  <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                  {formattedDate}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1 font-bold text-emerald-600">
                  <Clock className="w-3.5 h-3.5" />
                  {formattedTime}
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Confirmed Ticket Screen */}
        {confirmedBooking ? (
          <div className="space-y-6 py-4 animate-fadeIn">
            <div className="text-center space-y-2 max-w-xl mx-auto">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 border border-emerald-300 flex items-center justify-center mx-auto shadow-md">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
                ĐẶT VÉ THÀNH CÔNG!
              </h2>
              <p className="text-xs text-slate-500">
                Mã đơn vé <strong className="text-emerald-600">{confirmedBooking.bookingCode}</strong> đã được xác nhận. Vui lòng lưu mã QR hoặc xuất trình tại quầy soát vé.
              </p>
            </div>

            {/* E-Ticket Component */}
            <ETicketCard booking={confirmedBooking} />

            <div className="flex items-center justify-center gap-4 pt-4">
              <Link
                to="/my-tickets"
                className="py-3 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition flex items-center gap-2"
              >
                <Ticket className="w-4 h-4" />
                Xem Vé Của Tôi
              </Link>
              <Link
                to="/"
                className="py-3 px-6 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition border border-slate-200"
              >
                Về Trang Chủ
              </Link>
            </div>
          </div>
        ) : (
          /* Normal Seat Booking Flow */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* Left 2 Cols: Interactive Seat Matrix */}
            <div className="lg:col-span-2 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm">
              <SeatMap
                seats={seats}
                selectedSeatIds={selectedSeatIds}
                onToggleSeat={handleToggleSeat}
                maxSeats={8}
              />
            </div>

            {/* Right 1 Col: Booking Summary & Action */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6 text-slate-800">
              <h3 className="font-black text-lg text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
                <Ticket className="w-5 h-5 text-emerald-600" />
                THÔNG TIN ĐẶT VÉ
              </h3>

              {/* Movie Meta Box */}
              <div className="flex gap-3">
                {movie?.posterUrl && (
                  <img
                    src={movie.posterUrl}
                    alt={movie.title}
                    className="w-16 aspect-[2/3] object-cover rounded-xl border border-slate-200 shrink-0 shadow-sm"
                  />
                )}
                <div className="space-y-1 text-xs">
                  <h4 className="font-bold text-slate-900 leading-tight">{movie?.title}</h4>
                  <p className="text-slate-500">{cinema?.name}</p>
                  <p className="text-emerald-600 font-bold">{room?.name} - {room?.roomType}</p>
                  <p className="text-slate-500 capitalize">{formattedDate} ({formattedTime})</p>
                </div>
              </div>

              {/* Selected Seats List */}
              <div className="space-y-2 pt-3 border-t border-slate-100">
                <span className="text-xs font-bold text-slate-600 block">Ghế đã chọn:</span>
                {selectedSeats.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">Chưa chọn ghế nào</p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {selectedSeats.map((s) => (
                      <span
                        key={s.seatId}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                          s.seatType === 'VIP'
                            ? 'bg-amber-50 text-amber-800 border border-amber-300'
                            : s.seatType === 'COUPLE'
                            ? 'bg-rose-50 text-rose-800 border border-rose-300'
                            : 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                        }`}
                      >
                        {s.seatCode} ({s.seatType})
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Total Calculation */}
              <div className="pt-4 border-t border-slate-100 space-y-2 text-xs">
                <div className="flex justify-between text-slate-500">
                  <span>Số lượng ghế:</span>
                  <span className="font-bold text-slate-800">{selectedSeats.length} ghế</span>
                </div>
                <div className="flex justify-between text-base items-center pt-2">
                  <span className="font-bold text-slate-700">Tổng tiền:</span>
                  <span className="font-black text-xl text-emerald-600">
                    {new Intl.NumberFormat('vi-VN', {
                      style: 'currency',
                      currency: 'VND',
                    }).format(totalPrice)}
                  </span>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-600 flex items-start gap-2">
                  <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Action Button */}
              <button
                onClick={handleProceedToBooking}
                disabled={submitting || selectedSeats.length === 0}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 font-black text-sm text-white shadow-xl shadow-emerald-600/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02]"
              >
                {submitting ? 'Đang giữ ghế...' : 'TIẾP TỤC THANH TOÁN'}
              </button>

              <p className="text-[11px] text-slate-400 text-center leading-relaxed">
                Ghế sẽ được khóa tạm thời trong 5 phút sau khi nhấn Tiếp tục
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Payment QR Modal */}
      {createdBooking && (
        <PaymentModal
          booking={createdBooking}
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
};
