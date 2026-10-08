import React, { useState } from 'react';
import { Booking } from '../../types';
import { Film, MapPin, Calendar, Clock, QrCode, CheckCircle, Printer } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

interface ETicketCardProps {
  booking: Booking;
}

export const ETicketCard: React.FC<ETicketCardProps> = ({ booking }) => {
  const [activeTicketIndex, setActiveTicketIndex] = useState(0);

  const showtime = booking.showtime;
  const movie = showtime?.movie;
  const cinema = showtime?.cinema;
  const room = showtime?.room;

  const showtimeDate = showtime?.startTime ? new Date(showtime.startTime) : new Date();
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

  const tickets = booking.tickets && booking.tickets.length > 0 ? booking.tickets : [];
  const activeTicket = tickets[activeTicketIndex] || tickets[0];
  const ticketCode = activeTicket?.ticketCode || booking.bookingCode;
  const seatCodes = tickets.map((t) => t.seatCode).join(', ') || '';

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://cineplex.lehoanghuy.cloud';
  const qrValue = `${origin}/verify-ticket?code=${ticketCode}`;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="w-full max-w-2xl mx-auto bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xl relative text-slate-800">
      {/* Top Header Banner */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 px-6 py-4 flex items-center justify-between text-white shadow-sm">
        <div className="flex items-center gap-2">
          <Film className="w-5 h-5" />
          <span className="font-black tracking-widest text-sm uppercase">
            CINEPLEX CINEMA PASS
          </span>
        </div>
        <div className="flex items-center gap-1.5 bg-black/20 px-3 py-1 rounded-full text-xs font-bold backdrop-blur-md">
          <CheckCircle className="w-3.5 h-3.5 text-emerald-300" />
          <span>VÉ ĐIỆN TỬ HỢP LỆ</span>
        </div>
      </div>

      {/* Main Ticket Body */}
      <div className="p-6 sm:p-8 grid grid-cols-1 sm:grid-cols-3 gap-6">
        {/* Left: Movie Poster & Details */}
        <div className="sm:col-span-2 space-y-4">
          <div className="flex gap-4">
            {movie?.posterUrl && (
              <img
                src={movie.posterUrl}
                alt={movie.title}
                className="w-20 sm:w-24 aspect-[2/3] object-cover rounded-xl shadow-md border border-slate-200 shrink-0"
              />
            )}
            <div>
              <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 mb-1">
                {movie?.ageRating || 'P'}
              </span>
              <h3 className="text-lg sm:text-xl font-black text-slate-900 leading-tight">
                {movie?.title}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">{movie?.genre}</p>
              <p className="text-xs text-slate-500">{movie?.durationMinutes} phút</p>
            </div>
          </div>

          {/* Cinema & Showtime Info Grid */}
          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100 text-xs">
            <div className="space-y-1">
              <span className="text-slate-400 flex items-center gap-1 font-bold">
                <MapPin className="w-3.5 h-3.5 text-emerald-600" /> Rạp Chiếu
              </span>
              <p className="font-bold text-slate-800">{cinema?.name}</p>
              <p className="text-[11px] text-slate-400 truncate">{cinema?.address}</p>
            </div>

            <div className="space-y-1">
              <span className="text-slate-400 flex items-center gap-1 font-bold">
                <Film className="w-3.5 h-3.5 text-emerald-600" /> Phòng Chiếu
              </span>
              <p className="font-bold text-emerald-600">{room?.name}</p>
              <p className="text-[11px] text-slate-400">{room?.roomType}</p>
            </div>

            <div className="space-y-1">
              <span className="text-slate-400 flex items-center gap-1 font-bold">
                <Calendar className="w-3.5 h-3.5 text-emerald-600" /> Ngày Xem
              </span>
              <p className="font-bold text-slate-800 capitalize">{formattedDate}</p>
            </div>

            <div className="space-y-1">
              <span className="text-slate-400 flex items-center gap-1 font-bold">
                <Clock className="w-3.5 h-3.5 text-emerald-600" /> Giờ Chiếu
              </span>
              <p className="font-black text-base text-emerald-600">{formattedTime}</p>
            </div>
          </div>

          {/* Seats Badge */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase tracking-wider text-slate-400 block font-bold">
                Ghế Đã Đặt
              </span>
              <span className="text-lg font-black text-amber-600 tracking-wide">
                {seatCodes}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 block font-bold">
                Tổng Tiền
              </span>
              <span className="text-base font-black text-slate-900">
                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(
                  booking.totalAmount
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Right: QR Code & Ticket Stub */}
        <div className="sm:border-l sm:border-dashed sm:border-slate-200 sm:pl-6 flex flex-col items-center justify-between text-center">
          <div className="w-full flex flex-col items-center">
            {/* Multi-seat ticket switcher pills */}
            {tickets.length > 1 && (
              <div className="w-full mb-2.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Chọn ghế xem mã QR ({tickets.length} vé):
                </span>
                <div className="flex items-center gap-1.5 flex-wrap justify-center">
                  {tickets.map((t, idx) => (
                    <button
                      key={t.id || idx}
                      type="button"
                      onClick={() => setActiveTicketIndex(idx)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                        activeTicketIndex === idx
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                      }`}
                    >
                      {t.seatCode}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Primary QR Code from Ticket */}
            <div className="p-3 bg-white rounded-2xl shadow-md border border-slate-200 mb-2 inline-flex items-center justify-center">
              {activeTicket?.qrCodeBase64 ? (
                <img
                  src={activeTicket.qrCodeBase64}
                  alt={`Mã QR vé ${ticketCode}`}
                  className="w-36 h-36 object-contain rounded-lg"
                />
              ) : (
                <QRCodeSVG
                  value={qrValue}
                  size={144}
                  level="H"
                  includeMargin={false}
                  className="rounded-lg"
                />
              )}
            </div>

            <p className="text-[11px] font-mono font-bold text-emerald-600 tracking-wider">
              {ticketCode}
            </p>
            {activeTicket && (
              <p className="text-[10px] font-bold text-slate-700 mt-0.5">
                Ghế {activeTicket.seatCode} • {activeTicket.seatType}
              </p>
            )}
            <p className="text-[10px] text-slate-400 mt-1 leading-snug">
              Quét mã tại cổng soát vé rạp để vào xem
            </p>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 w-full flex items-center justify-center gap-2">
            <button
              onClick={handlePrint}
              className="py-2 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition border border-slate-200 shadow-sm cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              In Vé
            </button>
          </div>
        </div>
      </div>

      {/* Perforated ticket circles on border */}
      <div className="hidden sm:block absolute -left-3 top-[50%] w-6 h-6 rounded-full bg-slate-50 border-r border-slate-200" />
      <div className="hidden sm:block absolute -right-3 top-[50%] w-6 h-6 rounded-full bg-slate-50 border-l border-slate-200" />
    </div>
  );
};
