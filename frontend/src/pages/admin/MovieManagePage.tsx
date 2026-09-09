import React, { useState, useEffect, useRef } from 'react';
import { Film, Plus, Edit2, Trash2, Search, X, Check, Eye, ChevronLeft, ChevronRight, Upload, ImageIcon, ArrowUpDown, ArrowUp, ArrowDown, Filter } from 'lucide-react';
import { Movie, MovieStatus, AgeRating } from '../../types';
import { adminApi, movieApi, uploadApi } from '../../api';
import { ConfirmModal } from '../../components/common/ConfirmModal';
import { AdminDropdown } from '../../components/common/AdminDropdown';

const STATUS_FILTERS: { id: string; label: string }[] = [
  { id: 'ALL', label: 'Tất Cả' },
  { id: 'COMING_SOON', label: 'Sắp Chiếu' },
  { id: 'NOW_SHOWING', label: 'Đang Chiếu' },
  { id: 'ENDED', label: 'Ngừng Chiếu' },
];

const SORT_OPTIONS = [
  { label: 'Mới nhất', sortBy: 'createdAt', direction: 'desc' },
  { label: 'Cũ nhất', sortBy: 'createdAt', direction: 'asc' },
  { label: 'Tên (A-Z)', sortBy: 'title', direction: 'asc' },
  { label: 'Tên (Z-A)', sortBy: 'title', direction: 'desc' },
  { label: 'Thời lượng tăng dần', sortBy: 'durationMinutes', direction: 'asc' },
  { label: 'Thời lượng giảm dần', sortBy: 'durationMinutes', direction: 'desc' },
  { label: 'Khởi chiếu gần nhất', sortBy: 'releaseDate', direction: 'desc' },
  { label: 'Khởi chiếu xa nhất', sortBy: 'releaseDate', direction: 'asc' },
];

export const MovieManagePage: React.FC = () => {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const ITEMS_PER_PAGE = 10;

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMovie, setEditingMovie] = useState<Movie | null>(null);

  // Delete Confirm Modal State
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    movieId?: string;
    movieTitle?: string;
    isLoading?: boolean;
    errorMessage?: string | null;
  }>({ isOpen: false });

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(120);
  const [genre, setGenre] = useState('');
  const [director, setDirector] = useState('');
  const [castMembers, setCastMembers] = useState('');
  const [posterUrl, setPosterUrl] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');
  const [trailerUrl, setTrailerUrl] = useState('');
  const [ageRating, setAgeRating] = useState<AgeRating>('P');
  const [releaseDate, setReleaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState('');
  const [status, setStatus] = useState<MovieStatus>('COMING_SOON');
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingPoster, setUploadingPoster] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const posterFileInputRef = useRef<HTMLInputElement>(null);
  const bannerFileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadPoster = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPoster(true);
    setFormError(null);
    try {
      const res = await uploadApi.uploadImage(file);
      setPosterUrl(res.data.url);
    } catch (err: any) {
      const msg =
        err.response?.status === 413
          ? 'File ảnh quá lớn (vượt quá dung lượng 25MB cho phép).'
          : err.response?.data?.message || err.message || 'Không thể upload poster lên MinIO.';
      setFormError(msg);
    } finally {
      setUploadingPoster(false);
      if (posterFileInputRef.current) {
        posterFileInputRef.current.value = '';
      }
    }
  };

  const handleUploadBanner = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingBanner(true);
    setFormError(null);
    try {
      const res = await uploadApi.uploadImage(file);
      setBannerUrl(res.data.url);
    } catch (err: any) {
      const msg =
        err.response?.status === 413
          ? 'File ảnh quá lớn (vượt quá dung lượng 25MB cho phép).'
          : err.response?.data?.message || err.message || 'Không thể upload banner lên MinIO.';
      setFormError(msg);
    } finally {
      setUploadingBanner(false);
      if (bannerFileInputRef.current) {
        bannerFileInputRef.current.value = '';
      }
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchMovies(currentPage, statusFilter, search, sortBy, sortDir);
    }, 250);
    return () => clearTimeout(timer);
  }, [currentPage, statusFilter, search, sortBy, sortDir]);

  const fetchMovies = async (
    page: number = currentPage,
    status: string = statusFilter,
    query: string = search,
    sort: string = sortBy,
    dir: 'asc' | 'desc' = sortDir
  ) => {
    setLoading(true);
    try {
      const res = await movieApi.getAll(
        status === 'ALL' ? undefined : status,
        query.trim() ? query.trim() : undefined,
        page - 1,
        ITEMS_PER_PAGE,
        sort,
        dir
      );
      setMovies(res.data.content || []);
      setTotalPages(res.data.totalPages || 1);
      setTotalElements(res.data.totalElements || 0);
    } catch (err) {
      console.error('Error fetching movies:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortDir('asc');
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

  const handleOpenAddModal = () => {
    setEditingMovie(null);
    setTitle('');
    setDescription('');
    setDurationMinutes(120);
    setGenre('Hành Động, Viễn Tưởng');
    setDirector('');
    setCastMembers('');
    setPosterUrl('');
    setBannerUrl('');
    setTrailerUrl('');
    setAgeRating('P');
    setReleaseDate(new Date().toISOString().split('T')[0]);
    setEndDate('');
    setStatus('COMING_SOON');
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (m: Movie) => {
    setEditingMovie(m);
    setTitle(m.title);
    setDescription(m.description);
    setDurationMinutes(m.durationMinutes);
    setGenre(m.genre);
    setDirector(m.director || '');
    setCastMembers(m.castMembers || '');
    setPosterUrl(m.posterUrl);
    setBannerUrl(m.bannerUrl || '');
    setTrailerUrl(m.trailerUrl || '');
    setAgeRating(m.ageRating);
    setReleaseDate(m.releaseDate);
    setEndDate(m.endDate || '');
    setStatus(m.status);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSaveMovie = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!posterUrl) {
      setFormError('Vui lòng tải lên ảnh Poster cho phim.');
      return;
    }

    setSaving(true);

    const payload = {
      title,
      description,
      durationMinutes: Number(durationMinutes),
      genre,
      director,
      castMembers,
      posterUrl,
      bannerUrl: bannerUrl || posterUrl,
      trailerUrl,
      ageRating,
      releaseDate,
      endDate: endDate || undefined,
      status,
    };

    try {
      if (editingMovie) {
        await adminApi.updateMovie(editingMovie.id, payload);
      } else {
        await adminApi.createMovie(payload);
      }
      setIsModalOpen(false);
      fetchMovies(currentPage, statusFilter, search);
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Không thể lưu phim.');
    } finally {
      setSaving(false);
    }
  };

  const promptDeleteMovie = (id: string, movieTitle: string) => {
    setDeleteModal({
      isOpen: true,
      movieId: id,
      movieTitle,
      isLoading: false,
      errorMessage: null,
    });
  };

  const handleConfirmDeleteMovie = async () => {
    if (!deleteModal.movieId) return;
    setDeleteModal((prev) => ({ ...prev, isLoading: true, errorMessage: null }));
    try {
      await adminApi.deleteMovie(deleteModal.movieId);
      setDeleteModal({ isOpen: false });
      fetchMovies(currentPage, statusFilter, search);
    } catch (err: any) {
      setDeleteModal((prev) => ({
        ...prev,
        isLoading: false,
        errorMessage: err.response?.data?.message || 'Không thể xóa phim. Phim có thể đang có suất chiếu hoặc dữ liệu vé liên quan.',
      }));
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn text-slate-800">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Film className="w-7 h-7 text-emerald-600" />
            QUẢN LÝ PHIM CHIẾU
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Thêm phim mới, cập nhật thông tin độ tuổi, thời lượng, poster và lịch khởi chiếu.
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="py-3 px-5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 flex items-center gap-2 transition self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm Phim Mới</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            placeholder="Tìm theo tên phim, thể loại..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-2 pl-4 pr-10 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
          />
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-2.5" />
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <AdminDropdown
            label="Trạng thái"
            icon={<Filter className="w-3.5 h-3.5 text-emerald-600" />}
            value={statusFilter}
            onChange={(val) => {
              setStatusFilter(val);
              setCurrentPage(1);
            }}
            options={STATUS_FILTERS.map((st) => ({ value: st.id, label: st.label }))}
          />

          <AdminDropdown
            label="Sắp xếp"
            icon={<ArrowUpDown className="w-3.5 h-3.5 text-emerald-600" />}
            value={`${sortBy}-${sortDir}`}
            onChange={(val) => {
              const [field, dir] = val.split('-');
              setSortBy(field);
              setSortDir(dir as 'asc' | 'desc');
              setCurrentPage(1);
            }}
            options={SORT_OPTIONS.map((opt) => ({ value: `${opt.sortBy}-${opt.direction}`, label: opt.label }))}
          />
        </div>
      </div>

      {/* Movies Table */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-100 text-slate-600 uppercase tracking-wider text-[11px] font-bold border-b border-slate-200 select-none">
              <tr>
                <th className="py-4 px-5">
                  <button
                    onClick={() => handleSort('title')}
                    className="group flex items-center gap-1.5 hover:text-emerald-600 transition font-bold"
                  >
                    <span>Phim</span>
                    {renderSortIcon('title')}
                  </button>
                </th>
                <th className="py-4 px-4">Độ Tuổi</th>
                <th className="py-4 px-4">
                  <button
                    onClick={() => handleSort('durationMinutes')}
                    className="group flex items-center gap-1.5 hover:text-emerald-600 transition font-bold"
                  >
                    <span>Thời Lượng</span>
                    {renderSortIcon('durationMinutes')}
                  </button>
                </th>
                <th className="py-4 px-4">Trạng Thái</th>
                <th className="py-4 px-4">
                  <button
                    onClick={() => handleSort('releaseDate')}
                    className="group flex items-center gap-1.5 hover:text-emerald-600 transition font-bold"
                  >
                    <span>Khởi Chiếu</span>
                    {renderSortIcon('releaseDate')}
                  </button>
                </th>
                <th className="py-4 px-5 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    Đang tải danh sách phim...
                  </td>
                </tr>
              ) : movies.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    Không tìm thấy phim nào.
                  </td>
                </tr>
              ) : (
                movies.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-5">
                      <div className="flex items-center gap-3">
                        <img
                          src={m.posterUrl}
                          alt={m.title}
                          className="w-10 h-14 object-cover rounded-lg border border-slate-200 shrink-0 shadow-sm"
                        />
                        <div>
                          <p className="font-bold text-slate-900 text-sm">{m.title}</p>
                          <p className="text-[11px] text-emerald-600 font-semibold">{m.genre}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-600 text-white">
                        {m.ageRating}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-800">
                      {m.durationMinutes} phút
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-1 rounded-lg text-[11px] font-bold ${
                          m.status === 'NOW_SHOWING'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-blue-50 text-blue-700 border border-blue-200'
                        }`}
                      >
                        {m.status === 'NOW_SHOWING' ? 'Đang Chiếu' : 'Sắp Chiếu'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500 font-medium">{m.releaseDate}</td>
                    <td className="py-3 px-5 text-right space-x-2">
                      <button
                        onClick={() => handleOpenEditModal(m)}
                        className="p-2 rounded-xl bg-slate-100 hover:bg-amber-500 hover:text-white text-slate-600 transition shadow-sm border border-slate-200"
                        title="Sửa phim"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => promptDeleteMovie(m.id, m.title)}
                        className="p-2 rounded-xl bg-slate-100 hover:bg-rose-500 hover:text-white text-slate-600 transition shadow-sm border border-slate-200"
                        title="Xóa phim"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="py-3 px-6 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <p>
            Hiển thị <span className="font-bold text-slate-800">{movies.length}</span> /{' '}
            <span className="font-bold text-slate-800">{totalElements}</span> phim
          </p>

          {totalPages > 1 && (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white transition shadow-sm"
                title="Trang trước"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
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
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
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

      {/* Add / Edit Movie Modal */}
      {isModalOpen && (
        <div
          onClick={() => setIsModalOpen(false)}
          className="fixed inset-0 !m-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-2xl bg-white border border-slate-200 rounded-3xl shadow-2xl p-6 sm:p-8 text-slate-800 max-h-[90vh] overflow-y-auto"
          >
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-black text-slate-900 mb-6">
              {editingMovie ? 'CẬP NHẬT PHIM CHIẾU' : 'THÊM PHIM MỚI'}
            </h3>

            {formError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-600">
                {formError}
              </div>
            )}

            <form onSubmit={handleSaveMovie} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Tên Phim *</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-slate-800 focus:outline-none focus:border-emerald-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Thể Loại *</label>
                  <input
                    type="text"
                    required
                    placeholder="Hành Động, Phiêu Lưu..."
                    value={genre}
                    onChange={(e) => setGenre(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-slate-800 focus:outline-none focus:border-emerald-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Thời Lượng (Phút) *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-slate-800 focus:outline-none focus:border-emerald-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Độ Tuổi Quy Định *</label>
                  <select
                    value={ageRating}
                    onChange={(e) => setAgeRating(e.target.value as AgeRating)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-slate-800 focus:outline-none focus:border-emerald-500 font-medium"
                  >
                    <option value="P">P - Phổ biến mọi lứa tuổi</option>
                    <option value="K">K - Dưới 13 tuổi xem cùng phụ huynh</option>
                    <option value="T13">T13 - Khán giả từ 13 tuổi</option>
                    <option value="T16">T16 - Khán giả từ 16 tuổi</option>
                    <option value="T18">T18 - Khán giả từ 18 tuổi</option>
                    <option value="C">C - Cấm phổ biến</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Trạng Thái *</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as MovieStatus)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-slate-800 focus:outline-none focus:border-emerald-500 font-medium cursor-pointer"
                  >
                    <option value="COMING_SOON">Sắp Chiếu (Coming Soon)</option>
                    <option value="NOW_SHOWING">Đang Chiếu (Now Showing)</option>
                    <option value="ENDED">Ngừng Chiếu (Ended)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Ngày Khởi Chiếu *</label>
                  <input
                    type="date"
                    required
                    value={releaseDate}
                    onChange={(e) => setReleaseDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-slate-800 focus:outline-none focus:border-emerald-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Ngày Kết Thúc (Tùy chọn)</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-slate-800 focus:outline-none focus:border-emerald-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Đạo Diễn</label>
                  <input
                    type="text"
                    value={director}
                    onChange={(e) => setDirector(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-slate-800 focus:outline-none focus:border-emerald-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Diễn Viên</label>
                  <input
                    type="text"
                    value={castMembers}
                    onChange={(e) => setCastMembers(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-slate-800 focus:outline-none focus:border-emerald-500 font-medium"
                  />
                </div>

                {/* Media Upload Section: Poster & Banner */}
                <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  {/* Poster Upload (Ảnh dọc) */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="block font-bold text-slate-700 text-xs">
                        Poster Phim (Ảnh dọc) *
                      </label>
                      {posterUrl && (
                        <button
                          type="button"
                          disabled={uploadingPoster}
                          onClick={() => posterFileInputRef.current?.click()}
                          className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700 transition cursor-pointer"
                        >
                          Đổi poster
                        </button>
                      )}
                    </div>

                    <input
                      type="file"
                      ref={posterFileInputRef}
                      onChange={handleUploadPoster}
                      accept="image/*"
                      className="hidden"
                    />

                    {posterUrl ? (
                      <div className="relative group rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 h-52 flex items-center justify-center shadow-xs">
                        <img
                          src={posterUrl}
                          alt="Poster preview"
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src =
                              'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400';
                          }}
                        />
                        <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <button
                            type="button"
                            disabled={uploadingPoster}
                            onClick={() => posterFileInputRef.current?.click()}
                            className="px-3.5 py-2 rounded-xl bg-white text-slate-800 text-xs font-bold shadow-md hover:bg-slate-100 flex items-center gap-1.5 transition"
                          >
                            <Upload className="w-3.5 h-3.5 text-emerald-600" />
                            <span>{uploadingPoster ? 'Đang tải...' : 'Tải ảnh khác từ máy (MinIO)'}</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        disabled={uploadingPoster}
                        onClick={() => posterFileInputRef.current?.click()}
                        className="w-full h-52 border-2 border-dashed border-slate-200 hover:border-emerald-500 rounded-2xl flex flex-col items-center justify-center gap-2 text-slate-500 hover:text-emerald-700 bg-slate-50 hover:bg-emerald-50/20 transition cursor-pointer disabled:opacity-50"
                      >
                        <div className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center shadow-xs text-emerald-600">
                          <Upload className={`w-5 h-5 ${uploadingPoster ? 'animate-bounce' : ''}`} />
                        </div>
                        <div className="text-center px-4">
                          <p className="font-bold text-xs">
                            {uploadingPoster ? 'Đang tải lên MinIO...' : 'Tải Poster Phim (MinIO)'}
                          </p>
                          <p className="text-[10px] text-slate-400 mt-0.5">Khuyên dùng tỷ lệ 2:3 hoặc 3:4 (ảnh dọc)</p>
                        </div>
                      </button>
                    )}
                  </div>

                  {/* Banner Upload (Ảnh ngang) */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="block font-bold text-slate-700 text-xs">
                        Banner Phim (Ảnh ngang)
                      </label>
                      {bannerUrl && (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            disabled={uploadingBanner}
                            onClick={() => bannerFileInputRef.current?.click()}
                            className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700 transition cursor-pointer"
                          >
                            Đổi banner
                          </button>
                          <button
                            type="button"
                            onClick={() => setBannerUrl('')}
                            className="text-[11px] font-bold text-rose-500 hover:text-rose-600 transition cursor-pointer"
                          >
                            Xóa
                          </button>
                        </div>
                      )}
                    </div>

                    <input
                      type="file"
                      ref={bannerFileInputRef}
                      onChange={handleUploadBanner}
                      accept="image/*"
                      className="hidden"
                    />

                    {bannerUrl ? (
                      <div className="relative group rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 h-52 flex items-center justify-center shadow-xs">
                        <img
                          src={bannerUrl}
                          alt="Banner preview"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src =
                              'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=1200';
                          }}
                        />
                        <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <button
                            type="button"
                            disabled={uploadingBanner}
                            onClick={() => bannerFileInputRef.current?.click()}
                            className="px-3.5 py-2 rounded-xl bg-white text-slate-800 text-xs font-bold shadow-md hover:bg-slate-100 flex items-center gap-1.5 transition"
                          >
                            <Upload className="w-3.5 h-3.5 text-emerald-600" />
                            <span>{uploadingBanner ? 'Đang tải...' : 'Tải ảnh khác từ máy (MinIO)'}</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        disabled={uploadingBanner}
                        onClick={() => bannerFileInputRef.current?.click()}
                        className="w-full h-52 border-2 border-dashed border-slate-200 hover:border-emerald-500 rounded-2xl flex flex-col items-center justify-center gap-2 text-slate-500 hover:text-emerald-700 bg-slate-50 hover:bg-emerald-50/20 transition cursor-pointer disabled:opacity-50"
                      >
                        <div className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center shadow-xs text-emerald-600">
                          <ImageIcon className={`w-5 h-5 ${uploadingBanner ? 'animate-bounce' : ''}`} />
                        </div>
                        <div className="text-center px-4">
                          <p className="font-bold text-xs">
                            {uploadingBanner ? 'Đang tải lên MinIO...' : 'Tải Banner Phim (MinIO)'}
                          </p>
                          <p className="text-[10px] text-slate-400 mt-0.5">Khuyên dùng tỷ lệ 16:9 (làm ảnh nền hero)</p>
                        </div>
                      </button>
                    )}
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Trailer URL (YouTube)</label>
                  <input
                    type="url"
                    value={trailerUrl}
                    onChange={(e) => setTrailerUrl(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-slate-800 focus:outline-none focus:border-emerald-500 font-medium"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Tóm Tắt Nội Dung Phim</label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-slate-800 focus:outline-none focus:border-emerald-500 font-medium"
                  />
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
                  className="py-2.5 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-lg shadow-emerald-600/30 transition disabled:opacity-50"
                >
                  {saving ? 'Đang lưu...' : 'LƯU PHIM'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Movie Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => !deleteModal.isLoading && setDeleteModal({ isOpen: false })}
        onConfirm={handleConfirmDeleteMovie}
        title="Xác Nhận Xóa Phim"
        message={
          <>
            Bạn có chắc chắn muốn xóa phim <strong className="text-slate-900 font-bold">"{deleteModal.movieTitle}"</strong> không?
          </>
        }
        subMessage="Lưu ý: Thao tác này sẽ xóa phim vĩnh viễn khỏi hệ thống và không thể hoàn tác."
        confirmText="Xác Nhận Xóa"
        cancelText="Hủy Bỏ"
        type="danger"
        isLoading={deleteModal.isLoading}
        errorMessage={deleteModal.errorMessage}
      />
    </div>
  );
};
