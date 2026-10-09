import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { Navbar } from './components/common/Navbar';
import { Footer } from './components/common/Footer';
import { AuthModal } from './components/common/AuthModal';
import { ScrollToTop } from './components/common/ScrollToTop';

// Critical Landing Page (Eagerly loaded for fastest First Contentful Paint)
import { HomePage } from './pages/customer/HomePage';

// Lazy Loaded Customer Pages
const MoviesPage = lazy(() => import('./pages/customer/MoviesPage').then(m => ({ default: m.MoviesPage })));
const MovieDetailPage = lazy(() => import('./pages/customer/MovieDetailPage').then(m => ({ default: m.MovieDetailPage })));
const BookingPage = lazy(() => import('./pages/customer/BookingPage').then(m => ({ default: m.BookingPage })));
const MyTicketsPage = lazy(() => import('./pages/customer/MyTicketsPage').then(m => ({ default: m.MyTicketsPage })));
const ProfilePage = lazy(() => import('./pages/customer/ProfilePage').then(m => ({ default: m.ProfilePage })));
const VerifyTicketPage = lazy(() => import('./pages/customer/VerifyTicketPage').then(m => ({ default: m.VerifyTicketPage })));
const PaymentCallbackPage = lazy(() => import('./pages/customer/PaymentCallbackPage').then(m => ({ default: m.PaymentCallbackPage })));

// Lazy Loaded Admin Pages (Recharts & Management components loaded only on demand)
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout').then(m => ({ default: m.AdminLayout })));
const DashboardPage = lazy(() => import('./pages/admin/DashboardPage').then(m => ({ default: m.DashboardPage })));
const MovieManagePage = lazy(() => import('./pages/admin/MovieManagePage').then(m => ({ default: m.MovieManagePage })));
const CinemaManagePage = lazy(() => import('./pages/admin/CinemaManagePage').then(m => ({ default: m.CinemaManagePage })));
const ShowtimeManagePage = lazy(() => import('./pages/admin/ShowtimeManagePage').then(m => ({ default: m.ShowtimeManagePage })));
const BookingManagePage = lazy(() => import('./pages/admin/BookingManagePage').then(m => ({ default: m.BookingManagePage })));
const UserManagePage = lazy(() => import('./pages/admin/UserManagePage').then(m => ({ default: m.UserManagePage })));

// Lightweight Loading Spinner Fallback for Lazy Routes
const RouteLoadingFallback: React.FC = () => (
  <div className="min-h-[60vh] flex items-center justify-center">
    <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
  </div>
);

// Customer Layout Wrapper
const CustomerLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="flex flex-col min-h-screen">
    <Navbar />
    <div className="flex-1">{children}</div>
    <Footer />
  </div>
);

export function App() {
  return (
    <AuthProvider>
      <Router>
        <ScrollToTop />
        <Suspense fallback={<RouteLoadingFallback />}>
          <Routes>
          {/* Customer Routes */}
          <Route
            path="/"
            element={
              <CustomerLayout>
                <HomePage />
              </CustomerLayout>
            }
          />
          <Route
            path="/movies"
            element={
              <CustomerLayout>
                <MoviesPage />
              </CustomerLayout>
            }
          />
          <Route
            path="/movies/:idOrSlug"
            element={
              <CustomerLayout>
                <MovieDetailPage />
              </CustomerLayout>
            }
          />
          <Route
            path="/booking/:showtimeId"
            element={
              <CustomerLayout>
                <BookingPage />
              </CustomerLayout>
            }
          />
          <Route
            path="/my-tickets"
            element={
              <CustomerLayout>
                <MyTicketsPage />
              </CustomerLayout>
            }
          />
          <Route
            path="/profile"
            element={
              <CustomerLayout>
                <ProfilePage />
              </CustomerLayout>
            }
          />
          <Route
            path="/verify-ticket"
            element={
              <CustomerLayout>
                <VerifyTicketPage />
              </CustomerLayout>
            }
          />
          <Route
            path="/payment/callback"
            element={
              <CustomerLayout>
                <PaymentCallbackPage />
              </CustomerLayout>
            }
          />

          {/* Admin Routes */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="movies" element={<MovieManagePage />} />
            <Route path="cinemas" element={<CinemaManagePage />} />
            <Route path="showtimes" element={<ShowtimeManagePage />} />
            <Route path="bookings" element={<BookingManagePage />} />
            <Route path="users" element={<UserManagePage />} />
          </Route>
        </Routes>
        </Suspense>

        {/* Global Auth Modal */}
        <AuthModal />
      </Router>
    </AuthProvider>
  );
}

export default App;
