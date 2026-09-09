import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Film, Ticket, Shield, LogOut, Menu, X, ChevronDown } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export const Navbar: React.FC = () => {
  const { user, isAdmin, logout, openAuthModal } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMovieDropdownOpen, setIsMovieDropdownOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-[60px]">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-md shadow-emerald-600/30 group-hover:scale-105 transition-transform">
              <Film className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-lg font-black tracking-wider text-slate-900 leading-none block">
                CINE<span className="text-emerald-600">PLEX</span>
              </span>
              <span className="block text-[8px] tracking-widest text-slate-400 font-bold leading-none mt-0.5">
                PREMIUM CINEMA
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <Link
              to="/"
              className={`text-xs sm:text-sm font-bold transition-colors hover:text-emerald-600 ${
                isActive('/') ? 'text-emerald-600' : 'text-slate-600'
              }`}
            >
              Trang Chủ
            </Link>

            {/* Dropdown Phim (Hover/Click only, no direct page navigation) */}
            <div
              className="relative"
              onMouseEnter={() => setIsMovieDropdownOpen(true)}
              onMouseLeave={() => setIsMovieDropdownOpen(false)}
            >
              <button
                type="button"
                onClick={() => setIsMovieDropdownOpen((prev) => !prev)}
                className={`text-xs sm:text-sm font-bold transition-colors hover:text-emerald-600 flex items-center gap-1 py-2 ${
                  isMovieDropdownOpen ? 'text-emerald-600' : 'text-slate-600'
                }`}
              >
                <span>Phim</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                    isMovieDropdownOpen ? 'rotate-180 text-emerald-600' : ''
                  }`}
                />
              </button>

              {isMovieDropdownOpen && (
                <div className="absolute top-full left-0 w-52 bg-white border border-slate-200 rounded-2xl shadow-xl py-2 z-50 animate-fadeIn">
                  <Link
                    to="/movies?status=NOW_SHOWING"
                    onClick={() => setIsMovieDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 transition"
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>🔥 Phim Đang Chiếu</span>
                  </Link>
                  <Link
                    to="/movies?status=COMING_SOON"
                    onClick={() => setIsMovieDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 transition"
                  >
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    <span>📅 Phim Sắp Chiếu</span>
                  </Link>
                </div>
              )}
            </div>

            <Link
              to="/my-tickets"
              className={`text-xs sm:text-sm font-bold transition-colors hover:text-emerald-600 flex items-center gap-1.5 ${
                isActive('/my-tickets') ? 'text-emerald-600' : 'text-slate-600'
              }`}
            >
              <Ticket className="w-3.5 h-3.5 text-emerald-600" />
              Vé Của Tôi
            </Link>
            {isAdmin && (
              <Link
                to="/verify-ticket"
                className={`text-xs sm:text-sm font-bold transition-colors hover:text-emerald-600 ${
                  isActive('/verify-ticket') ? 'text-emerald-600' : 'text-slate-600'
                }`}
              >
                Kiểm Tra Vé
              </Link>
            )}
          </nav>

          {/* User Auth Section */}
          <div className="hidden md:flex items-center gap-3">
            {isAdmin && (
              <Link
                to="/admin"
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-300 text-amber-700 text-[11px] font-bold hover:bg-amber-100 transition"
              >
                <Shield className="w-3 h-3 text-amber-600" />
                Admin Portal
              </Link>
            )}

            {user ? (
              <div className="flex items-center gap-2.5">
                <Link
                  to="/profile"
                  className="flex items-center gap-2 p-1 pr-2.5 rounded-full bg-slate-100 border border-slate-200 hover:border-slate-300 transition"
                >
                  <div className="w-7 h-7 rounded-full bg-emerald-600 flex items-center justify-center font-bold text-xs text-white shadow">
                    {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <span className="text-xs font-semibold text-slate-700 max-w-[110px] truncate">
                    {user.fullName}
                  </span>
                </Link>
                <button
                  onClick={logout}
                  title="Đăng xuất"
                  className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-slate-100 rounded-full transition"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openAuthModal('login')}
                  className="text-xs sm:text-sm font-bold text-slate-600 hover:text-emerald-600 px-2.5 py-1.5 transition"
                >
                  Đăng Nhập
                </button>
                <button
                  onClick={() => openAuthModal('register')}
                  className="text-xs sm:text-sm font-bold bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-1.5 rounded-full shadow-md shadow-emerald-600/25 hover:scale-105 transition"
                >
                  Đăng Ký
                </button>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-2 shadow-lg animate-fadeIn">
          <Link
            to="/"
            onClick={() => setIsMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-md text-base font-semibold text-slate-700 hover:bg-slate-100 hover:text-emerald-600"
          >
            Trang Chủ
          </Link>

          <div className="space-y-1">
            <div className="px-3 py-2 text-base font-bold text-slate-800">
              Phim
            </div>
            <div className="pl-4 space-y-1">
              <Link
                to="/movies?status=NOW_SHOWING"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block px-3 py-1.5 rounded-md text-sm font-semibold text-slate-600 hover:bg-emerald-50 hover:text-emerald-600"
              >
                🔥 Phim Đang Chiếu
              </Link>
              <Link
                to="/movies?status=COMING_SOON"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block px-3 py-1.5 rounded-md text-sm font-semibold text-slate-600 hover:bg-emerald-50 hover:text-emerald-600"
              >
                📅 Phim Sắp Chiếu
              </Link>
            </div>
          </div>

          <Link
            to="/my-tickets"
            onClick={() => setIsMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-md text-base font-semibold text-slate-700 hover:bg-slate-100 hover:text-emerald-600"
          >
            Vé Của Tôi
          </Link>
          {isAdmin && (
            <Link
              to="/verify-ticket"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-md text-base font-semibold text-slate-700 hover:bg-slate-100 hover:text-emerald-600"
            >
              Kiểm Tra Vé
            </Link>
          )}

          {isAdmin && (
            <Link
              to="/admin"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-md text-base font-bold text-amber-700 bg-amber-50 hover:bg-amber-100"
            >
              Admin Dashboard
            </Link>
          )}

          <div className="pt-4 border-t border-slate-200">
            {user ? (
              <div className="space-y-2">
                <div className="px-3 py-2 text-sm text-slate-500">
                  Đăng nhập: <strong className="text-slate-800">{user.fullName}</strong>
                </div>
                <Link
                  to="/profile"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-md text-sm text-slate-700 hover:bg-slate-100"
                >
                  Tài khoản của tôi
                </Link>
                <button
                  onClick={() => {
                    logout();
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-md text-sm text-emerald-600 hover:bg-emerald-50 font-semibold"
                >
                  Đăng xuất
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    openAuthModal('login');
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full py-2 text-center rounded-lg bg-slate-100 text-slate-800 font-bold border border-slate-200"
                >
                  Đăng Nhập
                </button>
                <button
                  onClick={() => {
                    openAuthModal('register');
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full py-2 text-center rounded-lg bg-emerald-600 text-white font-bold shadow-md shadow-emerald-600/30"
                >
                  Đăng Ký
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

