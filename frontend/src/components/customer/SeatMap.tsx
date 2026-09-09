import React from 'react';
import { ShowtimeSeat } from '../../types';
import { Check, X, ShieldAlert, Sparkles, Heart } from 'lucide-react';

interface SeatMapProps {
  seats: ShowtimeSeat[];
  selectedSeatIds: string[];
  onToggleSeat: (seat: ShowtimeSeat) => void;
  maxSeats?: number;
}

export const SeatMap: React.FC<SeatMapProps> = ({
  seats,
  selectedSeatIds,
  onToggleSeat,
  maxSeats = 8,
}) => {
  // Group seats by seatRow (A, B, C, D...)
  const rowsMap = seats.reduce((acc, seat) => {
    if (!acc[seat.seatRow]) {
      acc[seat.seatRow] = [];
    }
    acc[seat.seatRow].push(seat);
    return acc;
  }, {} as Record<string, ShowtimeSeat[]>);

  // Sort rows alphabetically
  const sortedRowKeys = Object.keys(rowsMap).sort();

  const getSeatStyle = (seat: ShowtimeSeat) => {
    const isSelected = selectedSeatIds.includes(seat.seatId);

    if (seat.status === 'BOOKED') {
      return 'bg-slate-200 border-slate-200 text-slate-400 cursor-not-allowed';
    }

    if (seat.status === 'HOLDING' && !seat.isHeldByCurrentUser && !isSelected) {
      return 'bg-purple-100 border-purple-400 text-purple-800 animate-pulse cursor-not-allowed';
    }

    if (isSelected) {
      return 'bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-600/40 scale-105 ring-2 ring-emerald-400';
    }

    // Seat Types
    switch (seat.seatType) {
      case 'VIP':
        return 'bg-amber-50 border-amber-400 text-amber-900 font-semibold hover:bg-amber-100 hover:border-amber-500 shadow-sm';
      case 'COUPLE':
        return 'bg-rose-50 border-rose-300 text-rose-800 hover:bg-rose-100 hover:border-rose-400 shadow-sm';
      default:
        return 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100 hover:border-slate-400 shadow-sm';
    }
  };

  return (
    <div className="w-full flex flex-col items-center select-none">
      {/* 3D Curved Screen */}
      <div className="w-full max-w-2xl mb-12 text-center perspective-screen">
        <div className="relative">
          <div className="h-2 w-full bg-gradient-to-r from-transparent via-emerald-500 to-transparent rounded-full shadow-[0_0_25px_rgba(16,185,129,0.8)]" />
          <div className="w-full h-10 bg-gradient-to-b from-emerald-500/20 to-transparent blur-md -mt-1" />
        </div>
        <p className="text-[11px] font-bold tracking-[0.3em] uppercase text-slate-400 mt-2">
          MÀN HÌNH CHIẾU
        </p>
      </div>

      {/* Seat Grid */}
      <div className="w-full overflow-x-auto pb-6">
        <div className="min-w-[600px] flex flex-col items-center gap-3">
          {sortedRowKeys.map((rowKey) => {
            const rowSeats = rowsMap[rowKey].sort((a, b) => a.colIndex - b.colIndex);
            const isCoupleRow = rowSeats.some((s) => s.seatType === 'COUPLE');

            return (
              <div key={rowKey} className="flex items-center gap-2">
                {/* Row Letter Left */}
                <span className="w-6 text-center font-bold text-xs text-slate-400">
                  {rowKey}
                </span>

                {/* Seats in Row */}
                <div className="flex items-center gap-2">
                  {rowSeats.map((seat) => {
                    const isSelected = selectedSeatIds.includes(seat.seatId);
                    const isBooked = seat.status === 'BOOKED';
                    const isHolding = seat.status === 'HOLDING' && !seat.isHeldByCurrentUser;
                    const isCouple = seat.seatType === 'COUPLE';

                    return (
                      <button
                        key={seat.seatId}
                        disabled={isBooked || isHolding}
                        onClick={() => onToggleSeat(seat)}
                        className={`relative ${
                          isCouple ? 'w-16' : 'w-8 sm:w-9'
                        } h-8 sm:h-9 rounded-lg border text-[11px] font-bold flex items-center justify-center transition-all duration-200 transform active:scale-95 ${getSeatStyle(
                          seat
                        )}`}
                        title={`Ghế ${seat.seatCode} (${seat.seatType}) - ${new Intl.NumberFormat('vi-VN', {
                          style: 'currency',
                          currency: 'VND',
                        }).format(seat.price)}`}
                      >
                        {isBooked ? (
                          <X className="w-3.5 h-3.5 text-slate-400" />
                        ) : isSelected ? (
                          <Check className="w-4 h-4 text-white" />
                        ) : isCouple ? (
                          <div className="flex items-center gap-1">
                            <Heart className="w-3 h-3 text-rose-500 fill-rose-500" />
                            <span>{seat.seatCode}</span>
                          </div>
                        ) : (
                          <span>{seat.seatNumber}</span>
                        )}

                        {/* VIP Sparkle indicator */}
                        {seat.seatType === 'VIP' && !isSelected && !isBooked && !isHolding && (
                          <span className="absolute -top-1 -right-1 w-2 h-2 bg-amber-500 rounded-full ring-1 ring-white" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Row Letter Right */}
                <span className="w-6 text-center font-bold text-xs text-slate-400">
                  {rowKey}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Seat Map Legend */}
      <div className="mt-8 pt-6 border-t border-slate-200 w-full max-w-3xl">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded border border-slate-300 bg-white shadow-sm" />
            <span className="text-slate-600 text-[11px]">Ghế Thường</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded border border-amber-400 bg-amber-50 relative shadow-sm">
              <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-amber-500 rounded-full ring-1 ring-white" />
            </div>
            <span className="text-amber-900 text-[11px] font-bold">Ghế VIP</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-5 rounded border border-rose-300 bg-rose-50 flex items-center justify-center shadow-sm">
              <Heart className="w-2.5 h-2.5 text-rose-500 fill-rose-500" />
            </div>
            <span className="text-rose-700 text-[11px] font-bold">Ghế Đôi</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-emerald-600 flex items-center justify-center shadow-sm">
              <Check className="w-3 h-3 text-white" />
            </div>
            <span className="text-emerald-700 text-[11px] font-bold">Đang Chọn</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded border border-purple-400 bg-purple-100 animate-pulse" />
            <span className="text-purple-800 text-[11px] font-semibold">Đang Giữ Chỗ</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded border border-slate-200 bg-slate-200 flex items-center justify-center">
              <X className="w-3 h-3 text-slate-400" />
            </div>
            <span className="text-slate-400 text-[11px]">Đã Bán</span>
          </div>
        </div>
      </div>
    </div>
  );
};
