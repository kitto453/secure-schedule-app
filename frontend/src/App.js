import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import AddEditSchedule from './pages/AddEditSchedule';
import ActivityLog from './pages/ActivityLog';

// Register service worker
function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('Service Worker registered:', registration.scope);

          // Check for updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  console.log('New service worker available. Refresh to update.');
                }
              });
            }
          });
        })
        .catch((err) => {
          console.error('Service Worker registration failed:', err);
        });
    });
  }
}

registerServiceWorker();

function App() {
  useEffect(() => {
    // Apply theme color to meta tag dynamically
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) {
      metaTheme.setAttribute('content', '#6366f1');
    }
  }, []);

  return (
    <BrowserRouter>
      <AuthProvider>
        <Navbar />
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected routes */}
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/schedules/new"
            element={
              <PrivateRoute>
                <AddEditSchedule />
              </PrivateRoute>
            }
          />
          <Route
            path="/schedules/:id/edit"
            element={
              <PrivateRoute>
                <AddEditSchedule />
              </PrivateRoute>
            }
          />
          <Route
            path="/activity"
            element={
              <PrivateRoute>
                <ActivityLog />
              </PrivateRoute>
            }
          />

          {/* Redirect root to dashboard */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {/* 404 catch-all */}
          <Route
            path="*"
            element={
              <div
                style={{
                  minHeight: '100vh',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'column',
                  gap: '1rem',
                  padding: '2rem',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: '4rem' }}>404</div>
                <h1 style={{ fontSize: '1.5rem', color: 'var(--gray-800)' }}>
                  Page not found
                </h1>
                <p style={{ color: 'var(--gray-500)', maxWidth: '400px' }}>
                  The page you're looking for doesn't exist or has been moved.
                </p>
                <a href="/dashboard" className="btn btn-primary">
                  Go to Dashboard
                </a>
              </div>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
