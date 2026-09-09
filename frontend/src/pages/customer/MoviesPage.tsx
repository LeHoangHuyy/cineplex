import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Film, Flame, Calendar, X, Play, ChevronLeft, ChevronRight } from 'lucide-react';
import { Movie, MovieStatus } from '../../types';
import { movieApi } from '../../api';
import { MovieCard } from '../../components/customer/MovieCard';

export const MoviesPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const ITEMS_PER_PAGE = 15;

  const urlStatus = searchParams.get('status') || 'ALL';
  const [selectedStatus, setSelectedStatus] = useState<string>(urlStatus);

  const [trailerModal, setTrailerModal] = useState<{ isOpen: boolean; url: string; title: string }>({
    isOpen: false,
    url: '',
    title: '',
  });

  const fetchMovies = async (statusFilter: string, page: number) => {
    setLoading(true);
    try {
      const apiStatus = statusFilter === 'ALL' ? undefined : statusFilter;
      const res = await movieApi.getAll(apiStatus, undefined, page - 1, ITEMS_PER_PAGE);
      setMovies(res.data.content || []);
      setTotalPages(res.data.totalPages || 1);
      setTotalElements(res.data.totalElements || 0);
    } catch (err) {
      console.error('Error fetching movies:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const st = searchParams.get('status') || 'ALL';
    setSelectedStatus(st);
    setCurrentPage(1);
    fetchMovies(st, 1);
  }, [searchParams]);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    fetchMovies(selectedStatus, newPage);
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  };

  const handleWatchTrailer = (trailerUrl: string, title: string) => {
    let embedUrl = trailerUrl;
    if (trailerUrl.includes('watch?v=')) {
      embedUrl = trailerUrl.replace('watch?v=', 'embed/');
    }
    setTrailerModal({ isOpen: true, url: embedUrl, title });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Title Header (Matching Homepage Slider style) */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-3.5">
          <div className="flex items-center gap-3">
            {selectedStatus === 'NOW_SHOWING' ? (
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500">
                <Flame className="w-4 h-4" />
              </div>
            ) : selectedStatus === 'COMING_SOON' ? (
              <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-500">
                <Calendar className="w-4 h-4" />
              </div>
            ) : (
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-500">
                <Film className="w-4 h-4" />
              </div>
            )}

            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {selectedStatus === 'NOW_SHOWING'
                  ? 'PHIM ĐANG CHIẾU'
                  : selectedStatus === 'COMING_SOON'
                  ? 'PHIM SẮP CHIẾU'
                  : 'TẤT CẢ PHIM'}
              </h1>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold">
                {selectedStatus === 'NOW_SHOWING'
                  ? 'HOT'
                  : selectedStatus === 'COMING_SOON'
                  ? 'COMING SOON'
                  : `${totalElements} PHIM`}
              </span>
            </div>
          </div>
        </div>

        {/* Movie Grid: 5 items per row */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-5">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
              <div key={i} className="aspect-[5/6] bg-slate-200 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : movies.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-3">
            <Film className="w-12 h-12 text-slate-400 mx-auto" />
            <h4 className="text-lg font-bold text-slate-800">Không có phim trong danh mục này</h4>
            <p className="text-xs text-slate-500">
              Vui lòng chọn danh mục phim khác để xem lịch chiếu.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-5">
            {movies.map((movie) => (
              <MovieCard
                key={movie.id}
                movie={movie}
                onWatchTrailer={handleWatchTrailer}
              />
            ))}
          </div>
        )}

        {/* Pagination: 15 items per page */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-6">
            <button
              onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white transition shadow-sm"
              title="Trang trước"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
              <button
                key={pageNum}
                onClick={() => handlePageChange(pageNum)}
                className={`w-9 h-9 rounded-xl text-xs font-bold transition shadow-sm ${
                  currentPage === pageNum
                    ? 'bg-emerald-600 text-white shadow-emerald-600/30'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                {pageNum}
              </button>
            ))}

            <button
              onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white transition shadow-sm"
              title="Trang sau"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Trailer Video Modal */}
      {trailerModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="relative w-full max-w-4xl bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-700">
            <div className="flex items-center justify-between p-4 bg-slate-900 border-b border-slate-800">
              <h4 className="font-bold text-white text-sm truncate">
                Trailer: {trailerModal.title}
              </h4>
              <button
                onClick={() => setTrailerModal({ isOpen: false, url: '', title: '' })}
                className="p-1.5 text-slate-400 hover:text-white rounded-full hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="aspect-video w-full">
              <iframe
                src={trailerModal.url}
                title={trailerModal.title}
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

