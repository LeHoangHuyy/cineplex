import React, { useState, useEffect, useMemo } from 'react';
import { 
  CalendarDays, Plus, Edit2, Trash2, MapPin, Film, Clock, AlertTriangle, 
  X, Check, ChevronLeft, ChevronRight, Search, Calendar, ListFilter, 
  Sparkles, CheckCircle2, AlertCircle, RefreshCw, Eye, ArrowRight, 
  ShieldCheck, Play, Info, Grid, SlidersHorizontal
} from 'lucide-react';
import { Showtime, Movie, Cinema, Room, ShowtimeStatus, RoomType } from '../../types';
import { adminApi, cinemaApi, movieApi, showtimeApi } from '../../api';
import { ConfirmModal } from '../../components/common/ConfirmModal';

// Timeline Configuration: 08:00 AM to 01:00 AM next day (17 operating hours)
const TIMELINE_START_HOUR = 8;
const TIMELINE_END_HOUR = 25; // 25 = 01:00 AM next day
const TOTAL_HOURS = TIMELINE_END_HOUR - TIMELINE_START_HOUR; // 17 hours
const TOTAL_MINUTES = TOTAL_HOURS * 60; // 1020 minutes
const CLEANING_BUFFER_MINUTES = 15;

// Vibrant, distinctive color schemes for movies on the timeline
const MOVIE_COLOR_PALETTES = [
  {
    bg: 'bg-emerald-500/10 hover:bg-emerald-500/20',
    border: 'border-emerald-500/50 hover:border-emerald-600',
    headerBg: 'bg-emerald-600 text-white',
    accentText: 'text-emerald-900',
    badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    bufferBg: 'bg-amber-100 text-amber-900 border-amber-300',
    dot: 'bg-emerald-500',
  },
  {
    bg: 'bg-blue-500/10 hover:bg-blue-500/20',
    border: 'border-blue-500/50 hover:border-blue-600',
    headerBg: 'bg-blue-600 text-white',
    accentText: 'text-blue-900',
    badgeBg: 'bg-blue-100 text-blue-800 border-blue-300',
    bufferBg: 'bg-amber-100 text-amber-900 border-amber-300',
    dot: 'bg-blue-500',
  },
  {
    bg: 'bg-violet-500/10 hover:bg-violet-500/20',
    border: 'border-violet-500/50 hover:border-violet-600',
    headerBg: 'bg-violet-600 text-white',
    accentText: 'text-violet-900',
    badgeBg: 'bg-violet-100 text-violet-800 border-violet-300',
    bufferBg: 'bg-amber-100 text-amber-900 border-amber-300',
    dot: 'bg-violet-500',
  },
  {
    bg: 'bg-rose-500/10 hover:bg-rose-500/20',
    border: 'border-rose-500/50 hover:border-rose-600',
    headerBg: 'bg-rose-600 text-white',
    accentText: 'text-rose-900',
    badgeBg: 'bg-rose-100 text-rose-800 border-rose-300',
    bufferBg: 'bg-amber-100 text-amber-900 border-amber-300',
    dot: 'bg-rose-500',
  },
  {
    bg: 'bg-amber-500/10 hover:bg-amber-500/20',
    border: 'border-amber-500/50 hover:border-amber-600',
    headerBg: 'bg-amber-600 text-white',
    accentText: 'text-amber-900',
    badgeBg: 'bg-amber-100 text-amber-800 border-amber-300',
    bufferBg: 'bg-amber-200 text-amber-900 border-amber-400',
    dot: 'bg-amber-500',
  },
  {
    bg: 'bg-cyan-500/10 hover:bg-cyan-500/20',
    border: 'border-cyan-500/50 hover:border-cyan-600',
    headerBg: 'bg-cyan-600 text-white',
    accentText: 'text-cyan-900',
    badgeBg: 'bg-cyan-100 text-cyan-800 border-cyan-300',
    bufferBg: 'bg-amber-100 text-amber-900 border-amber-300',
    dot: 'bg-cyan-500',
  },
];

// Helper: Stable color scheme per movie
const getMoviePalette = (movieId: string = '') => {
  if (!movieId) return MOVIE_COLOR_PALETTES[0];
  let hash = 0;
  for (let i = 0; i < movieId.length; i++) {
    hash = (hash << 5) - hash + movieId.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % MOVIE_COLOR_PALETTES.length;
  return MOVIE_COLOR_PALETTES[index];
};

// Date helper: YYYY-MM-DD
const getTodayDateString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getTomorrowDateString = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const shiftDate = (dateStr: string, deltaDays: number) => {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + deltaDays);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatDateVi = (dateStr: string) => {
  try {
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
    return `${days[date.getDay()]}, ${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`;
  } catch {
    return dateStr;
  }
};

const formatTimeVi = (dateInput: string | Date) => {
  const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(d.getTime())) return '--:--';
  return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false });
};

export const ShowtimeManagePage: React.FC = () => {
  // Global View Mode
  const [viewMode, setViewMode] = useState<'DAY_VIEW' | 'TABLE_VIEW'>('DAY_VIEW');

  // Shared Master Data
  const [movies, setMovies] = useState<Movie[]>([]);
  const [cinemas, setCinemas] = useState<Cinema[]>([]);

  // ----------------------------------------------------
  // DAY VIEW STATE
  // ----------------------------------------------------
  const [selectedDayCinemaId, setSelectedDayCinemaId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(getTodayDateString());
  const [dayShowtimes, setDayShowtimes] = useState<Showtime[]>([]);
  const [dayLoading, setDayLoading] = useState<boolean>(true);

  // ----------------------------------------------------
  // TABLE VIEW STATE
  // ----------------------------------------------------
  const [showtimes, setShowtimes] = useState<Showtime[]>([]);
  const [selectedCinemaFilter, setSelectedCinemaFilter] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const ITEMS_PER_PAGE = 10;

  // ----------------------------------------------------
  // MODAL FORM STATE
  // ----------------------------------------------------
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingShowtime, setEditingShowtime] = useState<Showtime | null>(null);

  const [selectedMovieId, setSelectedMovieId] = useState<string>('');
  const [selectedCinemaId, setSelectedCinemaId] = useState<string>('');
  const [selectedRoomId, setSelectedRoomId] = useState<string>('');
  const [availableRooms, setAvailableRooms] = useState<Room[]>([]);
  const [startTime, setStartTime] = useState<string>('');
  const [basePrice, setBasePrice] = useState<number>(80000);
  const [status, setStatus] = useState<ShowtimeStatus>('SCHEDULED');

  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Quick detail preview
  const [activeHoverShowtime, setActiveHoverShowtime] = useState<Showtime | null>(null);

  // Delete Confirm Modal State
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    showtime?: Showtime;
    isLoading?: boolean;
    errorMessage?: string | null;
  }>({ isOpen: false });

  // ----------------------------------------------------
  // INITIAL DATA LOAD
  // ----------------------------------------------------
  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [moviesRes, cinemasRes] = await Promise.all([
        movieApi.getAll(undefined, undefined, 0, 100),
        cinemaApi.getAll(),
      ]);
      const movieList = moviesRes.data.content || (moviesRes.data as any) || [];
      const cinemaList = cinemasRes.data || [];
      setMovies(movieList);
      setCinemas(cinemaList);

      if (cinemaList.length > 0) {
        setSelectedDayCinemaId(cinemaList[0].id);
      }
    } catch (err) {
      console.error('Error fetching initial showtime data:', err);
    }
  };

  // ----------------------------------------------------
  // FETCH DAY SHOWTIMES (DAY VIEW)
  // ----------------------------------------------------
  useEffect(() => {
    if (selectedDayCinemaId && selectedDate) {
      fetchDayShowtimes(selectedDayCinemaId, selectedDate);
    }
  }, [selectedDayCinemaId, selectedDate]);

  const fetchDayShowtimes = async (cinemaId: string, dateStr: string) => {
    setDayLoading(true);
    try {
      const res = await showtimeApi.getByCinema(cinemaId, dateStr);
      setDayShowtimes(res.data || []);
    } catch (err) {
      console.error('Error fetching day showtimes:', err);
      setDayShowtimes([]);
    } finally {
      setDayLoading(false);
    }
  };

  // ----------------------------------------------------
  // FETCH PAGINATED SHOWTIMES (TABLE VIEW)
  // ----------------------------------------------------
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchShowtimes(selectedCinemaFilter, search, currentPage);
    }, 250);
    return () => clearTimeout(timer);
  }, [currentPage, selectedCinemaFilter, search]);

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

  // ----------------------------------------------------
  // FORM & MODAL HANDLERS
  // ----------------------------------------------------
  useEffect(() => {
    if (!selectedCinemaId) {
      setAvailableRooms([]);
      setSelectedRoomId('');
      return;
    }
    const cinema = cinemas.find((c) => c.id === selectedCinemaId);
    if (cinema?.rooms && cinema.rooms.length > 0) {
      setAvailableRooms(cinema.rooms);
      if (!cinema.rooms.some((r) => r.id === selectedRoomId)) {
        setSelectedRoomId(cinema.rooms[0].id);
      }
    } else {
      setAvailableRooms([]);
      setSelectedRoomId('');
    }
  }, [selectedCinemaId, cinemas]);

  // Open Add Modal from Top Button
  const handleOpenAddModal = () => {
    setEditingShowtime(null);
    setSelectedMovieId(movies.length > 0 ? movies[0].id : '');
    
    const targetCinemaId = selectedDayCinemaId || (cinemas.length > 0 ? cinemas[0].id : '');
    setSelectedCinemaId(targetCinemaId);
    
    const cinema = cinemas.find((c) => c.id === targetCinemaId);
    if (cinema?.rooms && cinema.rooms.length > 0) {
      setAvailableRooms(cinema.rooms);
      setSelectedRoomId(cinema.rooms[0].id);
    }

    // Default to selectedDate with rounded time
    const now = new Date();
    const defaultHours = String(Math.max(8, now.getHours() + 1)).padStart(2, '0');
    setStartTime(`${selectedDate}T${defaultHours}:00`);
    setBasePrice(80000);
    setStatus('SCHEDULED');
    setFormError(null);
    setIsModalOpen(true);
  };

  // Open Add Modal from Clicking Timeline Slot or Room Button
  const handleOpenAddModalForRoomAndTime = (roomId: string, timeIsoString: string) => {
    setEditingShowtime(null);
    setSelectedMovieId(movies.length > 0 ? movies[0].id : '');
    setSelectedCinemaId(selectedDayCinemaId);

    const cinema = cinemas.find((c) => c.id === selectedDayCinemaId);
    if (cinema?.rooms) {
      setAvailableRooms(cinema.rooms);
    }
    setSelectedRoomId(roomId);
    setStartTime(timeIsoString);
    setBasePrice(80000);
    setStatus('SCHEDULED');
    setFormError(null);
    setIsModalOpen(true);
  };

  // Open Edit Modal
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

  // Quick Action: "Lên suất tiếp theo" immediately after a showtime
  const handleScheduleNextSlot = (st: Showtime) => {
    setEditingShowtime(null);
    setSelectedMovieId(st.movie.id);
    setSelectedCinemaId(st.cinema.id);

    const cinema = cinemas.find((c) => c.id === st.cinema.id);
    if (cinema?.rooms) {
      setAvailableRooms(cinema.rooms);
    }
    setSelectedRoomId(st.room.id);

    // End time of this showtime is the exact safe starting time of the next showtime!
    const d = new Date(st.endTime);
    const localIso = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
    setStartTime(localIso);
    setBasePrice(st.basePrice);
    setStatus('SCHEDULED');
    setFormError(null);
    setIsModalOpen(true);
  };

  // ----------------------------------------------------
  // REAL-TIME CONFLICT DETECTOR (FRONTEND ENGINE)
  // ----------------------------------------------------
  const conflictAnalysis = useMemo(() => {
    if (!selectedRoomId || !selectedMovieId || !startTime) {
      return null;
    }

    const movie = movies.find((m) => m.id === selectedMovieId);
    if (!movie) return null;

    const proposedStartMs = new Date(startTime).getTime();
    if (isNaN(proposedStartMs)) return null;

    const movieDuration = movie.durationMinutes || 120;
    const movieEndMs = proposedStartMs + movieDuration * 60 * 1000;
    const totalEndMs = proposedStartMs + (movieDuration + CLEANING_BUFFER_MINUTES) * 60 * 1000;

    // Active showtimes in the selected room
    // Use dayShowtimes (if matching room) and showtimes from table view
    const allKnown = [...dayShowtimes, ...showtimes];
    const roomShowtimes = allKnown.filter(
      (st, idx, arr) =>
        arr.findIndex((x) => x.id === st.id) === idx &&
        st.room?.id === selectedRoomId &&
        st.status !== 'CANCELLED' &&
        (!editingShowtime || st.id !== editingShowtime.id)
    );

    for (const st of roomShowtimes) {
      const stStartMs = new Date(st.startTime).getTime();
      const stEndMs = new Date(st.endTime).getTime();

      // Overlap condition: proposedStart < existingEnd && proposedEnd > existingStart
      if (proposedStartMs < stEndMs && totalEndMs > stStartMs) {
        // Suggested next safe start time
        const suggestedDate = new Date(stEndMs);
        const suggestedIso = new Date(suggestedDate.getTime() - suggestedDate.getTimezoneOffset() * 60000)
          .toISOString()
          .slice(0, 16);

        return {
          hasConflict: true,
          conflictingMovieTitle: st.movie?.title || 'Phim khác',
          conflictingTimeRange: `${formatTimeVi(st.startTime)} - ${formatTimeVi(st.endTime)}`,
          proposedTimeRange: `${formatTimeVi(new Date(proposedStartMs))} - ${formatTimeVi(new Date(totalEndMs))}`,
          suggestedTime: suggestedIso,
          suggestedDisplay: formatTimeVi(suggestedDate),
          movieDuration,
        };
      }
    }

    return {
      hasConflict: false,
      movieDuration,
      movieEndTimeFormatted: formatTimeVi(new Date(movieEndMs)),
      expectedEndTimeFormatted: formatTimeVi(new Date(totalEndMs)),
      proposedTimeRange: `${formatTimeVi(new Date(proposedStartMs))} - ${formatTimeVi(new Date(totalEndMs))}`,
    };
  }, [selectedRoomId, selectedMovieId, startTime, dayShowtimes, showtimes, movies, editingShowtime]);

  // Save Showtime
  const handleSaveShowtime = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Client-side protection
    if (conflictAnalysis?.hasConflict) {
      setFormError(
        `Không thể lưu vì bị trùng lịch chiếu với phim "${conflictAnalysis.conflictingMovieTitle}" (${conflictAnalysis.conflictingTimeRange}). Vui lòng đổi giờ chiếu hoặc chọn phòng khác.`
      );
      return;
    }

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

      // Refresh both Day View and Table View
      if (selectedDayCinemaId && selectedDate) {
        fetchDayShowtimes(selectedDayCinemaId, selectedDate);
      }
      fetchShowtimes(selectedCinemaFilter, search, currentPage);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Không thể lưu suất chiếu. Vui lòng kiểm tra lại thông tin.';
      setFormError(msg);
    } finally {
      setSaving(false);
    }
  };

  // Delete Showtime Handlers
  const promptDeleteShowtime = (st: Showtime) => {
    setDeleteModal({
      isOpen: true,
      showtime: st,
      isLoading: false,
      errorMessage: null,
    });
  };

  const handleConfirmDeleteShowtime = async () => {
    if (!deleteModal.showtime) return;
    setDeleteModal((prev) => ({ ...prev, isLoading: true, errorMessage: null }));
    try {
      await adminApi.deleteShowtime(deleteModal.showtime.id);
      setDeleteModal({ isOpen: false });
      if (selectedDayCinemaId && selectedDate) {
        fetchDayShowtimes(selectedDayCinemaId, selectedDate);
      }
      fetchShowtimes(selectedCinemaFilter, search, currentPage);
    } catch (err: any) {
      setDeleteModal((prev) => ({
        ...prev,
        isLoading: false,
        errorMessage: err.response?.data?.message || 'Không thể hủy suất chiếu. Suất chiếu có thể đã có khách đặt vé.',
      }));
    }
  };

  // ----------------------------------------------------
  // TIMELINE CLICK HANDLER
  // ----------------------------------------------------
  const handleTimelineTrackClick = (e: React.MouseEvent<HTMLDivElement>, room: Room) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percent = Math.max(0, Math.min(1, clickX / rect.width));

    const clickedMinutes = TIMELINE_START_HOUR * 60 + percent * TOTAL_MINUTES;
    // Round to nearest 15 minutes
    const roundedMinutes = Math.floor(clickedMinutes / 15) * 15;
    const h = Math.floor(roundedMinutes / 60);
    const m = roundedMinutes % 60;

    const hStr = String(Math.min(23, Math.max(0, h))).padStart(2, '0');
    const mStr = String(m).padStart(2, '0');
    const timeIso = `${selectedDate}T${hStr}:${mStr}`;

    handleOpenAddModalForRoomAndTime(room.id, timeIso);
  };

  // Adjust Start Time by minutes (+15, -15, +30, -30)
  const handleShiftStartTime = (deltaMinutes: number) => {
    if (!startTime) return;
    const current = new Date(startTime);
    if (isNaN(current.getTime())) return;
    current.setMinutes(current.getMinutes() + deltaMinutes);
    const localIso = new Date(current.getTime() - current.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
    setStartTime(localIso);
  };

  // Current Cinema Object for Day View
  const currentCinema = cinemas.find((c) => c.id === selectedDayCinemaId) || cinemas[0];

  // Check Overlaps in Day View to highlight any anomalies
  const roomShowtimeOverlaps = useMemo(() => {
    const map: Record<string, boolean> = {};
    if (!dayShowtimes || dayShowtimes.length === 0) return map;

    for (let i = 0; i < dayShowtimes.length; i++) {
      for (let j = i + 1; j < dayShowtimes.length; j++) {
        const a = dayShowtimes[i];
        const b = dayShowtimes[j];
        if (a.room?.id === b.room?.id && a.status !== 'CANCELLED' && b.status !== 'CANCELLED') {
          const aStart = new Date(a.startTime).getTime();
          const aEnd = new Date(a.endTime).getTime();
          const bStart = new Date(b.startTime).getTime();
          const bEnd = new Date(b.endTime).getTime();

          if (aStart < bEnd && aEnd > bStart) {
            map[a.id] = true;
            map[b.id] = true;
          }
        }
      }
    }
    return map;
  }, [dayShowtimes]);

  const hasAnyDayConflict = Object.keys(roomShowtimeOverlaps).length > 0;

  // Day Stats
  const dayStats = useMemo(() => {
    const totalShows = dayShowtimes.length;
    const totalRooms = currentCinema?.rooms?.length || 0;
    const scheduled = dayShowtimes.filter((s) => s.status === 'SCHEDULED').length;
    const ongoing = dayShowtimes.filter((s) => s.status === 'ONGOING').length;
    return { totalShows, totalRooms, scheduled, ongoing };
  }, [dayShowtimes, currentCinema]);

  // Current Time indicator position (if viewing today)
  const currentTimeIndicatorPercent = useMemo(() => {
    if (selectedDate !== getTodayDateString()) return null;
    const now = new Date();
    const minutes = (now.getHours() - TIMELINE_START_HOUR) * 60 + now.getMinutes();
    if (minutes < 0 || minutes > TOTAL_MINUTES) return null;
    return (minutes / TOTAL_MINUTES) * 100;
  }, [selectedDate]);

  return (
    <div className="space-y-6 animate-fadeIn text-slate-800">
      {/* ==================================================== */}
      {/* 1. TOP HEADER & VIEW MODE SELECTOR                   */}
      {/* ==================================================== */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <CalendarDays className="w-7 h-7 text-emerald-600" />
            QUẢN LÝ SUẤT CHIẾU
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Giao diện thời khóa biểu thông minh (Day View) giúp sắp xếp lịch chiếu trực quan, tự động tính 15 phút dọn phòng và chống trùng giờ tuyệt đối.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Segmented View Mode Switcher */}
          <div className="bg-slate-100 p-1 rounded-2xl border border-slate-200 flex items-center shadow-xs">
            <button
              type="button"
              onClick={() => setViewMode('DAY_VIEW')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                viewMode === 'DAY_VIEW'
                  ? 'bg-white text-emerald-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Lịch Chiếu Theo Ngày (Day View)</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('TABLE_VIEW')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                viewMode === 'TABLE_VIEW'
                  ? 'bg-white text-emerald-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ListFilter className="w-4 h-4" />
              <span>Bảng Danh Sách</span>
            </button>
          </div>
        </div>
      </div>

      {/* ==================================================== */}
      {/* 2. DAY VIEW SECTION                                  */}
      {/* ==================================================== */}
      {viewMode === 'DAY_VIEW' && (
        <div className="space-y-4">
          {/* Day View Controls Toolbar */}
          <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            {/* Cinema Selection Chips */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              <span className="text-xs font-bold text-slate-500 shrink-0 flex items-center gap-1.5 mr-1">
                <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                Chọn Cụm Rạp:
              </span>
              {cinemas.map((c) => {
                const isSelected = selectedDayCinemaId === c.id;
                const roomCount = c.rooms?.length || 0;
                return (
                  <button
                    key={c.id}
                    onClick={() => setSelectedDayCinemaId(c.id)}
                    className={`py-2 px-4 rounded-2xl text-xs font-bold transition shrink-0 flex items-center gap-2 border ${
                      isSelected
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/20'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <span>{c.name}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                        isSelected ? 'bg-emerald-700/60 text-white' : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {roomCount} phòng
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Date Navigator & Day Quick Navigation */}
            <div className="pt-3 border-t border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
              {/* Date Controls */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedDate((prev) => shiftDate(prev, -1))}
                  className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition text-xs border border-slate-200 flex items-center gap-1"
                  title="Hôm trước"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span className="hidden sm:inline">Hôm trước</span>
                </button>

                <div className="relative flex items-center">
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => e.target.value && setSelectedDate(e.target.value)}
                    className="py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-500 cursor-pointer shadow-2xs"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedDate(getTodayDateString())}
                  className={`py-1.5 px-3 rounded-xl text-xs font-bold transition border ${
                    selectedDate === getTodayDateString()
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                      : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                  }`}
                >
                  Hôm nay
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedDate(getTomorrowDateString())}
                  className={`py-1.5 px-3 rounded-xl text-xs font-bold transition border ${
                    selectedDate === getTomorrowDateString()
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                      : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                  }`}
                >
                  Ngày mai
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedDate((prev) => shiftDate(prev, 1))}
                  className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition text-xs border border-slate-200 flex items-center gap-1"
                  title="Hôm sau"
                >
                  <span className="hidden sm:inline">Hôm sau</span>
                  <ChevronRight className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => fetchDayShowtimes(selectedDayCinemaId, selectedDate)}
                  disabled={dayLoading}
                  className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition border border-slate-200 ml-1"
                  title="Làm mới lịch chiếu"
                >
                  <RefreshCw className={`w-4 h-4 ${dayLoading ? 'animate-spin text-emerald-600' : ''}`} />
                </button>

                <span className="text-xs font-bold text-slate-800 pl-2">
                  {formatDateVi(selectedDate)}
                </span>
              </div>

              {/* Day Summary Stats & Conflict Health Status */}
              <div className="flex items-center gap-3 text-xs">
                {hasAnyDayConflict ? (
                  <div className="py-1.5 px-3 rounded-xl bg-rose-50 border border-rose-300 text-rose-700 font-bold flex items-center gap-2 animate-pulse">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    <span>Có suất chiếu bị trùng giờ!</span>
                  </div>
                ) : (
                  <div className="py-1.5 px-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Lịch chiếu tối ưu (0 trùng lặp)</span>
                  </div>
                )}

                <div className="hidden sm:flex items-center gap-2 text-slate-500 font-medium">
                  <span>Tổng: <strong className="text-slate-800">{dayStats.totalShows}</strong> suất</span>
                  <span>•</span>
                  <span><strong className="text-slate-800">{dayStats.totalRooms}</strong> phòng</span>
                </div>
              </div>
            </div>

            {/* Visual Legend */}
            <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-500">
              <div className="flex flex-wrap items-center gap-4">
                <span className="font-bold text-slate-700">Chú thích trực quan:</span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-md bg-blue-500/20 border border-blue-500" />
                  Đã lên lịch (SCHEDULED)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-md bg-emerald-500/20 border border-emerald-500" />
                  Đang chiếu (ONGOING)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-md bg-amber-200 border border-amber-400 border-dashed" />
                  ⏳ 15p dọn phòng & chuẩn bị
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-md bg-rose-500/30 border border-rose-600" />
                  ⚠️ Xung đột giờ
                </span>
              </div>
              <span className="text-emerald-700 font-medium">
                💡 Mẹo: Nhấp vào bất kỳ khoảng trống nào trên dòng phòng chiếu để tạo nhanh suất chiếu tại giờ đó!
              </span>
            </div>
          </div>

          {/* -------------------------------------------------- */}
          {/* Day View Timetable Grid                           */}
          {/* -------------------------------------------------- */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            {dayLoading ? (
              <div className="py-24 text-center text-slate-400 space-y-3">
                <RefreshCw className="w-8 h-8 mx-auto animate-spin text-emerald-600" />
                <p className="text-xs font-bold">Đang tải lịch chiếu ngày {formatDateVi(selectedDate)}...</p>
              </div>
            ) : !currentCinema?.rooms || currentCinema.rooms.length === 0 ? (
              <div className="py-20 text-center text-slate-400 space-y-2">
                <Film className="w-10 h-10 mx-auto text-slate-300" />
                <p className="text-sm font-bold text-slate-600">Rạp này chưa có phòng chiếu nào.</p>
                <p className="text-xs text-slate-400">
                  Vui lòng chuyển sang trang <strong>Quản Lý Rạp</strong> để cấu hình phòng chiếu cho rạp này.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto select-none">
                <div className="min-w-[1400px]">
                  {/* Timeline Header Row (Hours: 08:00 -> 01:00 next day) */}
                  <div className="flex border-b border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-600 sticky top-0 z-20">
                    {/* Left Sticky Room Column */}
                    <div className="w-56 shrink-0 p-3.5 border-r border-slate-200 bg-slate-100 flex items-center justify-between sticky left-0 z-30 shadow-[2px_0_5px_rgba(0,0,0,0.03)]">
                      <span className="uppercase tracking-wider font-extrabold text-slate-700">Phòng Chiếu</span>
                      <span className="text-[10px] font-bold text-slate-400">{currentCinema.rooms.length} phòng</span>
                    </div>

                    {/* Timeline Hours Grid Header */}
                    <div className="flex-1 flex relative">
                      {Array.from({ length: TOTAL_HOURS }).map((_, i) => {
                        const hour = TIMELINE_START_HOUR + i;
                        const displayHour = hour >= 24 ? `0${hour - 24}:00` : `${String(hour).padStart(2, '0')}:00`;
                        return (
                          <div
                            key={hour}
                            className="flex-1 border-r border-slate-200 py-3 px-2 text-left relative flex justify-between items-center group"
                          >
                            <span className="font-bold text-slate-700">{displayHour}</span>
                            {/* Half hour tick */}
                            <span className="text-[9px] text-slate-300 font-medium">:30</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Room Rows */}
                  <div className="divide-y divide-slate-100 relative">
                    {currentCinema.rooms.map((room) => {
                      // Filter showtimes for this room today
                      const roomShows = dayShowtimes.filter(
                        (st) => st.room?.id === room.id && st.status !== 'CANCELLED'
                      );

                      return (
                        <div key={room.id} className="flex min-h-[120px] group/row hover:bg-slate-50/50 transition">
                          {/* Sticky Room Info Cell */}
                          <div className="w-56 shrink-0 p-3.5 border-r border-slate-200 bg-white group-hover/row:bg-slate-50 sticky left-0 z-20 flex flex-col justify-between shadow-[2px_0_5px_rgba(0,0,0,0.03)] transition">
                            <div>
                              <p className="font-black text-slate-900 text-sm truncate" title={room.name}>
                                {room.name}
                              </p>
                              <div className="flex items-center gap-1.5 mt-1">
                                <span
                                  className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md uppercase border ${
                                    room.roomType === 'IMAX_3D'
                                      ? 'bg-purple-50 text-purple-700 border-purple-200'
                                      : room.roomType === 'FOUR_DX'
                                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                                      : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  }`}
                                >
                                  {room.roomType}
                                </span>
                                <span className="text-[10px] text-slate-400 font-medium">
                                  {room.totalSeats ? `${room.totalSeats} ghế` : '80-120 ghế'}
                                </span>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                const now = new Date();
                                const defaultHours = String(Math.max(8, now.getHours() + 1)).padStart(2, '0');
                                handleOpenAddModalForRoomAndTime(room.id, `${selectedDate}T${defaultHours}:00`);
                              }}
                              className="mt-2 py-1.5 px-2.5 rounded-xl bg-slate-100 hover:bg-emerald-600 hover:text-white text-slate-700 font-bold text-[10px] flex items-center justify-center gap-1 transition border border-slate-200 cursor-pointer shadow-2xs"
                            >
                              <Plus className="w-3 h-3" />
                              <span>Thêm Suất Chiếu</span>
                            </button>
                          </div>

                          {/* Timeline Room Track */}
                          <div
                            onClick={(e) => handleTimelineTrackClick(e, room)}
                            className="flex-1 relative cursor-pointer min-h-[120px] bg-white group/track"
                            title="Nhấp vào khoảng trống để lên lịch suất chiếu mới"
                          >
                            {/* Background Hour Column Gridlines */}
                            <div className="absolute inset-0 flex pointer-events-none">
                              {Array.from({ length: TOTAL_HOURS }).map((_, i) => (
                                <div
                                  key={i}
                                  className="flex-1 border-r border-slate-100 relative h-full flex"
                                >
                                  {/* Dashed half hour line */}
                                  <div className="w-1/2 border-r border-slate-100/70 border-dashed h-full" />
                                </div>
                              ))}
                            </div>

                            {/* Current Time Vertical Indicator Line */}
                            {currentTimeIndicatorPercent !== null && (
                              <div
                                className="absolute top-0 bottom-0 w-0.5 bg-rose-500 z-10 pointer-events-none shadow-xs"
                                style={{ left: `${currentTimeIndicatorPercent}%` }}
                              >
                                <div className="absolute -top-1.5 -translate-x-1/2 bg-rose-500 text-white text-[8px] font-black px-1 py-0.2 rounded shadow-xs uppercase tracking-wider">
                                  Hiện tại
                                </div>
                              </div>
                            )}

                            {/* Empty state prompt on empty track */}
                            {roomShows.length === 0 && (
                              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <span className="text-xs text-slate-300 font-medium group-hover/track:text-emerald-600 group-hover/track:font-bold transition flex items-center gap-1.5">
                                  <Plus className="w-3.5 h-3.5" />
                                  Phòng còn trống cả ngày • Nhấp để xếp lịch chiếu
                                </span>
                              </div>
                            )}

                            {/* Render Showtime Blocks */}
                            {roomShows.map((st) => {
                              const start = new Date(st.startTime);
                              const end = new Date(st.endTime);

                              // Calculate minutes relative to TIMELINE_START_HOUR
                              const startMinutes =
                                (start.getHours() - TIMELINE_START_HOUR) * 60 + start.getMinutes();
                              const endMinutes =
                                (end.getHours() - TIMELINE_START_HOUR) * 60 +
                                end.getMinutes() +
                                (end.getDate() !== start.getDate() ? 24 * 60 : 0);

                              const durationMinutes = Math.max(30, endMinutes - startMinutes);
                              const movieDuration = st.movie?.durationMinutes || 120;

                              const leftPercent = Math.max(0, (startMinutes / TOTAL_MINUTES) * 100);
                              const widthPercent = Math.min(100 - leftPercent, (durationMinutes / TOTAL_MINUTES) * 100);

                              // Split ratios: Movie vs 15-min Cleaning Buffer
                              const movieRatio = (movieDuration / durationMinutes) * 100;
                              const bufferRatio = (CLEANING_BUFFER_MINUTES / durationMinutes) * 100;

                              const isOverlap = !!roomShowtimeOverlaps[st.id];
                              const palette = getMoviePalette(st.movie?.id);

                              return (
                                <div
                                  key={st.id}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenEditModal(st);
                                  }}
                                  onMouseEnter={() => setActiveHoverShowtime(st)}
                                  onMouseLeave={() => setActiveHoverShowtime(null)}
                                  style={{
                                    left: `${leftPercent}%`,
                                    width: `${widthPercent}%`,
                                  }}
                                  className={`absolute top-2 bottom-2 rounded-2xl flex border shadow-sm transition-all duration-150 z-10 overflow-hidden cursor-pointer group/card ${
                                    isOverlap
                                      ? 'ring-2 ring-rose-500 border-rose-500 bg-rose-50 shadow-rose-200'
                                      : `${palette.bg} ${palette.border}`
                                  }`}
                                >
                                  {/* Movie Play Section */}
                                  <div
                                    style={{ width: `${movieRatio}%` }}
                                    className="p-2 flex flex-col justify-between border-r border-dashed border-slate-300/80 min-w-0"
                                  >
                                    <div>
                                      <div className="flex items-center justify-between gap-1 mb-0.5">
                                        <div className="flex items-center gap-1 truncate">
                                          <span className={`w-2 h-2 rounded-full ${palette.dot} shrink-0`} />
                                          <span className="font-black text-slate-900 text-xs truncate">
                                            {st.movie?.title}
                                          </span>
                                        </div>

                                        {isOverlap && (
                                          <span className="bg-rose-600 text-white font-black text-[9px] px-1 py-0.2 rounded shrink-0">
                                            TRÙNG!
                                          </span>
                                        )}
                                      </div>

                                      <div className="flex items-center gap-1 text-[10px] font-bold text-slate-600">
                                        <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                                        <span>
                                          {formatTimeVi(st.startTime)} - {formatTimeVi(new Date(new Date(st.startTime).getTime() + movieDuration * 60000))}
                                        </span>
                                        <span className="text-slate-400 font-normal">({movieDuration}p)</span>
                                      </div>
                                    </div>

                                    {/* Bottom Info & Quick Action Icons */}
                                    <div className="flex items-center justify-between gap-1 text-[10px] pt-1">
                                      <span className="font-bold text-emerald-700 truncate">
                                        {new Intl.NumberFormat('vi-VN').format(st.basePrice)}đ
                                      </span>

                                      <div className="opacity-0 group-hover/card:opacity-100 transition flex items-center gap-1 shrink-0 bg-white/90 p-0.5 rounded-lg shadow-2xs">
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleScheduleNextSlot(st);
                                          }}
                                          className="p-1 rounded hover:bg-emerald-100 text-emerald-700"
                                          title="Lên suất chiếu tiếp theo ngay sau giờ dọn phòng"
                                        >
                                          <Plus className="w-3 h-3" />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleOpenEditModal(st);
                                          }}
                                          className="p-1 rounded hover:bg-amber-100 text-amber-700"
                                          title="Sửa suất chiếu"
                                        >
                                          <Edit2 className="w-3 h-3" />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            promptDeleteShowtime(st);
                                          }}
                                          className="p-1 rounded hover:bg-rose-100 text-rose-700"
                                          title="Hủy suất chiếu"
                                        >
                                          <Trash2 className="w-3 h-3" />
                                        </button>
                                      </div>
                                    </div>
                                  </div>

                                  {/* 15-Min Cleaning Buffer Section */}
                                  <div
                                    style={{ width: `${bufferRatio}%` }}
                                    className="bg-amber-100/90 text-amber-900 border-l border-amber-300 flex flex-col items-center justify-center p-1 text-center shrink-0 cursor-help"
                                    title={`Dọn phòng & chuẩn bị: 15 phút (kết thúc lúc ${formatTimeVi(st.endTime)})`}
                                  >
                                    <span className="text-[10px] font-black">🧹</span>
                                    <span className="text-[9px] font-black leading-none mt-0.5">15p</span>
                                    <span className="text-[8px] text-amber-800/80 scale-90 leading-tight">dọn</span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* 3. TABLE VIEW SECTION (FULL DETAILS & SEARCH)        */}
      {/* ==================================================== */}
      {viewMode === 'TABLE_VIEW' && (
        <div className="space-y-4">
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
                onClick={() => {
                  setSelectedCinemaFilter('ALL');
                  setCurrentPage(1);
                }}
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
                  onClick={() => {
                    setSelectedCinemaFilter(c.id);
                    setCurrentPage(1);
                  }}
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
                    <th className="py-4 px-4">Giờ Chiếu & Dọn Phòng</th>
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
                      const cleanEndTime = formatTimeVi(st.endTime);

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
                                <p className="text-[11px] text-slate-500 font-medium">
                                  {st.movie?.durationMinutes} phút • {st.movie?.ageRating}
                                </p>
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
                            <span className="text-[10px] text-amber-700 font-bold flex items-center gap-1 mt-0.5">
                              <span>🧹 Dọn xong: {cleanEndTime}</span>
                            </span>
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
                              onClick={() => handleScheduleNextSlot(st)}
                              className="p-2 rounded-xl bg-slate-100 hover:bg-emerald-600 hover:text-white text-slate-600 transition shadow-sm border border-slate-200"
                              title="Tạo suất chiếu tiếp theo"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleOpenEditModal(st)}
                              className="p-2 rounded-xl bg-slate-100 hover:bg-amber-500 hover:text-white text-slate-600 transition shadow-sm border border-slate-200"
                              title="Sửa suất chiếu"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => promptDeleteShowtime(st)}
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
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
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
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
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
        </div>
      )}

      {/* ==================================================== */}
      {/* 4. ADD / EDIT SHOWTIME MODAL WITH LIVE CONFLICTS     */}
      {/* ==================================================== */}
      {isModalOpen && (
        <div
          onClick={() => setIsModalOpen(false)}
          className="fixed inset-0 !m-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-xl bg-white border border-slate-200 rounded-3xl shadow-2xl p-6 sm:p-8 text-slate-800 max-h-[90vh] overflow-y-auto"
          >
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-black text-slate-900 mb-1 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-emerald-600" />
              <span>{editingShowtime ? 'SỬA SUẤT CHIẾU' : 'TẠO SUẤT CHIẾU MỚI'}</span>
            </h3>
            <p className="text-xs text-slate-500 mb-5">
              Hệ thống tự động phân tích khung giờ chiếu, cộng thêm 15 phút dọn phòng và ngăn chặn trùng lịch thời gian thực.
            </p>

            {/* Error Banner from Backend */}
            {formError && (
              <div className="mb-4 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2.5">
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-bold">LỖI XÁC THỰC:</strong>
                  <span>{formError}</span>
                </div>
              </div>
            )}

            {/* LIVE CONFLICT DETECTION ALERT BOX */}
            {conflictAnalysis && (
              <div className="mb-5">
                {conflictAnalysis.hasConflict ? (
                  <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-300 text-rose-900 text-xs space-y-2.5 shadow-xs animate-shake">
                    <div className="flex items-start gap-2.5">
                      <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-extrabold text-rose-800 text-sm">CẢNH BÁO TRÙNG LỊCH PHÒNG CHIẾU!</p>
                        <p className="text-rose-700 mt-1 leading-relaxed">
                          Khung giờ dự kiến <strong>({conflictAnalysis.proposedTimeRange})</strong> bị đè lên suất chiếu phim{' '}
                          <span className="font-black text-rose-900">"{conflictAnalysis.conflictingMovieTitle}"</span>{' '}
                          (<strong>{conflictAnalysis.conflictingTimeRange}</strong>) tại phòng này.
                        </p>
                      </div>
                    </div>

                    {conflictAnalysis.suggestedTime && (
                      <div className="pt-2 border-t border-rose-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <span className="text-[11px] text-rose-800 font-medium">
                          💡 Khung giờ trống sớm nhất tiếp theo: <strong>{conflictAnalysis.suggestedDisplay}</strong>
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            if (conflictAnalysis.suggestedTime) {
                              setStartTime(conflictAnalysis.suggestedTime);
                            }
                          }}
                          className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs transition shadow-sm flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Đặt giờ thành {conflictAnalysis.suggestedDisplay}</span>
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <div>
                      <p className="font-bold text-emerald-800">Khung giờ an toàn & khả dụng!</p>
                      <p className="text-[11px] text-emerald-700 mt-0.5">
                        Phim chiếu đến <strong>{conflictAnalysis.movieEndTimeFormatted}</strong> • Dọn phòng đến{' '}
                        <strong>{conflictAnalysis.expectedEndTimeFormatted}</strong> (hoàn toàn không có trùng lịch).
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            <form onSubmit={handleSaveShowtime} className="space-y-4 text-xs">
              {/* Select Movie */}
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

              {/* Cinema & Room Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

              {/* Start Time with Micro-Adjusters */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-bold text-slate-700">Thời Gian Bắt Đầu *</label>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleShiftStartTime(-30)}
                      className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold border border-slate-200"
                      title="Lùi 30 phút"
                    >
                      -30p
                    </button>
                    <button
                      type="button"
                      onClick={() => handleShiftStartTime(-15)}
                      className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold border border-slate-200"
                      title="Lùi 15 phút"
                    >
                      -15p
                    </button>
                    <button
                      type="button"
                      onClick={() => handleShiftStartTime(15)}
                      className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold border border-slate-200"
                      title="Tiến 15 phút"
                    >
                      +15p
                    </button>
                    <button
                      type="button"
                      onClick={() => handleShiftStartTime(30)}
                      className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold border border-slate-200"
                      title="Tiến 30 phút"
                    >
                      +30p
                    </button>
                  </div>
                </div>
                <input
                  type="datetime-local"
                  required
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-slate-800 focus:outline-none focus:border-emerald-500 font-medium cursor-pointer"
                />
              </div>

              {/* Price & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                  <div className="flex items-center gap-1.5 mt-1.5">
                    {[75000, 80000, 85000, 100000].map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setBasePrice(p)}
                        className={`text-[10px] px-1.5 py-0.5 rounded border ${
                          basePrice === p
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold'
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}
                      >
                        {p / 1000}k
                      </button>
                    ))}
                  </div>
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

              {/* Form Action Buttons */}
              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="py-2.5 px-5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold border border-slate-200 transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={saving || conflictAnalysis?.hasConflict}
                  className={`py-2.5 px-6 rounded-xl font-bold text-white shadow-lg transition flex items-center gap-2 ${
                    conflictAnalysis?.hasConflict
                      ? 'bg-rose-400 cursor-not-allowed shadow-none'
                      : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30'
                  }`}
                >
                  {saving ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Đang kiểm tra...</span>
                    </>
                  ) : conflictAnalysis?.hasConflict ? (
                    <>
                      <AlertTriangle className="w-4 h-4" />
                      <span>Trùng Lịch - Chưa Thể Lưu</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>LƯU SUẤT CHIẾU</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cancel/Delete Showtime Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => !deleteModal.isLoading && setDeleteModal({ isOpen: false })}
        onConfirm={handleConfirmDeleteShowtime}
        title="Xác Nhận Hủy Suất Chiếu"
        message={
          <>
            Bạn có chắc chắn muốn hủy suất chiếu phim <strong className="text-slate-900 font-bold">"{deleteModal.showtime?.movie?.title}"</strong> không?
            {deleteModal.showtime && (
              <span className="block mt-1 text-slate-500 text-xs">
                Khung giờ:{' '}
                <span className="font-bold text-slate-700">
                  {new Date(deleteModal.showtime.startTime).toLocaleTimeString('vi-VN', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false,
                  })}{' '}
                  -{' '}
                  {new Date(deleteModal.showtime.endTime).toLocaleTimeString('vi-VN', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false,
                  })}{' '}
                  • {deleteModal.showtime.room?.name}
                </span>
              </span>
            )}
          </>
        }
        subMessage="Lưu ý: Hệ thống sẽ giải phóng khung giờ phòng chiếu và không thể hoàn tác."
        confirmText="Hủy Suất Chiếu"
        cancelText="Quay Lại"
        type="danger"
        isLoading={deleteModal.isLoading}
        errorMessage={deleteModal.errorMessage}
      />
    </div>
  );
};
