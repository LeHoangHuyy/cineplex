import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Film } from 'lucide-react';
import { Movie } from '../../types';
import { MovieCard } from './MovieCard';

interface MovieSliderProps {
  title: string;
  badge?: string;
  icon?: React.ReactNode;
  viewAllLink: string;
  movies: Movie[];
  loading?: boolean;
  onWatchTrailer?: (url: string, title: string) => void;
  autoSlideInterval?: number;
}

export const MovieSlider: React.FC<MovieSliderProps> = ({
  title,
  badge,
  icon,
  viewAllLink,
  movies,
  loading = false,
  onWatchTrailer,
  autoSlideInterval = 3200,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(true);
  const [visibleItems, setVisibleItems] = useState(5);
  const isAnimatingRef = useRef(false);

  // Determine number of visible items based on window width
  const updateVisibleItems = useCallback(() => {
    if (typeof window === 'undefined') return;
    const width = window.innerWidth;
    if (width < 640) {
      setVisibleItems(2);
    } else if (width < 768) {
      setVisibleItems(3);
    } else if (width < 1024) {
      setVisibleItems(4);
    } else {
      setVisibleItems(5);
    }
  }, []);

  useEffect(() => {
    updateVisibleItems();
    window.addEventListener('resize', updateVisibleItems);
    return () => window.removeEventListener('resize', updateVisibleItems);
  }, [updateVisibleItems]);

  const totalMovies = movies.length;

  // Slide forward by 1 item
  const handleNext = useCallback(() => {
    if (totalMovies <= visibleItems || isAnimatingRef.current) return;
    isAnimatingRef.current = true;
    setIsTransitioning(true);
    setCurrentIndex((prev) => prev + 1);
  }, [totalMovies, visibleItems]);

  // Slide backward by 1 item
  const handlePrev = useCallback(() => {
    if (totalMovies <= visibleItems || isAnimatingRef.current) return;
    isAnimatingRef.current = true;

    if (currentIndex === 0) {
      // Instantly jump to the end of original items without animation
      setIsTransitioning(false);
      setCurrentIndex(totalMovies);

      // On next tick, animate backward to totalMovies - 1
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsTransitioning(true);
          setCurrentIndex(totalMovies - 1);
        });
      });
    } else {
      setIsTransitioning(true);
      setCurrentIndex((prev) => prev - 1);
    }
  }, [totalMovies, visibleItems, currentIndex]);

  // Handle transition end for seamless infinite forward looping
  const handleTransitionEnd = () => {
    isAnimatingRef.current = false;
    if (currentIndex >= totalMovies) {
      // Smoothly reached the cloned duplicate, instantly reset to 0 with no transition
      setIsTransitioning(false);
      setCurrentIndex(0);
    }
  };

  // Auto-slide effect (step = 1, seamless forward loop)
  useEffect(() => {
    if (isHovered || loading || totalMovies <= visibleItems) return;

    const timer = setInterval(() => {
      handleNext();
    }, autoSlideInterval);

    return () => clearInterval(timer);
  }, [isHovered, loading, totalMovies, visibleItems, autoSlideInterval, handleNext]);

  // Clone items at the end to allow infinite forward animation
  const extendedMovies = totalMovies > 0 ? [...movies, ...movies.slice(0, visibleItems + 2)] : [];

  return (
    <section
      className="space-y-4"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Header with Title only */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3.5">
        <div className="flex items-center gap-3">
          {icon}
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {title}
              </h2>
              {badge && (
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold">
                  {badge}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Slider Carousel Container */}
      {loading ? (
        <div className="flex gap-4 overflow-hidden -mx-1 py-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="w-1/2 sm:w-1/3 md:w-1/4 lg:w-1/5 shrink-0 px-1.5"
            >
              <div className="aspect-[5/6] bg-slate-200 rounded-2xl animate-pulse" />
            </div>
          ))}
        </div>
      ) : totalMovies === 0 ? (
        <div className="text-center py-12 bg-white rounded-3xl border border-slate-200 shadow-sm">
          <Film className="w-10 h-10 text-slate-400 mx-auto mb-2" />
          <p className="text-slate-500 text-xs">Hiện chưa có phim nào trong danh mục này.</p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="relative group/slider overflow-hidden py-2 px-1">
            {/* Hover Animated Floating Prev Button - Transparent bg, 100% larger emerald icon */}
            <button
              onClick={handlePrev}
              className="absolute left-1 sm:left-2 top-1/2 -translate-y-1/2 z-20 bg-transparent border-0 text-emerald-500 hover:text-emerald-500 p-1 flex items-center justify-center opacity-100 sm:opacity-0 sm:group-hover/slider:opacity-100 sm:-translate-x-2 sm:group-hover/slider:translate-x-0 transition-all duration-300 transform hover:scale-125 active:scale-95 cursor-pointer outline-none drop-shadow-[0_2px_10px_rgba(0,0,0,0.3)]"
              title="Phim trước"
            >
              <ChevronLeft className="w-10 h-10 sm:w-12 sm:h-12 stroke-[3]" />
            </button>

            {/* Hover Animated Floating Next Button - Transparent bg, 100% larger emerald icon */}
            <button
              onClick={handleNext}
              className="absolute right-1 sm:right-2 top-1/2 -translate-y-1/2 z-20 bg-transparent border-0 text-emerald-500 hover:text-emerald-500 p-1 flex items-center justify-center opacity-100 sm:opacity-0 sm:group-hover/slider:opacity-100 sm:translate-x-2 sm:group-hover/slider:translate-x-0 transition-all duration-300 transform hover:scale-125 active:scale-95 cursor-pointer outline-none drop-shadow-[0_2px_10px_rgba(0,0,0,0.3)]"
              title="Phim tiếp theo"
            >
              <ChevronRight className="w-10 h-10 sm:w-12 sm:h-12 stroke-[3]" />
            </button>

            {/* Seamless Sliding Track with Step 1 */}
            <div
              className="flex -mx-2"
              style={{
                transform: `translateX(-${currentIndex * (100 / visibleItems)}%)`,
                transition: isTransitioning ? 'transform 600ms cubic-bezier(0.25, 1, 0.5, 1)' : 'none',
              }}
              onTransitionEnd={handleTransitionEnd}
            >
              {extendedMovies.map((movie, index) => (
                <div
                  key={`${movie.id}-${index}`}
                  style={{
                    width: `${100 / visibleItems}%`,
                    flex: `0 0 ${100 / visibleItems}%`,
                  }}
                  className="px-2 shrink-0"
                >
                  <MovieCard
                    movie={movie}
                    onWatchTrailer={onWatchTrailer}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Slide Indicator Dots */}
          {totalMovies > 1 && (
            <div className="flex items-center justify-center gap-1.5 pt-1 flex-wrap max-w-full overflow-hidden px-4">
              {movies.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setIsTransitioning(true);
                    setCurrentIndex(idx);
                  }}
                  className={`transition-all duration-300 rounded-full cursor-pointer ${
                    (currentIndex % totalMovies) === idx
                      ? 'w-6 sm:w-8 h-2 bg-emerald-600 shadow-sm shadow-emerald-600/40'
                      : 'w-2 h-2 bg-slate-300 hover:bg-slate-400'
                  }`}
                  title={`Phim ${idx + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
};

