import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';

/**
 * Route guard component that blocks unauthenticated visitors.
 * Redirects to /login and preserves the intended destination in route state.
 */
export default function ProtectedRoute({ children, adminOnly = false }) {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <LoadingSpinner text="Verifying analyst authorization..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    const returnPath = `${location.pathname}${location.search}`;
    return <Navigate to="/login" state={{ from: returnPath }} replace />;
  }

  if (adminOnly && !isAdmin) {
    // Non-admin attempting to access restricted admin area (Dashboard / Logs / History)
    return <Navigate to="/integrated-lookup" replace />;
  }

  return children;
}
