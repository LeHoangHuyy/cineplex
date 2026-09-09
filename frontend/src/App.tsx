import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { Navbar } from './components/common/Navbar';
import { Footer } from './components/common/Footer';
import { AuthModal } from './components/common/AuthModal';
import { ScrollToTop } from './components/common/ScrollToTop';

// Customer Pages
import { HomePage } from './pages/customer/HomePage';
import { MoviesPage } from './pages/customer/MoviesPage';
import { MovieDetailPage } from './pages/customer/MovieDetailPage';
import { BookingPage } from './pages/customer/BookingPage';
import { MyTicketsPage } from './pages/customer/MyTicketsPage';
import { ProfilePage } from './pages/customer/ProfilePage';
import { VerifyTicketPage } from './pages/customer/VerifyTicketPage';

// Admin Pages
import { AdminLayout } from './pages/admin/AdminLayout';
import { DashboardPage } from './pages/admin/DashboardPage';
import { MovieManagePage } from './pages/admin/MovieManagePage';
import { CinemaManagePage } from './pages/admin/CinemaManagePage';
import { ShowtimeManagePage } from './pages/admin/ShowtimeManagePage';
import { BookingManagePage } from './pages/admin/BookingManagePage';
import { UserManagePage } from './pages/admin/UserManagePage';

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

        {/* Global Auth Modal */}
        <AuthModal />
      </Router>
    </AuthProvider>
  );
}

export default App;
