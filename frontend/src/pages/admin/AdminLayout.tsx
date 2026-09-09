import React, { useState, useEffect, useRef } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Clapperboard, CalendarDays, 
  Ticket, Users, ArrowLeft, LogOut, ShieldCheck, Building2,
  PanelLeftOpen, PanelLeftClose, ChevronUp, Film
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export const AdminLayout: React.FC = () => {
  const { user, isAdmin, logout } = useAuth();
  const location = useLocation();

  // Sidebar collapse state, persisted in localStorage
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    const saved = localStorage.getItem('admin_sidebar_collapsed');
    return saved === 'true';
  });

  // User Dropdown open/close state
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const userDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem('admin_sidebar_collapsed', String(isCollapsed));
  }, [isCollapsed]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
        setIsUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close dropdown on route change
  useEffect(() => {
    setIsUserDropdownOpen(false);
  }, [location.pathname]);

  // Redirect non-admins
  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-800 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white p-8 rounded-3xl border border-slate-200 shadow-xl text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto shadow-sm">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-black text-slate-900">YÊU CẦU QUYỀN ADMIN</h2>
          <p className="text-xs text-slate-500">
            Bạn cần đăng nhập bằng tài khoản Quản trị viên (admin@cineplex.vn) để truy cập trang này.
          </p>
          <Link
            to="/"
            className="inline-block py-2.5 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/30"
          >
            Về Trang Chủ
          </Link>
        </div>
      </div>
    );
  }

  const menuItems = [
    { label: 'Tổng Quan & Báo Cáo', path: '/admin', icon: LayoutDashboard },
    { label: 'Quản Lý Phim', path: '/admin/movies', icon: Clapperboard },
    { label: 'Quản Lý Rạp & Phòng', path: '/admin/cinemas', icon: Building2 },
    { label: 'Quản Lý Suất Chiếu', path: '/admin/showtimes', icon: CalendarDays },
    { label: 'Quản Lý Đặt Vé', path: '/admin/bookings', icon: Ticket },
    { label: 'Quản Lý Người Dùng', path: '/admin/users', icon: Users },
  ];

  const isActive = (path: string) => {
    if (path === '/admin') return location.pathname === '/admin';
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col md:flex-row">
      {/* Sidebar - Collapsible on Desktop */}
      <aside
        className={`w-full ${
          isCollapsed ? 'md:w-20' : 'md:w-64'
        } bg-white border-r border-slate-200 shrink-0 flex flex-col justify-between md:h-screen md:sticky md:top-0 shadow-sm z-30 transition-all duration-300 ease-in-out`}
      >
        <div className={`${isCollapsed ? 'p-3.5' : 'p-6'} overflow-y-auto flex-1 transition-all duration-300`}>
          {/* Top Logo & Toggle Area */}
          {isCollapsed ? (
            /* Collapsed State: Hovering over Cineplex logo reveals the expand icon */
            <button
              type="button"
              onClick={() => setIsCollapsed(false)}
              title="Mở rộng sidebar"
              className="relative group w-10 h-10 mx-auto mb-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-600/30 transition-all hover:scale-105 cursor-pointer"
            >
              {/* Default Cineplex Logo Icon */}
              <Film className="w-5 h-5 text-white transition-all duration-200 group-hover:opacity-0 group-hover:scale-75" />
              {/* Expand Sidebar Icon on Hover */}
              <PanelLeftOpen className="w-5 h-5 text-white absolute inset-0 m-auto opacity-0 scale-75 group-hover:opacity-100 group-hover:scale-100 transition-all duration-200" />
            </button>
          ) : (
            /* Expanded State: Brand Logo + Collapse Button */
            <div className="flex items-center justify-between gap-2 mb-8">
              <Link to="/" className="flex items-center gap-3 group min-w-0">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-600/30 shrink-0">
                  <Film className="w-5 h-5 text-white" />
                </div>
                <div className="truncate">
                  <span className="text-xl font-black tracking-wider text-slate-900 block truncate">
                    CINE<span className="text-emerald-600">PLEX</span>
                  </span>
                  <span className="block text-[9px] tracking-widest text-emerald-600 font-black -mt-0.5">
                    ADMIN CONSOLE
                  </span>
                </div>
              </Link>

              <button
                type="button"
                onClick={() => setIsCollapsed(true)}
                title="Thu gọn sidebar"
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition border border-transparent hover:border-slate-200 shrink-0"
              >
                <PanelLeftClose className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Navigation Links */}
          <nav className="space-y-1.5 text-xs">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  title={isCollapsed ? item.label : undefined}
                  className={`flex items-center ${
                    isCollapsed ? 'justify-center px-0 py-3' : 'gap-3 px-4 py-3'
                  } rounded-2xl font-bold transition ${
                    active
                      ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {!isCollapsed && <span className="truncate">{item.label}</span>}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Info & Dropdown List - Fixed at Bottom of Sidebar */}
        <div ref={userDropdownRef} className="relative border-t border-slate-200 shrink-0 bg-white">
          {/* Dropdown Menu (Opens upwards) */}
          {isUserDropdownOpen && (
            <div
              className={`absolute bottom-full mb-2 bg-white border border-slate-200 rounded-2xl shadow-xl p-1.5 z-50 animate-fadeIn ${
                isCollapsed ? 'left-2 w-48' : 'left-3 right-3'
              }`}
            >
              {isCollapsed && (
                <div className="px-3 py-2 border-b border-slate-100 mb-1">
                  <p className="font-bold text-slate-900 text-xs truncate">{user.fullName}</p>
                  <p className="text-[10px] text-emerald-600 font-bold uppercase">Administrator</p>
                </div>
              )}

              <Link
                to="/"
                onClick={() => setIsUserDropdownOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-50 text-slate-700 text-xs font-bold transition group"
              >
                <div className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 group-hover:text-emerald-600 group-hover:bg-emerald-50 transition">
                  <ArrowLeft className="w-3.5 h-3.5" />
                </div>
                <span>Xem Web</span>
              </Link>

              <button
                type="button"
                onClick={() => {
                  setIsUserDropdownOpen(false);
                  logout();
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-rose-50 text-rose-600 text-xs font-bold transition group"
              >
                <div className="w-6 h-6 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600 group-hover:bg-rose-100 transition">
                  <LogOut className="w-3.5 h-3.5" />
                </div>
                <span>Thoát</span>
              </button>
            </div>
          )}

          {isCollapsed ? (
            /* Collapsed State: Centered User Avatar Logo Button */
            <div className="p-3.5 flex items-center justify-center">
              <button
                type="button"
                onClick={() => setIsUserDropdownOpen((prev) => !prev)}
                title={`Quản trị viên: ${user.fullName} (Click để mở menu)`}
                className={`w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center font-bold text-base shadow-xs hover:scale-105 hover:border-emerald-400 transition-all cursor-pointer ${
                  isUserDropdownOpen ? 'ring-2 ring-emerald-500/40 border-emerald-500' : ''
                }`}
              >
                👑
              </button>
            </div>
          ) : (
            /* Expanded State: Clickable User Bar (Logo or Name opens Dropdown) */
            <div className="p-3">
              <button
                type="button"
                onClick={() => setIsUserDropdownOpen((prev) => !prev)}
                className={`w-full flex items-center justify-between p-2 rounded-2xl hover:bg-slate-50 transition group text-left cursor-pointer ${
                  isUserDropdownOpen ? 'bg-slate-100' : ''
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center font-bold text-base shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                    👑
                  </div>
                  <div className="truncate">
                    <p className="font-bold text-slate-900 text-xs truncate group-hover:text-emerald-700 transition-colors">
                      {user.fullName}
                    </p>
                    <p className="text-[10px] text-emerald-600 font-bold uppercase">Administrator</p>
                  </div>
                </div>

                <ChevronUp
                  className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ml-1 ${
                    isUserDropdownOpen ? 'rotate-180 text-emerald-600' : ''
                  }`}
                />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main Admin Content Area */}
      <main className="flex-1 p-5 sm:p-6 lg:p-[30px] min-w-0 w-full">
        <Outlet />
      </main>
    </div>
  );
};
