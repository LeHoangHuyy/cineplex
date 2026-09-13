import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Film,
  Calendar,
  Clock,
  MapPin,
  Ticket,
  ShieldAlert,
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  ShieldCheck,
} from 'lucide-react';
import { Showtime, ShowtimeSeat, Booking, PaymentMethod } from '../../types';
import { showtimeApi, bookingApi, paymentApi } from '../../api';
import { useAuth } from '../../contexts/AuthContext';
import { SeatMap } from '../../components/customer/SeatMap';
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

  // Booking step: 'SEATS' -> 'PAYMENT'
  const [bookingStep, setBookingStep] = useState<'SEATS' | 'PAYMENT'>('SEATS');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>('ZALOPAY');
  const [createdBooking, setCreatedBooking] = useState<Booking | null>(null);
  const [confirmedBooking, setConfirmedBooking] = useState<Booking | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(300);

  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showtimeId) return;
    fetchShowtimeAndSeats();

    // Auto-refresh seat status every 10 seconds to reflect Redis lock releases / other bookings
    const interval = setInterval(() => {
      fetchSeatsOnly();
    }, 10000);

    return () => clearInterval(interval);
  }, [showtimeId]);

  // Countdown timer in PAYMENT step
  useEffect(() => {
    if (bookingStep !== 'PAYMENT' || !createdBooking) return;

    const expiry = new Date(createdBooking.expiresAt).getTime();
    const now = new Date().getTime();
    const remaining = Math.max(0, Math.floor((expiry - now) / 1000));
    setTimeLeft(remaining > 0 ? remaining : 300);

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [bookingStep, createdBooking]);

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

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Scroll so that the bottom of the sticky header navbar is exactly 24px above gridRef
  const scrollToGrid = () => {
    setTimeout(() => {
      if (gridRef.current) {
        const navbar = document.querySelector('header');
        const navbarHeight = navbar ? navbar.offsetHeight : 60;
        const gridRect = gridRef.current.getBoundingClientRect();
        const targetY = window.scrollY + gridRect.top - navbarHeight - 24;
        window.scrollTo({
          top: Math.max(0, targetY),
          behavior: 'smooth',
        });
      }
    }, 50);
  };

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
        paymentMethod: selectedPaymentMethod,
      });

      setCreatedBooking(res.data);
      setBookingStep('PAYMENT');
      scrollToGrid();
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          'Không thể giữ ghế. Ghế có thể đã bị người khác chọn. Vui lòng thử lại!'
      );
      fetchSeatsOnly();
    } finally {
      setSubmitting(false);
    }
  };

  const handleSelectPaymentMethod = async (method: PaymentMethod) => {
    setSelectedPaymentMethod(method);
    if (createdBooking) {
      try {
        await paymentApi.updateMethod(createdBooking.id, method);
      } catch (err) {
        console.error('Failed to update payment method on backend', err);
      }
    }
  };

  const handleBackToSeatSelection = () => {
    setBookingStep('SEATS');
    scrollToGrid();
  };

  const handleConfirmPayment = async () => {
    if (!createdBooking) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await paymentApi.confirm(createdBooking.id);
      setConfirmedBooking(res.data);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Xác nhận thanh toán thất bại. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
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
              className="p-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
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
                Mã đơn vé <strong className="text-emerald-600">{confirmedBooking.bookingCode}</strong> đã được xác nhận. Vui lòng xuất trình mã đơn vé tại quầy hoặc ứng dụng để soát vé.
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
          /* Seat Selection or Payment Flow */
          <div ref={gridRef} className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* Left 2 Cols: Either SeatMap or Payment Methods */}
            {bookingStep === 'SEATS' ? (
              <div className="lg:col-span-2 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm">
                <SeatMap
                  seats={seats}
                  selectedSeatIds={selectedSeatIds}
                  onToggleSeat={handleToggleSeat}
                  maxSeats={8}
                />
              </div>
            ) : (
              /* Payment Methods Container replacing Seat Map */
              <div className="lg:col-span-2 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6 animate-fadeIn">
                {/* Header & Back Button */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shadow-xs shrink-0">
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-lg sm:text-xl font-black text-slate-900">
                        PHƯƠNG THỨC THANH TOÁN
                      </h2>
                      <p className="text-xs text-slate-500">
                        Chọn 1 phương thức thanh toán bên dưới để tiếp tục
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleBackToSeatSelection}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition self-start sm:self-auto cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Thay đổi ghế</span>
                  </button>
                </div>

                {/* Countdown Timer Alert */}
                <div
                  className={`flex items-center justify-between p-4 rounded-2xl border ${
                    timeLeft < 60
                      ? 'bg-rose-50 border-rose-200 text-rose-700'
                      : 'bg-amber-50 border-amber-200 text-amber-800'
                  }`}
                >
                  <div className="flex items-center gap-2 text-xs font-bold">
                    <Clock className="w-4 h-4" />
                    <span>Thời gian giữ ghế còn lại:</span>
                  </div>
                  <span className="font-mono text-base font-black tracking-wider">
                    {formatTime(timeLeft)}
                  </span>
                </div>

                {/* Payment Methods List: ZaloPay, Momo, VNPay */}
                <div className="space-y-3">
                  {/* ZaloPay */}
                  <div
                    onClick={() => handleSelectPaymentMethod('ZALOPAY')}
                    className={`p-4 sm:p-5 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between gap-4 ${
                      selectedPaymentMethod === 'ZALOPAY'
                        ? 'border-sky-500 bg-sky-50/60 shadow-md shadow-sky-500/10'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-2xl bg-sky-600 text-white flex items-center justify-center font-black text-sm shadow-sm shrink-0">
                        ZP
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-slate-900 text-sm sm:text-base">Ví điện tử ZaloPay</h4>
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-sky-100 text-sky-700">
                            Phổ biến
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Thanh toán an toàn, tức thì qua ví điện tử ZaloPay hoặc liên kết ngân hàng
                        </p>
                      </div>
                    </div>
                    <div className="shrink-0">
                      <div
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                          selectedPaymentMethod === 'ZALOPAY'
                            ? 'border-sky-500 bg-sky-500 text-white'
                            : 'border-slate-300'
                        }`}
                      >
                        {selectedPaymentMethod === 'ZALOPAY' && <CheckCircle2 className="w-4 h-4" />}
                      </div>
                    </div>
                  </div>

                  {/* MoMo */}
                  <div
                    onClick={() => handleSelectPaymentMethod('MOMO')}
                    className={`p-4 sm:p-5 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between gap-4 ${
                      selectedPaymentMethod === 'MOMO'
                        ? 'border-pink-500 bg-pink-50/60 shadow-md shadow-pink-500/10'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-2xl bg-[#A50064] text-white flex items-center justify-center font-black text-sm shadow-sm shrink-0">
                        MM
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-slate-900 text-sm sm:text-base">Ví điện tử MoMo</h4>
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-pink-100 text-pink-700">
                            Khuyên dùng
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Thanh toán siêu tốc, tiện lợi với ví điện tử MoMo
                        </p>
                      </div>
                    </div>
                    <div className="shrink-0">
                      <div
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                          selectedPaymentMethod === 'MOMO'
                            ? 'border-pink-500 bg-pink-500 text-white'
                            : 'border-slate-300'
                        }`}
                      >
                        {selectedPaymentMethod === 'MOMO' && <CheckCircle2 className="w-4 h-4" />}
                      </div>
                    </div>
                  </div>

                  {/* VNPay */}
                  <div
                    onClick={() => handleSelectPaymentMethod('VNPAY')}
                    className={`p-4 sm:p-5 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between gap-4 ${
                      selectedPaymentMethod === 'VNPAY'
                        ? 'border-rose-500 bg-rose-50/60 shadow-md shadow-rose-500/10'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-600 to-blue-600 text-white flex items-center justify-center font-black text-xs shadow-sm shrink-0">
                        VNPAY
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-slate-900 text-sm sm:text-base">Cổng thanh toán VNPAY</h4>
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-rose-100 text-rose-700">
                            ATM / Visa / Bank
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Hỗ trợ hơn 40 ngân hàng tại Việt Nam, thẻ quốc tế Visa, MasterCard, JCB
                        </p>
                      </div>
                    </div>
                    <div className="shrink-0">
                      <div
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                          selectedPaymentMethod === 'VNPAY'
                            ? 'border-rose-500 bg-rose-500 text-white'
                            : 'border-slate-300'
                        }`}
                      >
                        {selectedPaymentMethod === 'VNPAY' && <CheckCircle2 className="w-4 h-4" />}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Security Badge */}
                <div className="flex items-center gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-slate-500 text-xs">
                  <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>
                    Giao dịch được mã hóa và bảo mật 256-bit SSL tiêu chuẩn quốc tế.
                  </span>
                </div>
              </div>
            )}

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

              {/* Payment Method badge when in PAYMENT step */}
              {bookingStep === 'PAYMENT' && (
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">Phương thức:</span>
                  <span className="font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                    {selectedPaymentMethod === 'ZALOPAY'
                      ? 'ZaloPay'
                      : selectedPaymentMethod === 'MOMO'
                      ? 'MoMo'
                      : 'VNPay'}
                  </span>
                </div>
              )}

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

              {/* Timeout Warning in PAYMENT step */}
              {bookingStep === 'PAYMENT' && timeLeft === 0 && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-600 space-y-2">
                  <p className="font-bold">Thời gian giữ ghế đã hết hạn!</p>
                  <button
                    onClick={handleBackToSeatSelection}
                    className="w-full py-2 px-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition cursor-pointer"
                  >
                    Chọn lại ghế
                  </button>
                </div>
              )}

              {/* Action Button */}
              {bookingStep === 'SEATS' ? (
                <button
                  onClick={handleProceedToBooking}
                  disabled={submitting || selectedSeats.length === 0}
                  className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 font-black text-sm text-white shadow-xl shadow-emerald-600/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] cursor-pointer"
                >
                  {submitting ? 'Đang giữ ghế...' : 'TIẾP TỤC THANH TOÁN'}
                </button>
              ) : (
                <button
                  onClick={handleConfirmPayment}
                  disabled={submitting || timeLeft === 0}
                  className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 font-black text-sm text-white shadow-xl shadow-emerald-600/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] cursor-pointer"
                >
                  {submitting ? 'Đang xử lý thanh toán...' : 'XÁC NHẬN THANH TOÁN'}
                </button>
              )}

              <p className="text-[11px] text-slate-400 text-center leading-relaxed">
                {bookingStep === 'SEATS'
                  ? 'Ghế sẽ được khóa tạm thời trong 5 phút sau khi nhấn Tiếp tục'
                  : 'Nhấn xác nhận để hoàn tất đơn đặt vé và nhận vé điện tử'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
