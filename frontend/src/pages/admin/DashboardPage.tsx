import React, { useState, useEffect } from 'react';
import { 
  DollarSign, Ticket, Users, Film, TrendingUp, 
  Calendar, Award, ArrowUpRight, BarChart3 
} from 'lucide-react';
import { DashboardStats } from '../../types';
import { adminApi } from '../../api';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell
} from 'recharts';

export const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getDashboardStats();
      setStats(res.data);
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center">
        <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs text-slate-500">Đang tổng hợp số liệu báo cáo...</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="py-12 text-center text-slate-500 font-medium">
        Không thể tải số liệu thống kê. Vui lòng thử lại.
      </div>
    );
  }

  const formattedRevenue = new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(stats.totalRevenue);

  return (
    <div className="space-y-8 animate-fadeIn text-slate-800">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            BẢNG ĐIỀU KHIỂN & BÁO CÁO
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Tổng hợp dữ liệu doanh thu, vé bán ra, phim ăn khách và lượng khách hàng theo thời gian thực.
          </p>
        </div>

        <button
          onClick={fetchStats}
          className="py-2 px-4 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700 transition shadow-sm self-start sm:self-auto"
        >
          Cập nhật số liệu ⟳
        </button>
      </div>

      {/* KPI Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Revenue */}
        <div className="bg-gradient-to-br from-emerald-50 via-white to-white p-6 rounded-3xl border border-emerald-200 shadow-sm space-y-3 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
              Tổng Doanh Thu
            </span>
            <div className="p-2.5 rounded-2xl bg-emerald-100 text-emerald-700 border border-emerald-200">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {formattedRevenue}
          </h3>
          <p className="text-[11px] text-slate-500 flex items-center gap-1 font-medium">
            <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600" />
            <span>Doanh thu từ các đơn vé đã thanh toán</span>
          </p>
        </div>

        {/* Tickets Sold */}
        <div className="bg-gradient-to-br from-amber-50 via-white to-white p-6 rounded-3xl border border-amber-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-800">
              Tổng Vé Đã Bán
            </span>
            <div className="p-2.5 rounded-2xl bg-amber-100 text-amber-700 border border-amber-200">
              <Ticket className="w-5 h-5" />
            </div>
          </div>
          <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {stats.totalTicketsSold.toLocaleString('vi-VN')} <span className="text-base text-slate-400 font-normal">vé</span>
          </h3>
          <p className="text-[11px] text-slate-500 font-medium">
            Từ {stats.totalBookings.toLocaleString('vi-VN')} lượt đặt vé thành công
          </p>
        </div>

        {/* Total Customers */}
        <div className="bg-gradient-to-br from-blue-50 via-white to-white p-6 rounded-3xl border border-blue-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-800">
              Tổng Khách Hàng
            </span>
            <div className="p-2.5 rounded-2xl bg-blue-100 text-blue-700 border border-blue-200">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {stats.totalCustomers.toLocaleString('vi-VN')} <span className="text-base text-slate-400 font-normal">người</span>
          </h3>
          <p className="text-[11px] text-slate-500 font-medium">
            Tài khoản khách hàng đã đăng ký
          </p>
        </div>

        {/* Total Movies & Cinemas */}
        <div className="bg-gradient-to-br from-purple-50 via-white to-white p-6 rounded-3xl border border-purple-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-800">
              Hệ Thống Rạp & Phim
            </span>
            <div className="p-2.5 rounded-2xl bg-purple-100 text-purple-700 border border-purple-200">
              <Film className="w-5 h-5" />
            </div>
          </div>
          <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {stats.totalMovies} <span className="text-base text-slate-400 font-normal">phim</span>
          </h3>
          <p className="text-[11px] text-slate-500 font-medium">
            Đang chiếu tại {stats.totalCinemas} cụm rạp toàn quốc
          </p>
        </div>
      </div>

      {/* 7-Day Revenue Trend Chart */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <TrendingUp className="w-5 h-5 text-emerald-600" />
            <h3 className="font-bold text-slate-900 text-base">
              DOANH THU 7 NGÀY GẦN NHẤT
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-bold">Đơn vị: VNĐ</span>
        </div>

        <div className="h-64 sm:h-72 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={stats.revenueLast7Days}>
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} />
              <YAxis 
                stroke="#94a3b8" 
                fontSize={11} 
                tickLine={false}
                tickFormatter={(val) => `${val / 1000}k`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  borderColor: '#e2e8f0',
                  borderRadius: '1rem',
                  fontSize: '12px',
                  color: '#0f172a',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                }}
                formatter={(val: any) => [
                  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(val)),
                  'Doanh thu',
                ]}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#059669"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#revenueGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Movies & Status Distribution Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top 5 Most Booked Movies */}
        <div className="lg:col-span-2 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-amber-500">
            <Award className="w-5 h-5" />
            <h3 className="font-bold text-slate-900 text-base">
              TOP PHIM ĐƯỢC ĐẶT VÉ NHIỀU NHẤT
            </h3>
          </div>

          {stats.topMovies.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">
              Chưa có dữ liệu đặt vé phim nào.
            </p>
          ) : (
            <div className="space-y-3">
              {stats.topMovies.map((movie, index) => (
                <div
                  key={movie.title}
                  className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 text-center font-black text-sm text-amber-600">
                      #{index + 1}
                    </span>
                    {movie.posterUrl && (
                      <img
                        src={movie.posterUrl}
                        alt={movie.title}
                        className="w-10 h-14 object-cover rounded-lg border border-slate-200 shrink-0 shadow-sm"
                      />
                    )}
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 leading-tight">
                        {movie.title}
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Đã bán: <strong className="text-emerald-600">{movie.ticketsCount} vé</strong>
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xs font-bold text-slate-800">
                      {new Intl.NumberFormat('vi-VN', {
                        style: 'currency',
                        currency: 'VND',
                      }).format(movie.revenue)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Booking Status Distribution */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-emerald-600" />
            <h3 className="font-bold text-slate-900 text-base">
              TRẠNG THÁI ĐƠN ĐẶT VÉ
            </h3>
          </div>

          <div className="space-y-3 pt-2">
            {Object.entries(stats.bookingStatusDistribution).map(([status, count]) => {
              const getBadge = (s: string) => {
                switch (s) {
                  case 'CONFIRMED':
                    return { label: 'Đã Xác Nhận (Thành công)', color: 'text-emerald-700 bg-emerald-50 border border-emerald-200' };
                  case 'PENDING':
                    return { label: 'Đang Chờ Thanh Toán', color: 'text-amber-700 bg-amber-50 border border-amber-200' };
                  case 'EXPIRED':
                    return { label: 'Hết Hạn Giữ Chỗ', color: 'text-slate-500 bg-slate-100 border border-slate-200' };
                  case 'CANCELLED':
                    return { label: 'Đã Hủy', color: 'text-rose-700 bg-rose-50 border border-rose-200' };
                  default:
                    return { label: s, color: 'text-slate-600 bg-slate-100 border border-slate-200' };
                }
              };
              const b = getBadge(status);

              return (
                <div key={status} className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between text-xs">
                  <span className={`px-2.5 py-1 rounded-lg font-bold text-[11px] ${b.color}`}>
                    {b.label}
                  </span>
                  <span className="font-mono font-bold text-slate-900 text-sm">
                    {count} đơn
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
