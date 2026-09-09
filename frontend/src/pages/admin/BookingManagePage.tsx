import React, { useState, useEffect } from 'react';
import { Ticket, Search, QrCode, X, CheckCircle, Clock, AlertCircle, ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { Booking, BookingStatus } from '../../types';
import { adminApi } from '../../api';
import { ETicketCard } from '../../components/customer/ETicketCard';

const SORT_OPTIONS = [
  { label: 'Mới nhất', sortBy: 'createdAt', direction: 'desc' },
  { label: 'Cũ nhất', sortBy: 'createdAt', direction: 'asc' },
  { label: 'Tổng tiền cao nhất', sortBy: 'totalAmount', direction: 'desc' },
  { label: 'Tổng tiền thấp nhất', sortBy: 'totalAmount', direction: 'asc' },
  { label: 'Mã đơn (A-Z)', sortBy: 'bookingCode', direction: 'asc' },
  { label: 'Mã đơn (Z-A)', sortBy: 'bookingCode', direction: 'desc' },
];

export const BookingManagePage: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchBookings(currentPage, statusFilter, search, sortBy, sortDir);
    }, 250);
    return () => clearTimeout(timer);
  }, [currentPage, statusFilter, search, sortBy, sortDir]);

  const fetchBookings = async (
    page: number = currentPage,
    status: string = statusFilter,
    query: string = search,
    sort: string = sortBy,
    dir: 'asc' | 'desc' = sortDir
  ) => {
    setLoading(true);
    try {
      const res = await adminApi.getAllBookings(
        status === 'ALL' ? undefined : status,
        query.trim() ? query.trim() : undefined,
        page - 1,
        ITEMS_PER_PAGE,
        sort,
        dir
      );
      setBookings(res.data.content || []);
      setTotalPages(res.data.totalPages || 1);
      setTotalElements(res.data.totalElements || 0);
    } catch (err) {
      console.error('Error fetching bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortDir(field === 'totalAmount' || field === 'createdAt' ? 'desc' : 'asc');
    }
    setCurrentPage(1);
  };

  const renderSortIcon = (field: string) => {
    if (sortBy !== field) {
      return <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 opacity-60 group-hover:opacity-100" />;
    }
    return sortDir === 'asc' ? (
      <ArrowUp className="w-3.5 h-3.5 text-emerald-600" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 text-emerald-600" />
    );
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  return (
    <div className="space-y-6 animate-fadeIn text-slate-800">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Ticket className="w-7 h-7 text-emerald-600" />
            QUẢN LÝ ĐƠN ĐẶT VÉ
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Theo dõi tất cả giao dịch đặt vé, mã QR soát vé và trạng thái thanh toán của khách hàng.
          </p>
        </div>

        <button
          onClick={() => fetchBookings(currentPage)}
          className="py-2 px-4 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700 transition shadow-sm self-start sm:self-auto"
        >
          Làm mới danh sách ⟳
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            placeholder="Tìm theo mã đơn, email, tên khách, tên phim..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-2 pl-4 pr-10 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
          />
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-2.5" />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            {['ALL', 'CONFIRMED', 'PENDING', 'EXPIRED', 'CANCELLED'].map((st) => (
              <button
                key={st}
                onClick={() => {
                  setStatusFilter(st);
                  setCurrentPage(1);
                }}
                className={`py-1.5 px-3 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                  statusFilter === st
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                }`}
              >
                {st === 'ALL' ? 'Tất Cả' : st}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 shrink-0 border-t sm:border-t-0 sm:border-l border-slate-200 pt-2 sm:pt-0 sm:pl-3 w-full sm:w-auto">
            <span className="text-xs font-bold text-slate-500 whitespace-nowrap">Sắp xếp:</span>
            <select
              value={`${sortBy}-${sortDir}`}
              onChange={(e) => {
                const [field, dir] = e.target.value.split('-');
                setSortBy(field);
                setSortDir(dir as 'asc' | 'desc');
                setCurrentPage(1);
              }}
              aria-label="Sắp xếp danh sách đơn đặt vé"
              className="bg-slate-50 border border-slate-200 rounded-xl py-1.5 px-2.5 text-xs text-slate-700 font-medium focus:outline-none focus:border-emerald-500 cursor-pointer"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={`${opt.sortBy}-${opt.direction}`} value={`${opt.sortBy}-${opt.direction}`}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Bookings Table */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-100 text-slate-600 uppercase tracking-wider text-[11px] font-bold border-b border-slate-200 select-none">
              <tr>
                <th className="py-4 px-5">
                  <button
                    onClick={() => handleSort('bookingCode')}
                    className="group flex items-center gap-1.5 hover:text-emerald-600 transition font-bold"
                  >
                    <span>Mã Đơn</span>
                    {renderSortIcon('bookingCode')}
                  </button>
                </th>
                <th className="py-4 px-4">Khách Hàng</th>
                <th className="py-4 px-4">Phim & Suất Chiếu</th>
                <th className="py-4 px-4">Ghế Đã Đặt</th>
                <th className="py-4 px-4">
                  <button
                    onClick={() => handleSort('totalAmount')}
                    className="group flex items-center gap-1.5 hover:text-emerald-600 transition font-bold"
                  >
                    <span>Tổng Tiền</span>
                    {renderSortIcon('totalAmount')}
                  </button>
                </th>
                <th className="py-4 px-4">
                  <button
                    onClick={() => handleSort('createdAt')}
                    className="group flex items-center gap-1.5 hover:text-emerald-600 transition font-bold"
                  >
                    <span>Ngày Đặt</span>
                    {renderSortIcon('createdAt')}
                  </button>
                </th>
                <th className="py-4 px-4">Trạng Thái</th>
                <th className="py-4 px-5 text-right">Chi Tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    Đang tải danh sách đơn đặt vé...
                  </td>
                </tr>
              ) : bookings.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    Không tìm thấy đơn đặt vé nào.
                  </td>
                </tr>
              ) : (
                bookings.map((b) => {
                  const isConfirmed = b.status === 'CONFIRMED';
                  const seatCodes = b.tickets?.map((t) => t.seatCode).join(', ') || '';

                  return (
                    <tr key={b.id} className="hover:bg-slate-50 transition">
                      <td className="py-3.5 px-5 font-mono font-bold text-emerald-600">
                        {b.bookingCode}
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="font-bold text-slate-900">{b.userFullName}</p>
                        <p className="text-[11px] text-slate-500">{b.userEmail}</p>
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="font-bold text-slate-800">{b.showtime?.movie?.title}</p>
                        <p className="text-[11px] text-emerald-600 font-bold">
                          {b.showtime?.cinema?.name} ({b.showtime?.room?.name})
                        </p>
                      </td>
                      <td className="py-3.5 px-4 font-black text-amber-600">
                        {seatCodes}
                      </td>
                      <td className="py-3.5 px-4 font-black text-slate-900">
                        {new Intl.NumberFormat('vi-VN', {
                          style: 'currency',
                          currency: 'VND',
                        }).format(b.totalAmount)}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 font-medium whitespace-nowrap">
                        {b.createdAt ? new Date(b.createdAt).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' }) : '—'}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-1 rounded-lg text-[10px] font-bold ${
                            isConfirmed
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : b.status === 'PENDING'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {b.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <button
                          onClick={() => setSelectedBooking(b)}
                          className="py-1.5 px-3 rounded-xl bg-slate-100 hover:bg-emerald-600 hover:text-white text-slate-700 font-bold text-[11px] transition flex items-center gap-1 ml-auto shadow-sm border border-slate-200"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                          Xem Vé
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="py-3 px-6 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <p>
            Hiển thị <span className="font-bold text-slate-800">{bookings.length}</span> /{' '}
            <span className="font-bold text-slate-800">{totalElements}</span> đơn đặt vé
          </p>

          {totalPages > 1 && (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white transition shadow-sm"
                title="Trang trước"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                <button
                  key={pageNum}
                  onClick={() => handlePageChange(pageNum)}
                  className={`w-7 h-7 rounded-lg text-xs font-bold transition ${
                    currentPage === pageNum
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {pageNum}
                </button>
              ))}

              <button
                onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white transition shadow-sm"
                title="Trang sau"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Ticket Modal */}
      {selectedBooking && (
        <div
          onClick={() => setSelectedBooking(null)}
          className="fixed inset-0 !m-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-3xl shadow-2xl p-6 sm:p-8 text-slate-800 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-black text-slate-900">
                VÉ ĐIỆN TỬ: {selectedBooking.bookingCode}
              </h3>
              <button
                onClick={() => setSelectedBooking(null)}
                className="p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <ETicketCard booking={selectedBooking} />
          </div>
        </div>
      )}
    </div>
  );
};
