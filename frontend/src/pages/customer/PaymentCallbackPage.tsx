import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
  CheckCircle2,
  XCircle,
  Clock,
  Ticket,
  Home,
  RefreshCw,
  Film,
  ArrowRight,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { Booking } from '../../types';
import { paymentApi, bookingApi } from '../../api';
import { ETicketCard } from '../../components/customer/ETicketCard';

export const PaymentCallbackPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [gatewayName, setGatewayName] = useState<string>('Cổng thanh toán');
  const [failedBookingId, setFailedBookingId] = useState<string | null>(null);
  const [simulating, setSimulating] = useState(false);

  const calledRef = useRef(false);

  useEffect(() => {
    // Prevent duplicate calls in React StrictMode
    if (calledRef.current) return;
    calledRef.current = true;

    verifyPayment();
  }, []);

  const detectGateway = (params: Record<string, string>) => {
    if (params.vnp_ResponseCode || params.vnp_TxnRef) {
      return 'VNPay';
    }
    if (params.partnerCode || params.resultCode) {
      return 'MoMo';
    }
    if (params.apptransid || params.appid) {
      return 'ZaloPay';
    }
    return 'Cổng thanh toán';
  };

  const verifyPayment = async () => {
    const params = Object.fromEntries(searchParams.entries());
    const detected = detectGateway(params);
    setGatewayName(detected);

    if (Object.keys(params).length === 0) {
      setLoading(false);
      setSuccess(false);
      setErrorMessage('Không nhận được tham số thanh toán từ cổng giao dịch.');
      return;
    }

    try {
      setLoading(true);
      const res = await paymentApi.handleCallback(params);
      if (res.data.success) {
        setSuccess(true);
        if (res.data.booking) {
          setBooking(res.data.booking);
        } else if (res.data.bookingId) {
          try {
            const bRes = await bookingApi.getById(res.data.bookingId);
            setBooking(bRes.data);
          } catch (fetchErr) {
            console.error('Failed to fetch booking by ID:', fetchErr);
          }
        }
      } else {
        setSuccess(false);
        if (res.data.bookingId) {
          setFailedBookingId(res.data.bookingId);
        }
        setErrorMessage(
          res.data.message || 'Giao dịch không thành công hoặc bạn đã hủy thao tác thanh toán.'
        );
      }
    } catch (err: any) {
      console.error('Payment callback verification failed:', err);
      setSuccess(false);
      setErrorMessage(
        err.response?.data?.message ||
          'Không thể xác thực kết quả thanh toán. Vui lòng liên hệ bộ phận hỗ trợ.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSimulateSuccess = async () => {
    if (!failedBookingId) return;
    setSimulating(true);
    try {
      const res = await paymentApi.confirm(failedBookingId);
      if (res.data) {
        setSuccess(true);
        setBooking(res.data);
      }
    } catch (err: any) {
      console.error('Simulation failed:', err);
      alert(err.response?.data?.message || 'Mô phỏng xác nhận thanh toán thất bại.');
    } finally {
      setSimulating(false);
    }
  };

  // 1. Loading state
  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 py-16 text-center">
        <div className="relative mb-6">
          <div className="w-16 h-16 border-4 border-emerald-600/30 border-t-emerald-600 rounded-full animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <RefreshCw className="w-6 h-6 text-emerald-600 animate-pulse" />
          </div>
        </div>
        <h2 className="text-2xl font-black text-slate-900 mb-2">Đang xác thực thanh toán...</h2>
        <p className="text-sm text-slate-500 max-w-md">
          Hệ thống đang đồng bộ dữ liệu giao dịch với đối tác {gatewayName}. Vui lòng không đóng tab hoặc tải lại trang!
        </p>
      </div>
    );
  }

  // 2. Success state
  if (success) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-800 py-10 px-4 sm:px-6 lg:px-8 animate-fadeIn">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Header Banner */}
          <div className="text-center space-y-3 bg-white p-6 sm:p-8 rounded-3xl border border-emerald-100 shadow-sm">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 border border-emerald-300 flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Đã xác thực giao dịch qua {gatewayName} Sandbox
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              ĐẶT VÉ VÀ THANH TOÁN THÀNH CÔNG!
            </h1>

            <p className="text-sm text-slate-500 max-w-xl mx-auto">
              Cảm ơn bạn đã lựa chọn dịch vụ của Cineplex. Vé điện tử của bạn đã được xuất thành công bên dưới và lưu vào tài khoản.
            </p>
          </div>

          {/* Electronic Ticket Card */}
          {booking && (
            <div className="space-y-4">
              <ETicketCard booking={booking} />
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Link
              to="/my-tickets"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition shadow-md cursor-pointer"
            >
              <Ticket className="w-5 h-5" />
              Xem vé của tôi
            </Link>

            <Link
              to="/"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl bg-white hover:bg-slate-100 text-slate-700 font-bold border border-slate-200 transition shadow-sm cursor-pointer"
            >
              <Home className="w-5 h-5" />
              Về trang chủ
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 3. Failed / Cancelled state
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 py-16 text-center animate-fadeIn">
      <div className="max-w-md w-full bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
        <div className="w-16 h-16 rounded-full bg-rose-100 text-rose-600 border border-rose-200 flex items-center justify-center mx-auto shadow-sm">
          <XCircle className="w-10 h-10" />
        </div>

        <div className="space-y-2">
          <span className="px-3 py-1 rounded-full bg-rose-50 text-rose-600 text-xs font-bold border border-rose-200">
            {gatewayName} Sandbox
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900">
            THANH TOÁN CHƯA HOÀN TẤT
          </h2>
          <p className="text-sm text-slate-500">
            {errorMessage || 'Giao dịch đã bị hủy hoặc xảy ra lỗi trong quá trình xử lý.'}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 text-left space-y-1">
          <p className="font-semibold text-slate-800">Lưu ý giữ ghế:</p>
          <p>
            Nếu ghế của bạn vẫn còn trong thời gian giữ chỗ, bạn có thể quay lại trang đặt vé để thực hiện lại thanh toán.
          </p>
        </div>

        {/* Sandbox Simulation Helper */}
        {failedBookingId && (
          <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 text-left space-y-2.5">
            <div className="flex items-center gap-1.5 text-amber-900 font-bold text-xs">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span>Chế độ kiểm thử (Sandbox Simulator)</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Bạn có thể mô phỏng xác nhận thanh toán thành công để tiếp tục kiểm thử luồng xuất vé của đơn này:
            </p>
            <button
              type="button"
              onClick={handleSimulateSuccess}
              disabled={simulating}
              className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition flex items-center justify-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
            >
              {simulating ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <CheckCircle2 className="w-3.5 h-3.5" />
              )}
              <span>⚡ Xác nhận thanh toán thành công ngay</span>
            </button>
          </div>
        )}

        <div className="flex flex-col gap-3">
          <button
            onClick={() => navigate(-1)}
            className="w-full py-3 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition shadow-sm cursor-pointer flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Thử lại thanh toán
          </button>

          <Link
            to="/movies"
            className="w-full py-3 px-6 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition cursor-pointer flex items-center justify-center gap-2"
          >
            <Film className="w-4 h-4" />
            Chọn suất chiếu khác
          </Link>

          <Link
            to="/"
            className="text-xs text-slate-500 hover:text-slate-800 font-medium py-1 transition"
          >
            &larr; Về trang chủ
          </Link>
        </div>
      </div>
    </div>
  );
};
