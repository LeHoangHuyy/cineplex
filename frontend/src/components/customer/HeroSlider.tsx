import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Ticket, Play, ChevronLeft, ChevronRight } from 'lucide-react';
import { Movie } from '../../types';

interface HeroSliderProps {
  movies: Movie[];
  onWatchTrailer?: (url: string, title: string) => void;
  autoSlideInterval?: number;
}

export const HeroSlider: React.FC<HeroSliderProps> = ({
  movies,
  onWatchTrailer,
  autoSlideInterval = 5000,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  // Pick top 6 featured blockbuster movies
  const featuredMovies = movies.slice(0, 6);
  const totalSlides = featuredMovies.length;

  const handleNext = useCallback(() => {
    if (totalSlides === 0) return;
    setCurrentIndex((prev) => (prev + 1) % totalSlides);
  }, [totalSlides]);

  const handlePrev = useCallback(() => {
    if (totalSlides === 0) return;
    setCurrentIndex((prev) => (prev - 1 + totalSlides) % totalSlides);
  }, [totalSlides]);

  useEffect(() => {
    if (isHovered || totalSlides <= 1) return;
    const timer = setInterval(() => {
      handleNext();
    }, autoSlideInterval);
    return () => clearInterval(timer);
  }, [isHovered, totalSlides, autoSlideInterval, handleNext]);

  if (totalSlides === 0) return null;

  const currentMovie = featuredMovies[currentIndex];

  return (
    <section
      className="relative w-full h-[520px] sm:h-[620px] overflow-hidden group/hero select-none bg-slate-950"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Background Images with Fade Transition */}
      {featuredMovies.map((movie, index) => {
        const isActive = index === currentIndex;
        return (
          <div
            key={movie.id}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              isActive ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
            }`}
          >
            <img
              src={movie.bannerUrl || movie.posterUrl}
              alt={movie.title}
              className={`w-full h-full object-cover object-top transform transition-transform duration-7000 ease-out ${
                isActive ? 'scale-105' : 'scale-100'
              }`}
            />
          </div>
        );
      })}

      {/* Floating Prev Button - Default Gray, Turns Green on Hover */}
      <button
        onClick={handlePrev}
        className="absolute left-2 sm:left-6 top-1/2 -translate-y-1/2 z-30 bg-transparent border-0 text-slate-400 hover:text-emerald-400 p-1 flex items-center justify-center opacity-100 sm:opacity-0 sm:group-hover/hero:opacity-100 sm:-translate-x-3 sm:group-hover/hero:translate-x-0 transition-all duration-300 transform hover:scale-125 active:scale-95 cursor-pointer outline-none drop-shadow-[0_2px_12px_rgba(0,0,0,0.6)]"
        title="Banner trước"
      >
        <ChevronLeft className="w-10 h-10 sm:w-14 sm:h-14 stroke-[3]" />
      </button>

      {/* Floating Next Button - Default Gray, Turns Green on Hover */}
      <button
        onClick={handleNext}
        className="absolute right-2 sm:right-6 top-1/2 -translate-y-1/2 z-30 bg-transparent border-0 text-slate-400 hover:text-emerald-400 p-1 flex items-center justify-center opacity-100 sm:opacity-0 sm:group-hover/hero:opacity-100 sm:translate-x-3 sm:group-hover/hero:translate-x-0 transition-all duration-300 transform hover:scale-125 active:scale-95 cursor-pointer outline-none drop-shadow-[0_2px_12px_rgba(0,0,0,0.6)]"
        title="Banner tiếp theo"
      >
        <ChevronRight className="w-10 h-10 sm:w-14 sm:h-14 stroke-[3]" />
      </button>

      {/* Content Info Container */}
      <div className="relative max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex items-end pb-16 z-20">
        <div className="max-w-2xl space-y-4 animate-fadeIn" key={currentMovie.id}>
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/80 border border-emerald-500/50 text-emerald-400 text-xs font-bold backdrop-blur-md shadow-lg shadow-black/50">
            <Sparkles className="w-3.5 h-3.5" />
            <span>PHIM BOM TẤN NỔI BẬT</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-white leading-tight tracking-tight [text-shadow:_0_2px_6px_rgba(0,0,0,0.95),_0_4px_16px_rgba(0,0,0,0.9),_0_8px_32px_rgba(0,0,0,0.85)] drop-shadow-[0_4px_16px_rgba(0,0,0,0.95)]">
            {currentMovie.title}
          </h1>

          <div className="flex items-center gap-3 text-xs sm:text-sm text-white font-medium [text-shadow:_0_1px_4px_rgba(0,0,0,0.95),_0_3px_10px_rgba(0,0,0,0.9)] drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
            <span className="px-2.5 py-0.5 rounded bg-emerald-600 text-white font-bold text-xs shadow-md shadow-black/40">
              {currentMovie.ageRating}
            </span>
            <span className="font-semibold">{currentMovie.genre}</span>
            <span>•</span>
            <span>{currentMovie.durationMinutes} phút</span>
          </div>

          <p className="text-xs sm:text-sm text-white font-medium line-clamp-3 leading-relaxed [text-shadow:_0_1px_4px_rgba(0,0,0,0.95),_0_3px_10px_rgba(0,0,0,0.9)] drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
            {currentMovie.description}
          </p>

          <div className="flex items-center gap-4 pt-2">
            <Link
              to={`/movies/${currentMovie.slug || currentMovie.id}`}
              className="py-3.5 px-7 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-xl shadow-emerald-600/40 hover:scale-105 transition flex items-center gap-2"
            >
              <Ticket className="w-4 h-4" />
              <span>ĐẶT VÉ NGAY</span>
            </Link>

            {currentMovie.trailerUrl && (
              <button
                type="button"
                onClick={() => onWatchTrailer && onWatchTrailer(currentMovie.trailerUrl!, currentMovie.title)}
                className="py-3.5 px-6 rounded-full bg-slate-900/70 hover:bg-slate-900/90 border border-white/30 text-white font-bold text-sm backdrop-blur-md transition flex items-center gap-2 shadow-xl shadow-black/50"
              >
                <Play className="w-4 h-4 text-emerald-400 fill-emerald-400" />
                <span>Xem Trailer</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Slide Indicator Dots */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2">
        {featuredMovies.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            className={`transition-all duration-300 rounded-full ${
              idx === currentIndex
                ? 'w-8 h-2 bg-emerald-500 shadow-md shadow-emerald-500/50'
                : 'w-2 h-2 bg-white/40 hover:bg-white/70'
            }`}
            title={`Slide ${idx + 1}`}
          />
        ))}
      </div>
    </section>
  );
};
