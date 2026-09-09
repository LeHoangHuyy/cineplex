import React, { useState, useEffect } from 'react';
import { CalendarDays, Plus, Edit2, Trash2, MapPin, Film, Clock, AlertTriangle, X, Check, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { Showtime, Movie, Cinema, Room, ShowtimeStatus } from '../../types';
import { adminApi, cinemaApi, movieApi } from '../../api';

export const ShowtimeManagePage: React.FC = () => {
  const [showtimes, setShowtimes] = useState<Showtime[]>([]);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [cinemas, setCinemas] = useState<Cinema[]>([]);
  const [selectedCinemaFilter, setSelectedCinemaFilter] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const ITEMS_PER_PAGE = 10;

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingShowtime, setEditingShowtime] = useState<Showtime | null>(null);

  // Form State
  const [selectedMovieId, setSelectedMovieId] = useState<string>('');
  const [selectedCinemaId, setSelectedCinemaId] = useState<string>('');
  const [selectedRoomId, setSelectedRoomId] = useState<string>('');
  const [availableRooms, setAvailableRooms] = useState<Room[]>([]);
  const [startTime, setStartTime] = useState<string>('');
  const [basePrice, setBasePrice] = useState<number>(80000);
  const [status, setStatus] = useState<ShowtimeStatus>('SCHEDULED');

  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchShowtimes(selectedCinemaFilter, search, currentPage);
    }, 250);
    return () => clearTimeout(timer);
  }, [currentPage, selectedCinemaFilter, search]);

  const fetchInitialData = async () => {
    try {
      const [moviesRes, cinemasRes] = await Promise.all([
        movieApi.getAll(undefined, undefined, 0, 100),
        cinemaApi.getAll(),
      ]);
      setMovies(moviesRes.data.content || (moviesRes.data as any));
      setCinemas(cinemasRes.data);
    } catch (err) {
      console.error('Error fetching initial showtime data:', err);
    }
  };

  const fetchShowtimes = async (
    cinemaId: string = selectedCinemaFilter,
    query: string = search,
    page: number = currentPage
  ) => {
    setLoading(true);
    try {
      const filter = cinemaId === 'ALL' ? undefined : cinemaId;
      const res = await adminApi.getAllShowtimes(
        filter,
        query.trim() ? query.trim() : undefined,
        page - 1,
        ITEMS_PER_PAGE
      );
      setShowtimes(res.data.content || []);
      setTotalPages(res.data.totalPages || 1);
      setTotalElements(res.data.totalElements || 0);
    } catch (err) {
      console.error('Error fetching showtimes:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCinemaFilterChange = (cinemaId: string) => {
    setSelectedCinemaFilter(cinemaId);
    setCurrentPage(1);
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  // When selected cinema changes in form, update available rooms
  useEffect(() => {
    if (!selectedCinemaId) {
      setAvailableRooms([]);
      setSelectedRoomId('');
      return;
    }
    const cinema = cinemas.find((c) => c.id === selectedCinemaId);
    if (cinema?.rooms && cinema.rooms.length > 0) {
      setAvailableRooms(cinema.rooms);
      setSelectedRoomId(cinema.rooms[0].id);
    } else {
      setAvailableRooms([]);
      setSelectedRoomId('');
    }
  }, [selectedCinemaId, cinemas]);

  const handleOpenAddModal = () => {
    setEditingShowtime(null);
    setSelectedMovieId(movies.length > 0 ? movies[0].id : '');
    const firstCinema = cinemas[0];
    if (firstCinema) {
      setSelectedCinemaId(firstCinema.id);
      if (firstCinema.rooms && firstCinema.rooms.length > 0) {
        setAvailableRooms(firstCinema.rooms);
        setSelectedRoomId(firstCinema.rooms[0].id);
      }
    }
    // Default to today at next round hour
    const now = new Date();
    now.setHours(now.getHours() + 2, 0, 0, 0);
    const localIso = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
    setStartTime(localIso);
    setBasePrice(80000);
    setStatus('SCHEDULED');
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (st: Showtime) => {
    setEditingShowtime(st);
    setSelectedMovieId(st.movie.id);
    setSelectedCinemaId(st.cinema.id);
    const cinema = cinemas.find((c) => c.id === st.cinema.id);
    if (cinema?.rooms) {
      setAvailableRooms(cinema.rooms);
    }
    setSelectedRoomId(st.room.id);

    const d = new Date(st.startTime);
    const localIso = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
    setStartTime(localIso);
    setBasePrice(st.basePrice);
    setStatus(st.status);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSaveShowtime = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSaving(true);

    const payload = {
      movieId: selectedMovieId,
      roomId: selectedRoomId,
      startTime: startTime + ':00',
      basePrice: Number(basePrice),
      status,
    };

    try {
      if (editingShowtime) {
        await adminApi.updateShowtime(editingShowtime.id, payload);
      } else {
        await adminApi.createShowtime(payload);
      }
      setIsModalOpen(false);
      fetchShowtimes(selectedCinemaFilter, search, currentPage);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Không thể lưu suất chiếu.';
      setFormError(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteShowtime = async (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn hủy suất chiếu này?')) {
      try {
        await adminApi.deleteShowtime(id);
        fetchShowtimes(selectedCinemaFilter, search, currentPage);
      } catch (err) {
        console.error('Error deleting showtime:', err);
      }
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn text-slate-800">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <CalendarDays className="w-7 h-7 text-emerald-600" />
            QUẢN LÝ SUẤT CHIẾU
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Lập lịch chiếu phim theo phòng, thiết lập giá vé cơ sở và hệ thống tự động kiểm tra chống trùng giờ.
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="py-3 px-5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 flex items-center gap-2 transition self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Tạo Suất Chiếu Mới</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            placeholder="Tìm theo tên phim, phòng chiếu..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-2 pl-4 pr-10 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
          />
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-2.5" />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          <span className="text-xs font-bold text-slate-500 px-1 shrink-0">Rạp:</span>
          <button
            onClick={() => handleCinemaFilterChange('ALL')}
            className={`py-1.5 px-3.5 rounded-xl text-xs font-bold transition shrink-0 ${
              selectedCinemaFilter === 'ALL'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
            }`}
          >
            Tất Cả
          </button>
          {cinemas.map((c) => (
            <button
              key={c.id}
              onClick={() => handleCinemaFilterChange(c.id)}
              className={`py-1.5 px-3.5 rounded-xl text-xs font-bold transition shrink-0 ${
                selectedCinemaFilter === c.id
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* Showtimes Table */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-100 text-slate-600 uppercase tracking-wider text-[11px] font-bold border-b border-slate-200">
              <tr>
                <th className="py-4 px-5">Phim</th>
                <th className="py-4 px-4">Rạp & Phòng Chiếu</th>
                <th className="py-4 px-4">Giờ Chiếu</th>
                <th className="py-4 px-4">Giá Vé Cơ Sở</th>
                <th className="py-4 px-4">Ghế Trống</th>
                <th className="py-4 px-4">Trạng Thái</th>
                <th className="py-4 px-5 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Đang tải danh sách lịch chiếu...
                  </td>
                </tr>
              ) : showtimes.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Chưa có suất chiếu nào. Nhấn "Tạo Suất Chiếu Mới" để lên lịch.
                  </td>
                </tr>
              ) : (
                showtimes.map((st) => {
                  const startDate = new Date(st.startTime);
                  const formattedDateTime = startDate.toLocaleString('vi-VN', {
                    hour: '2-digit',
                    minute: '2-digit',
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                  });

                  return (
                    <tr key={st.id} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-5">
                        <div className="flex items-center gap-3">
                          <img
                            src={st.movie?.posterUrl}
                            alt={st.movie?.title}
                            className="w-10 h-14 object-cover rounded-lg border border-slate-200 shrink-0 shadow-sm"
                          />
                          <div>
                            <p className="font-bold text-slate-900 text-sm">{st.movie?.title}</p>
                            <p className="text-[11px] text-slate-500 font-medium">{st.movie?.durationMinutes} phút</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-bold text-slate-800">{st.cinema?.name}</p>
                        <p className="text-emerald-600 font-bold text-[11px]">
                          {st.room?.name} ({st.room?.roomType})
                        </p>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-900 block">{formattedDateTime}</span>
                      </td>
                      <td className="py-3 px-4 font-black text-amber-600">
                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(
                          st.basePrice
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-emerald-600">
                          {st.availableSeatsCount} / {st.totalSeatsCount} ghế
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            st.status === 'SCHEDULED'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : st.status === 'COMPLETED'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {st.status}
                        </span>
                      </td>
                      <td className="py-3 px-5 text-right space-x-2">
                        <button
                          onClick={() => handleOpenEditModal(st)}
                          className="p-2 rounded-xl bg-slate-100 hover:bg-amber-500 hover:text-white text-slate-600 transition shadow-sm border border-slate-200"
                          title="Sửa suất chiếu"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteShowtime(st.id)}
                          className="p-2 rounded-xl bg-slate-100 hover:bg-rose-500 hover:text-white text-slate-600 transition shadow-sm border border-slate-200"
                          title="Hủy suất chiếu"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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
            Hiển thị <span className="font-bold text-slate-800">{showtimes.length}</span> /{' '}
            <span className="font-bold text-slate-800">{totalElements}</span> suất chiếu
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

      {/* Add / Edit Showtime Modal with Conflict Detection */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="relative w-full max-w-lg bg-white border border-slate-200 rounded-3xl shadow-2xl p-6 sm:p-8 text-slate-800">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-black text-slate-900 mb-1">
              {editingShowtime ? 'SỬA SUẤT CHIẾU' : 'TẠO SUẤT CHIẾU MỚI'}
            </h3>
            <p className="text-xs text-slate-500 mb-5">
              Hệ thống tự động kiểm tra trùng giờ phòng chiếu kèm thời gian dọn phòng 15 phút.
            </p>

            {formError && (
              <div className="mb-4 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2.5">
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-bold">CẢNH BÁO TRÙNG LỊCH:</strong>
                  <span>{formError}</span>
                </div>
              </div>
            )}

            <form onSubmit={handleSaveShowtime} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Chọn Phim Chiếu *</label>
                <select
                  required
                  value={selectedMovieId}
                  onChange={(e) => setSelectedMovieId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-slate-800 focus:outline-none focus:border-emerald-500 font-medium"
                >
                  {movies.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.title} ({m.durationMinutes} phút - {m.ageRating})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Cụm Rạp *</label>
                  <select
                    required
                    value={selectedCinemaId}
                    onChange={(e) => setSelectedCinemaId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-slate-800 focus:outline-none focus:border-emerald-500 font-medium"
                  >
                    {cinemas.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Phòng Chiếu *</label>
                  <select
                    required
                    value={selectedRoomId}
                    onChange={(e) => setSelectedRoomId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-slate-800 focus:outline-none focus:border-emerald-500 font-medium"
                  >
                    {availableRooms.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name} ({r.roomType})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Thời Gian Bắt Đầu *</label>
                <input
                  type="datetime-local"
                  required
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-slate-800 focus:outline-none focus:border-emerald-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Giá Vé Cơ Sở (VNĐ) *</label>
                  <input
                    type="number"
                    required
                    step={5000}
                    min={10000}
                    value={basePrice}
                    onChange={(e) => setBasePrice(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-slate-800 focus:outline-none focus:border-emerald-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Trạng Thái *</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as ShowtimeStatus)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-slate-800 focus:outline-none focus:border-emerald-500 font-medium"
                  >
                    <option value="SCHEDULED">Đã Lên Lịch (SCHEDULED)</option>
                    <option value="ONGOING">Đang Chiếu (ONGOING)</option>
                    <option value="COMPLETED">Đã Xong (COMPLETED)</option>
                    <option value="CANCELLED">Đã Hủy (CANCELLED)</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="py-2.5 px-5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold border border-slate-200"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="py-2.5 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-bold text-white shadow-lg shadow-emerald-600/30 transition disabled:opacity-50"
                >
                  {saving ? 'Đang kiểm tra...' : 'LƯU SUẤT CHIẾU'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
