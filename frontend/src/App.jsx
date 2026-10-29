import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';

import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import LoadingSpinner from './components/LoadingSpinner';

import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Footer from './components/Footer';

import Dashboard from './pages/Dashboard';
import IntegratedLookup from './pages/IntegratedLookup';
import History from './pages/History';
import About from './pages/About';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Profile from './pages/Profile';
import ApiDocs from './pages/ApiDocs';

function AppContent() {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  const [isSidebarHidden, setIsSidebarHidden] = useState(() => {
    try {
      return localStorage.getItem('sidebar_hidden') === 'true';
    } catch {
      return false;
    }
  });
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const location = useLocation();

  // Close mobile nav drawer and scroll to top on route change
  useEffect(() => {
    setIsMobileNavOpen(false);
    window.scrollTo(0, 0);
  }, [location.pathname, location.search]);

  // Lock body scroll on mobile when drawer is open
  useEffect(() => {
    if (isMobileNavOpen && window.innerWidth <= 900) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileNavOpen]);

  // Handle window resize and escape key
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 900 && isMobileNavOpen) {
        setIsMobileNavOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isMobileNavOpen) {
        setIsMobileNavOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMobileNavOpen]);

  const handleToggleSidebar = () => {
    if (window.innerWidth <= 900) {
      setIsMobileNavOpen(prev => !prev);
    } else {
      setIsSidebarHidden(prev => {
        const next = !prev;
        try {
          localStorage.setItem('sidebar_hidden', String(next));
        } catch (e) {}
        return next;
      });
    }
  };

  // If session is being initialized, show centered loader
  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#f8fafc' }}>
        <LoadingSpinner text="Initializing Security Operations Center..." />
      </div>
    );
  }

  return (
    <div className={`app-layout ${isSidebarHidden || !isAuthenticated ? 'sidebar-hidden' : ''} ${!isAuthenticated ? 'auth-layout-mode' : ''}`}>
      {/* Sidebar is exclusively rendered for authenticated analysts */}
      {isAuthenticated && (
        <Sidebar
          isHidden={isSidebarHidden}
          onToggle={handleToggleSidebar}
          isOpen={isMobileNavOpen}
          onClose={() => setIsMobileNavOpen(false)}
        />
      )}

      <div className="main-wrapper">
        <Navbar
          onToggleSidebar={handleToggleSidebar}
          isSidebarHidden={isSidebarHidden}
          isSidebarOpen={isMobileNavOpen}
        />

        <main className="content-container">
          <Routes>
            {/* Primary Entrance: Unauthenticated -> Login; Admin -> Dashboard; Regular Analyst -> Integrated Lookup */}
            <Route
              path="/"
              element={
                isAuthenticated ? (
                  <Navigate to={isAdmin ? "/dashboard" : "/integrated-lookup"} replace />
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />

            {/* Public Authentication Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />

            {/* STRICTLY ADMIN-ONLY ROUTES: Dashboard & Investigation Logs */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute adminOnly>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/logs"
              element={
                <ProtectedRoute adminOnly>
                  <Navigate to="/dashboard?tab=logs" replace />
                </ProtectedRoute>
              }
            />
            <Route
              path="/history"
              element={
                <ProtectedRoute adminOnly>
                  <History />
                </ProtectedRoute>
              }
            />

            {/* WORKSPACE MODULES: Accessible to all authenticated users */}
            <Route
              path="/integrated-lookup"
              element={
                <ProtectedRoute>
                  <IntegratedLookup />
                </ProtectedRoute>
              }
            />

            {/* Protected Legacy Route Shortcuts */}
            <Route
              path="/dns"
              element={
                <ProtectedRoute>
                  <Navigate to="/integrated-lookup?type=dns" replace />
                </ProtectedRoute>
              }
            />
            <Route
              path="/ip"
              element={
                <ProtectedRoute>
                  <Navigate to="/integrated-lookup?type=ip" replace />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reverse-dns"
              element={
                <ProtectedRoute>
                  <Navigate to="/integrated-lookup?type=reverse-dns" replace />
                </ProtectedRoute>
              }
            />
            <Route
              path="/email"
              element={
                <ProtectedRoute>
                  <Navigate to="/integrated-lookup?type=email" replace />
                </ProtectedRoute>
              }
            />
            <Route
              path="/whois"
              element={
                <ProtectedRoute>
                  <Navigate to="/integrated-lookup?type=whois" replace />
                </ProtectedRoute>
              }
            />
            <Route
              path="/name"
              element={
                <ProtectedRoute>
                  <Navigate to="/integrated-lookup?type=name" replace />
                </ProtectedRoute>
              }
            />

            {/* Protected Analyst Profile & Documentation */}
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/api-docs"
              element={
                <ProtectedRoute>
                  <ApiDocs />
                </ProtectedRoute>
              }
            />
            <Route
              path="/docs"
              element={
                <ProtectedRoute>
                  <ApiDocs />
                </ProtectedRoute>
              }
            />
            <Route
              path="/about"
              element={
                <ProtectedRoute>
                  <About />
                </ProtectedRoute>
              }
            />

            {/* Catch-all route: sends unauthenticated users to /login, admin to /dashboard, non-admin to /integrated-lookup */}
            <Route
              path="*"
              element={
                isAuthenticated ? (
                  <Navigate to={isAdmin ? "/dashboard" : "/integrated-lookup"} replace />
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />
          </Routes>
        </main>

        <Footer />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}
