import React, { useState } from 'react';
import { QrCode, Search, CheckCircle2, XCircle, Film, MapPin, Calendar, Clock, User } from 'lucide-react';
import { ticketApi } from '../../api';

export const VerifyTicketPage: React.FC = () => {
  const [ticketCode, setTicketCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketCode.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await ticketApi.verify(ticketCode.trim());
      setResult(res.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Vé không tồn tại hoặc không hợp lệ.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 shadow-sm mb-2">
            <QrCode className="w-7 h-7" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
            KIỂM TRA & SOÁT VÉ ĐIỆN TỬ
          </h1>
          <p className="text-xs text-slate-500">
            Dành cho nhân viên rạp soát vé hoặc khách hàng tra cứu tính hợp lệ của mã vé.
          </p>
        </div>

        {/* Verification Form */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <form onSubmit={handleVerify} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Nhập Mã Vé Điện Tử (Ví dụ: TKT-20260828-XXXX-01)
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="TKT-XXXX-XXXX"
                  value={ticketCode}
                  onChange={(e) => setTicketCode(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 pl-4 pr-12 text-sm text-slate-800 font-mono placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="absolute right-2 top-2 p-2 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-white transition disabled:opacity-50 shadow-sm"
                >
                  <Search className="w-4 h-4" />
                </button>
              </div>
            </div>
          </form>

          {/* Error Result */}
          {error && (
            <div className="mt-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-3">
              <XCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-600" />
              <div>
                <strong className="block font-bold">VÉ KHÔNG HỢP LỆ!</strong>
                <span>{error}</span>
              </div>
            </div>
          )}

          {/* Valid Result Display */}
          {result && (
            <div className="mt-6 p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                <div>
                  <h4 className="font-black text-sm text-slate-900">VÉ HỢP LỆ - CÓ THỂ VÀO RẠP</h4>
                  <span className="font-mono text-xs text-emerald-700 font-bold">
                    {result.ticketCode}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs text-slate-700 pt-3 border-t border-emerald-200/60">
                <div>
                  <span className="text-slate-500 block font-medium">Tên Phim:</span>
                  <strong className="text-slate-900 font-bold">{result.movie}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block font-medium">Khách Hàng:</span>
                  <strong className="text-slate-900 font-bold">{result.customerName}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block font-medium">Rạp & Phòng:</span>
                  <strong className="text-slate-900 font-bold">{result.cinema} - {result.room}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block font-medium">Vị Trí Ghế:</span>
                  <strong className="text-amber-700 font-black text-sm">{result.seat} ({result.seatType})</strong>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-500 block font-medium">Thời Gian Chiếu:</span>
                  <strong className="text-emerald-700 font-bold">{result.startTime}</strong>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
