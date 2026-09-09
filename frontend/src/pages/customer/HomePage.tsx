import React, { useState, useEffect } from 'react';
import { Flame, Calendar, X } from 'lucide-react';
import { Movie } from '../../types';
import { movieApi } from '../../api';
import { MovieSlider } from '../../components/customer/MovieSlider';
import { HeroSlider } from '../../components/customer/HeroSlider';

export const HomePage: React.FC = () => {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);

  // Trailer Modal
  const [trailerModal, setTrailerModal] = useState<{ isOpen: boolean; url: string; title: string }>({
    isOpen: false,
    url: '',
    title: '',
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const moviesRes = await movieApi.getAll(undefined, undefined, 0, 100);
        setMovies(moviesRes.data.content || (moviesRes.data as any));
      } catch (err) {
        console.error('Error fetching movies:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const nowShowingMovies = movies.filter((m) => m.status === 'NOW_SHOWING');
  const comingSoonMovies = movies.filter((m) => m.status === 'COMING_SOON');

  const handleWatchTrailer = (trailerUrl: string, title: string) => {
    let embedUrl = trailerUrl;
    if (trailerUrl.includes('watch?v=')) {
      embedUrl = trailerUrl.replace('watch?v=', 'embed/');
    }
    setTrailerModal({ isOpen: true, url: embedUrl, title });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-20">
      {/* Hero Banner Auto-sliding Carousel */}
      <HeroSlider
        movies={movies}
        onWatchTrailer={handleWatchTrailer}
        autoSlideInterval={4500}
      />

      {/* Main Content: 2 Auto-sliding Movie Carousels */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 space-y-16">
        {/* Top Slider: Phim Đang Chiếu */}
        <MovieSlider
          title="PHIM ĐANG CHIẾU"
          badge="HOT"
          icon={
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500">
              <Flame className="w-4 h-4" />
            </div>
          }
          viewAllLink="/movies?status=NOW_SHOWING"
          movies={nowShowingMovies}
          loading={loading}
          onWatchTrailer={handleWatchTrailer}
          autoSlideInterval={3800}
        />

        {/* Bottom Slider: Phim Sắp Chiếu */}
        <MovieSlider
          title="PHIM SẮP CHIẾU"
          badge="COMING SOON"
          icon={
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-500">
              <Calendar className="w-4 h-4" />
            </div>
          }
          viewAllLink="/movies?status=COMING_SOON"
          movies={comingSoonMovies}
          loading={loading}
          onWatchTrailer={handleWatchTrailer}
          autoSlideInterval={4200}
        />
      </main>

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

