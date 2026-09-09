import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Play, Clock, Ticket } from 'lucide-react';
import { Movie } from '../../types';

interface MovieCardProps {
  movie: Movie;
  onWatchTrailer?: (trailerUrl: string, title: string) => void;
}

export const MovieCard: React.FC<MovieCardProps> = ({ movie, onWatchTrailer }) => {
  const [imgError, setImgError] = useState(false);

  const getAgeRatingBadge = (rating: string) => {
    switch (rating) {
      case 'P':
        return { text: 'P - Mọi lứa tuổi', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' };
      case 'K':
        return { text: 'K - Dưới 13 có phụ huynh', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' };
      case 'T13':
        return { text: '13+ Khán giả trên 13 tuổi', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' };
      case 'T16':
        return { text: '16+ Khán giả trên 16 tuổi', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' };
      case 'T18':
        return { text: '18+ Khán giả trên 18 tuổi', color: 'bg-rose-500/20 text-rose-400 border-rose-500/30' };
      default:
        return { text: rating, color: 'bg-gray-500/20 text-gray-400 border-gray-500/30' };
    }
  };

  const badge = getAgeRatingBadge(movie.ageRating);
  const detailUrl = `/movies/${movie.slug || movie.id}`;

  return (
    <Link
      to={detailUrl}
      className="group relative bg-white rounded-2xl overflow-hidden border border-slate-200 hover:border-emerald-500/60 transition-all duration-300 hover:shadow-xl hover:shadow-emerald-950/5 flex flex-col shadow-sm cursor-pointer block text-left"
    >
      {/* Poster Image Container - height increased by 1/5 (aspect-[5/6]) */}
      <div className="relative aspect-[5/6] w-full overflow-hidden bg-slate-100">
        <img
          src={imgError ? 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500&q=80' : movie.posterUrl}
          alt={movie.title}
          onError={() => setImgError(true)}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {/* Age Rating Tag */}
        <div className="absolute top-2 left-2">
          <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-bold border backdrop-blur-md ${badge.color}`}>
            {movie.ageRating}
          </span>
        </div>

        {/* Duration Tag */}
        <div className="absolute top-2 right-2 bg-slate-900/70 backdrop-blur-md px-2 py-0.5 rounded-md text-[10px] font-semibold text-slate-100 flex items-center gap-1 border border-white/10 shadow">
          <Clock className="w-2.5 h-2.5 text-emerald-400" />
          <span>{movie.durationMinutes}p</span>
        </div>

        {/* Hover Overlay with Trailer & Quick Action */}
        <div className="absolute inset-0 bg-slate-950/70 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center gap-2.5 p-3 backdrop-blur-[2px]">
          {movie.trailerUrl && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (onWatchTrailer) {
                  onWatchTrailer(movie.trailerUrl!, movie.title);
                }
              }}
              className="w-10 h-10 rounded-full bg-white/20 hover:bg-emerald-600 border border-white/40 flex items-center justify-center text-white transition-all transform hover:scale-110 shadow-lg"
              title="Xem Trailer"
            >
              <Play className="w-4 h-4 fill-white ml-0.5" />
            </button>
          )}

          <span className="w-full max-w-[140px] py-2 px-3 rounded-lg bg-emerald-600 group-hover:bg-emerald-500 text-white text-[11px] font-bold text-center shadow-lg shadow-emerald-600/40 flex items-center justify-center gap-1 transition">
            <Ticket className="w-3.5 h-3.5" />
            {movie.status === 'NOW_SHOWING' ? 'MUA VÉ' : 'CHI TIẾT'}
          </span>
        </div>
      </div>

      {/* Movie Details */}
      <div className="p-3.5 flex-1 flex flex-col justify-between">
        <div>
          <p className="text-[10px] font-bold text-emerald-600 mb-0.5 truncate uppercase tracking-wider">
            {movie.genre}
          </p>
          <h4
            className="font-bold text-slate-900 text-xs sm:text-sm leading-snug line-clamp-1 group-hover:text-emerald-600 transition"
            title={movie.title}
          >
            {movie.title}
          </h4>
        </div>

        <div className="mt-2.5 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          <span className="text-[10px] font-medium">
            {movie.status === 'NOW_SHOWING' ? '🔥 Đang chiếu' : '📅 Sắp chiếu'}
          </span>
          <span className="text-emerald-600 group-hover:text-emerald-700 font-bold text-[11px] flex items-center gap-0.5">
            Chi tiết &rarr;
          </span>
        </div>
      </div>
    </Link>
  );
};

