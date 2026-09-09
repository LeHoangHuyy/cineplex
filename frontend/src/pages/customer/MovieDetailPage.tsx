import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Film, Play, Clock, Calendar, MapPin, Ticket, User, Sparkles, X, ChevronRight } from 'lucide-react';
import { Movie, Cinema, Showtime } from '../../types';
import { movieApi, cinemaApi, showtimeApi } from '../../api';

export const MovieDetailPage: React.FC = () => {
  const { idOrSlug } = useParams<{ idOrSlug: string }>();
  const navigate = useNavigate();

  const [movie, setMovie] = useState<Movie | null>(null);
  const [cinemas, setCinemas] = useState<Cinema[]>([]);
  const [showtimes, setShowtimes] = useState<Showtime[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [selectedCinemaId, setSelectedCinemaId] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);
  const [loadingShowtimes, setLoadingShowtimes] = useState(false);

  const [trailerModalOpen, setTrailerModalOpen] = useState(false);

  // Generate 7 days for date picker
  const next7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return {
      dateStr: d.toISOString().split('T')[0],
      dayName: i === 0 ? 'Hôm nay' : i === 1 ? 'Ngày mai' : `Thứ ${d.getDay() + 1 === 1 ? 'CN' : d.getDay() + 1}`,
      displayDate: `${d.getDate()}/${d.getMonth() + 1}`,
    };
  });

  useEffect(() => {
    const fetchMovieAndCinemas = async () => {
      if (!idOrSlug) return;
      setLoading(true);
      try {
        let movieData: Movie;
        // Check if idOrSlug is a UUID
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);
        if (isUuid) {
          const res = await movieApi.getById(idOrSlug);
          movieData = res.data;
        } else {
          const res = await movieApi.getBySlug(idOrSlug);
          movieData = res.data;
        }
        setMovie(movieData);

        const cinemasRes = await cinemaApi.getAll();
        setCinemas(cinemasRes.data);
      } catch (err) {
        console.error('Error fetching movie details:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMovieAndCinemas();
  }, [idOrSlug]);

  useEffect(() => {
    const fetchShowtimes = async () => {
      if (!movie) return;
      setLoadingShowtimes(true);
      try {
        const res = await showtimeApi.getByMovie(movie.id, selectedDate);
        setShowtimes(res.data);
      } catch (err) {
        console.error('Error fetching showtimes:', err);
      } finally {
        setLoadingShowtimes(false);
      }
    };

    fetchShowtimes();
  }, [movie, selectedDate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="min-h-screen bg-slate-50 text-center py-20">
        <h2 className="text-xl font-bold text-slate-800 mb-2">Không tìm thấy thông tin phim</h2>
        <Link to="/movies" className="text-emerald-600 font-bold hover:underline">
          &larr; Quay lại danh sách phim
        </Link>
      </div>
    );
  }

  // Filter showtimes by cinema if selected
  const filteredShowtimes = showtimes.filter((s) =>
    selectedCinemaId === 'ALL' ? true : s.room.cinemaId === selectedCinemaId
  );

  // Group showtimes by Cinema
  const showtimesByCinema = filteredShowtimes.reduce((acc, st) => {
    const cinemaName = st.cinema?.name || st.room?.cinemaName || 'Cụm Rạp Cineplex';
    if (!acc[cinemaName]) {
      acc[cinemaName] = [];
    }
    acc[cinemaName].push(st);
    return acc;
  }, {} as Record<string, Showtime[]>);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-20">
      {/* Movie Backdrop Hero */}
      <section className="relative w-full h-[380px] sm:h-[480px] overflow-hidden bg-slate-950">
        <img
          src={movie.bannerUrl || movie.posterUrl}
          alt={movie.title}
          className="w-full h-full object-cover object-top opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />
      </section>

      {/* Main Details Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-48 sm:-mt-64 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Left: Poster Image */}
          <div className="md:col-span-1">
            <div className="aspect-[2/3] rounded-3xl overflow-hidden shadow-2xl border border-white/20 bg-slate-100 group relative">
              <img
                src={movie.posterUrl}
                alt={movie.title}
                className="w-full h-full object-cover"
              />
              {movie.trailerUrl && (
                <button
                  onClick={() => setTrailerModalOpen(true)}
                  className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-2 transition text-white backdrop-blur-[2px]"
                >
                  <div className="w-14 h-14 rounded-full bg-emerald-600 flex items-center justify-center shadow-lg">
                    <Play className="w-6 h-6 fill-white ml-0.5" />
                  </div>
                  <span className="text-xs font-bold">XEM TRAILER</span>
                </button>
              )}
            </div>
          </div>

          {/* Right: Movie Meta & Description */}
          <div className="md:col-span-3 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-600 text-white shadow-sm">
                {movie.ageRating}
              </span>
              <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-white/90 backdrop-blur-md border border-white/20 text-slate-800 shadow-sm">
                {movie.genre}
              </span>
              <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-white/90 backdrop-blur-md border border-white/20 text-slate-800 shadow-sm flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-emerald-600" />
                {movie.durationMinutes} phút
              </span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black text-white leading-tight drop-shadow-md">
              {movie.title}
            </h1>

            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4 text-slate-700">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {movie.director && (
                  <div>
                    <span className="text-slate-400 font-bold block">ĐẠO DIỄN:</span>
                    <span className="font-bold text-slate-800">{movie.director}</span>
                  </div>
                )}
                {movie.castMembers && (
                  <div>
                    <span className="text-slate-400 font-bold block">DIỄN VIÊN:</span>
                    <span className="font-bold text-slate-800">{movie.castMembers}</span>
                  </div>
                )}
                <div>
                  <span className="text-slate-400 font-bold block">KHỞI CHIẾU:</span>
                  <span className="font-bold text-slate-800">{movie.releaseDate}</span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  NỘI DUNG PHIM
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {movie.description}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Showtime Booking Section */}
        <section className="mt-14 pt-10 border-t border-slate-200 space-y-6">
          <div className="flex items-center gap-2">
            <Calendar className="w-6 h-6 text-emerald-600" />
            <h2 className="text-2xl font-black text-slate-900 tracking-wide">
              LỊCH CHIẾU & ĐẶT VÉ
            </h2>
          </div>

          {/* 1. Date Selector */}
          <div className="flex items-center gap-2.5 overflow-x-auto pb-2">
            {next7Days.map((item) => {
              const isSelected = selectedDate === item.dateStr;
              return (
                <button
                  key={item.dateStr}
                  onClick={() => setSelectedDate(item.dateStr)}
                  className={`py-3 px-4 rounded-2xl text-center transition min-w-[100px] shrink-0 border ${
                    isSelected
                      ? 'bg-emerald-600 border-emerald-500 text-white shadow-lg shadow-emerald-600/30'
                      : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-900 shadow-sm'
                  }`}
                >
                  <span className="block text-[11px] font-semibold">{item.dayName}</span>
                  <span className="block text-base font-black mt-0.5">{item.displayDate}</span>
                </button>
              );
            })}
          </div>

          {/* 2. Cinema Filter Buttons */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <button
              onClick={() => setSelectedCinemaId('ALL')}
              className={`py-2 px-4 rounded-xl text-xs font-bold transition shrink-0 border ${
                selectedCinemaId === 'ALL'
                  ? 'bg-slate-900 border-slate-900 text-white font-black'
                  : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 shadow-sm'
              }`}
            >
              Tất Cả Cụm Rạp
            </button>
            {cinemas.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCinemaId(c.id)}
                className={`py-2 px-4 rounded-xl text-xs font-bold transition shrink-0 border ${
                  selectedCinemaId === c.id
                    ? 'bg-slate-900 border-slate-900 text-white font-black'
                    : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 shadow-sm'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>

          {/* 3. Showtime Matrix */}
          {loadingShowtimes ? (
            <div className="py-12 text-center">
              <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-xs text-slate-500">Đang tải lịch chiếu...</p>
            </div>
          ) : Object.keys(showtimesByCinema).length === 0 ? (
            <div className="py-12 text-center bg-white rounded-3xl border border-slate-200 shadow-sm">
              <Ticket className="w-10 h-10 text-slate-400 mx-auto mb-2" />
              <p className="text-slate-700 font-bold text-sm">
                Không có suất chiếu nào cho ngày đã chọn.
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Vui lòng chọn ngày khác hoặc cụm rạp khác.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(showtimesByCinema).map(([cinemaName, list]) => (
                <div
                  key={cinemaName}
                  className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-sm"
                >
                  <div className="flex items-center gap-2 text-emerald-600">
                    <MapPin className="w-4 h-4 shrink-0" />
                    <h3 className="font-bold text-base text-slate-900">{cinemaName}</h3>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                    {list.map((st) => {
                      const startTime = new Date(st.startTime).toLocaleTimeString('vi-VN', {
                        hour: '2-digit',
                        minute: '2-digit',
                      });
                      const endTime = new Date(st.endTime).toLocaleTimeString('vi-VN', {
                        hour: '2-digit',
                        minute: '2-digit',
                      });

                      return (
                        <button
                          key={st.id}
                          onClick={() => navigate(`/booking/${st.id}`)}
                          className="group p-3 rounded-2xl bg-slate-50 border border-slate-200 hover:border-emerald-500 transition text-center flex flex-col items-center gap-1 hover:bg-emerald-50/50 shadow-sm"
                        >
                          <span className="text-xs font-semibold text-slate-500 group-hover:text-emerald-600">
                            {st.room?.name || 'Phòng chiếu'}
                          </span>
                          <span className="text-lg font-black text-slate-800 group-hover:text-emerald-600">
                            {startTime}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            ~ {endTime}
                          </span>
                          <span className="text-[10px] text-emerald-600 font-bold">
                            {new Intl.NumberFormat('vi-VN', {
                              style: 'currency',
                              currency: 'VND',
                            }).format(st.basePrice)}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Trailer Video Modal */}
      {trailerModalOpen && movie.trailerUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="relative w-full max-w-4xl bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-700">
            <div className="flex items-center justify-between p-4 bg-slate-900 border-b border-slate-800">
              <h4 className="font-bold text-white text-sm truncate">
                Trailer: {movie.title}
              </h4>
              <button
                onClick={() => setTrailerModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-full hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="aspect-video w-full">
              <iframe
                src={
                  movie.trailerUrl.includes('watch?v=')
                    ? movie.trailerUrl.replace('watch?v=', 'embed/')
                    : movie.trailerUrl
                }
                title={movie.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full border-0"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
