import React from 'react';
import { Film, Mail, Phone, MapPin, Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-slate-200 pt-14 pb-10 text-slate-600 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-slate-200">
          {/* Col 1: Brand Info */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-600/30">
                <Film className="w-5 h-5 text-white" />
              </div>
              <span className="text-2xl font-black tracking-wider text-slate-900">
                CINE<span className="text-emerald-600">PLEX</span>
              </span>
            </div>
            <p className="text-xs leading-relaxed text-slate-500">
              Trải nghiệm điện ảnh đỉnh cao với hệ thống âm thanh vòm Dolby Atmos, màn chiếu IMAX Laser chuẩn quốc tế và ghế ngồi công thái học sang trọng.
            </p>
          </div>

          {/* Col 2: Hệ thống Rạp */}
          <div>
            <h4 className="text-slate-900 font-bold text-sm tracking-wider uppercase mb-4">Cụm Rạp Toàn Quốc</h4>
            <ul className="space-y-2.5 text-xs">
              <li className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>Cineplex Vincom Bà Triệu (Hà Nội)</span>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>Cineplex Landmark 81 (TP. HCM)</span>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>Cineplex Riverside Đà Nẵng</span>
              </li>
            </ul>
          </div>

          {/* Col 3: Quy định & Điều khoản */}
          <div>
            <h4 className="text-slate-900 font-bold text-sm tracking-wider uppercase mb-4">Chính Sách & Điều Khoản</h4>
            <ul className="space-y-2 text-xs">
              <li><a href="#" className="hover:text-emerald-600 transition">Điều khoản sử dụng</a></li>
              <li><a href="#" className="hover:text-emerald-600 transition">Chính sách thanh toán & hoàn vé</a></li>
              <li><a href="#" className="hover:text-emerald-600 transition">Chính sách bảo mật thông tin</a></li>
              <li><a href="#" className="hover:text-emerald-600 transition">Quy định độ tuổi xem phim (P, K, T13, T16, T18)</a></li>
            </ul>
          </div>

          {/* Col 4: Cổng Thanh Toán */}
          <div>
            <h4 className="text-slate-900 font-bold text-sm tracking-wider uppercase mb-4">Đối Tác Thanh Toán QR</h4>
            <p className="text-xs text-slate-500 mb-3">Hỗ trợ thanh toán không tiền mặt bảo mật & quét mã QR siêu tốc:</p>
            <div className="flex items-center gap-2.5">
              <div className="px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg text-[11px] font-bold text-blue-600">
                ZaloPay
              </div>
              <div className="px-3 py-1.5 bg-pink-50 border border-pink-200 rounded-lg text-[11px] font-bold text-pink-600">
                MoMo QR
              </div>
              <div className="px-3 py-1.5 bg-red-50 border border-red-200 rounded-lg text-[11px] font-bold text-red-600">
                VNPay
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-200 text-xs">
              <div className="flex items-center gap-2 text-slate-600">
                <Phone className="w-3.5 h-3.5 text-emerald-600" />
                <span>Hotline: 1900 6868 (8:00 - 22:00)</span>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>© 2026 Cineplex Vietnam. Hệ thống Đặt Vé Xem Phim Trực Tuyến Hiện Đại.</p>
          <p className="flex items-center gap-1">
            Xây dựng với <Heart className="w-3.5 h-3.5 text-emerald-500 fill-emerald-500" /> Spring Boot, PostgreSQL, Redis, RabbitMQ & React
          </p>
        </div>
      </div>
    </footer>
  );
};
