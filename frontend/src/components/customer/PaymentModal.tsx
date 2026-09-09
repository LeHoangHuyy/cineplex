import React, { useState, useEffect } from 'react';
import { X, QrCode, CheckCircle2, Clock, ShieldCheck, AlertCircle, Sparkles } from 'lucide-react';
import { Booking, PaymentMethod } from '../../types';
import { paymentApi } from '../../api';

interface PaymentModalProps {
  booking: Booking;
  isOpen: boolean;
  onClose: () => void;
  onPaymentSuccess: (confirmedBooking: Booking) => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  booking,
  isOpen,
  onClose,
  onPaymentSuccess,
}) => {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>(
    booking.payment?.paymentMethod || 'ZALOPAY'
  );
  const [timeLeft, setTimeLeft] = useState<number>(300); // 5 minutes in seconds
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Countdown timer
  useEffect(() => {
    if (!isOpen) return;

    // Calculate remaining seconds from expiresAt
    const expiry = new Date(booking.expiresAt).getTime();
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
  }, [isOpen, booking.expiresAt]);

  if (!isOpen) return null;

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleConfirmPayment = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await paymentApi.confirm(booking.id);
      onPaymentSuccess(res.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Xác nhận thanh toán thất bại');
    } finally {
      setLoading(false);
    }
  };

  const formattedAmount = new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(booking.totalAmount);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg bg-white border border-slate-200 rounded-3xl shadow-2xl p-6 sm:p-8 text-slate-800">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 mb-3 border border-emerald-200 shadow-sm">
            <QrCode className="w-6 h-6" />
          </div>
          <h3 className="text-2xl font-black text-slate-900 tracking-wide">
            THANH TOÁN ĐẶT VÉ
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Mã đơn hàng: <strong className="text-emerald-600">{booking.bookingCode}</strong>
          </p>
        </div>

        {/* Countdown Timer Alert */}
        <div
          className={`flex items-center justify-between p-3.5 rounded-2xl mb-5 border ${
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

        {/* Payment Methods Selection */}
        <div className="grid grid-cols-3 gap-2.5 mb-5">
          <button
            type="button"
            onClick={() => setSelectedMethod('ZALOPAY')}
            className={`py-3 px-2 rounded-2xl border text-center transition flex flex-col items-center gap-1.5 ${
              selectedMethod === 'ZALOPAY'
                ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-sm ring-1 ring-blue-500 font-bold'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
            }`}
          >
            <span className="text-xs font-bold">ZaloPay</span>
            <span className="text-[10px] text-slate-400">Ví / Thẻ ATM</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedMethod('MOMO')}
            className={`py-3 px-2 rounded-2xl border text-center transition flex flex-col items-center gap-1.5 ${
              selectedMethod === 'MOMO'
                ? 'bg-pink-50 border-pink-500 text-pink-700 shadow-sm ring-1 ring-pink-500 font-bold'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
            }`}
          >
            <span className="text-xs font-bold">MoMo QR</span>
            <span className="text-[10px] text-slate-400">Quét mã nhanh</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedMethod('VNPAY')}
            className={`py-3 px-2 rounded-2xl border text-center transition flex flex-col items-center gap-1.5 ${
              selectedMethod === 'VNPAY'
                ? 'bg-red-50 border-red-500 text-red-700 shadow-sm ring-1 ring-red-500 font-bold'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
            }`}
          >
            <span className="text-xs font-bold">VNPay</span>
            <span className="text-[10px] text-slate-400">Ứng dụng Bank</span>
          </button>
        </div>

        {/* QR Code Container */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 flex flex-col items-center justify-center mb-5 text-center">
          <div className="p-3 bg-white rounded-2xl shadow-md border border-slate-200 mb-3">
            {booking.payment?.qrCodeBase64 ? (
              <img
                src={booking.payment.qrCodeBase64}
                alt="Payment QR Code"
                className="w-48 h-48 object-contain rounded-lg"
              />
            ) : (
              <div className="w-48 h-48 bg-slate-100 flex items-center justify-center text-slate-400 text-xs">
                QR Payment Code
              </div>
            )}
          </div>

          <p className="text-xs text-slate-600 font-semibold flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            Mở App {selectedMethod} và quét mã để thanh toán
          </p>

          <div className="mt-3 pt-3 border-t border-slate-200 w-full flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">Tổng số tiền:</span>
            <span className="text-lg font-black text-emerald-600">{formattedAmount}</span>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2 text-xs text-rose-600">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Simulation / Payment Action */}
        <div className="space-y-2">
          <button
            onClick={handleConfirmPayment}
            disabled={loading || timeLeft === 0}
            className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 font-bold text-sm text-white shadow-xl shadow-emerald-600/30 flex items-center justify-center gap-2 transition disabled:opacity-50"
          >
            {loading ? (
              <span>Đang kiểm tra thanh toán...</span>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>MÔ PHỎNG QUÉT & XÁC NHẬN THANH TOÁN</span>
              </>
            )}
          </button>
          <p className="text-[11px] text-center text-slate-400">
            Giao dịch được bảo mật 256-bit SSL & kết nối trực tiếp cổng thanh toán
          </p>
        </div>
      </div>
    </div>
  );
};
