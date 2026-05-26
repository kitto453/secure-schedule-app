import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      console.error('Logout failed:', err);
    } finally {
      setLoggingOut(false);
      setMenuOpen(false);
    }
  };

  const navLinkClass = ({ isActive }) =>
    `navbar-link ${isActive ? 'navbar-link-active' : ''}`;

  return (
    <>
      <style>{`
        .navbar {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          height: var(--navbar-height);
          background: var(--white);
          border-bottom: 1px solid var(--gray-200);
          z-index: 100;
          box-shadow: var(--shadow-sm);
        }

        .navbar-inner {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 1rem;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
        }

        .navbar-brand {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          text-decoration: none;
          font-weight: 700;
          font-size: 1.125rem;
          color: var(--primary);
          flex-shrink: 0;
        }

        .navbar-brand:hover {
          color: var(--primary-dark);
          text-decoration: none;
        }

        .navbar-brand-icon {
          width: 2rem;
          height: 2rem;
          background: var(--primary);
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 1rem;
        }

        .navbar-nav {
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }

        .navbar-link {
          padding: 0.5rem 0.75rem;
          border-radius: var(--border-radius);
          font-size: 0.9rem;
          font-weight: 500;
          color: var(--gray-600);
          text-decoration: none;
          transition: var(--transition);
          white-space: nowrap;
        }

        .navbar-link:hover {
          background-color: var(--gray-100);
          color: var(--gray-900);
          text-decoration: none;
        }

        .navbar-link-active {
          background-color: var(--primary-bg);
          color: var(--primary);
        }

        .navbar-link-active:hover {
          background-color: var(--primary-bg);
          color: var(--primary-dark);
        }

        .navbar-user {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          flex-shrink: 0;
        }

        .navbar-user-name {
          font-size: 0.875rem;
          color: var(--gray-600);
          font-weight: 500;
          display: none;
        }

        @media (min-width: 480px) {
          .navbar-user-name {
            display: block;
          }
        }

        .hamburger {
          display: none;
          flex-direction: column;
          justify-content: center;
          gap: 4px;
          width: 36px;
          height: 36px;
          padding: 6px;
          background: none;
          border: none;
          cursor: pointer;
          border-radius: var(--border-radius);
        }

        .hamburger:hover {
          background-color: var(--gray-100);
        }

        .hamburger span {
          width: 100%;
          height: 2px;
          background-color: var(--gray-600);
          border-radius: 2px;
          transition: var(--transition);
        }

        .mobile-menu {
          display: none;
          position: fixed;
          top: var(--navbar-height);
          left: 0;
          right: 0;
          background: var(--white);
          border-bottom: 1px solid var(--gray-200);
          padding: 0.75rem;
          z-index: 99;
          box-shadow: var(--shadow-md);
        }

        .mobile-menu.open {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .mobile-menu .navbar-link {
          display: block;
          padding: 0.75rem 1rem;
        }

        .mobile-menu-divider {
          height: 1px;
          background: var(--gray-200);
          margin: 0.5rem 0;
        }

        .mobile-user-info {
          padding: 0.5rem 1rem;
          font-size: 0.875rem;
          color: var(--gray-500);
        }

        @media (max-width: 639px) {
          .navbar-nav {
            display: none;
          }

          .hamburger {
            display: flex;
          }
        }

        @media (min-width: 640px) {
          .mobile-menu {
            display: none !important;
          }
        }
      `}</style>

      <nav className="navbar">
        <div className="navbar-inner">
          <Link to="/" className="navbar-brand">
            <div className="navbar-brand-icon">S</div>
            SecureSchedule
          </Link>

          {isAuthenticated && (
            <>
              <div className="navbar-nav">
                <NavLink to="/dashboard" className={navLinkClass}>
                  Dashboard
                </NavLink>
                <NavLink to="/activity" className={navLinkClass}>
                  Activity
                </NavLink>
              </div>

              <div className="navbar-user">
                <span className="navbar-user-name">Hi, {user?.name?.split(' ')[0]}</span>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={handleLogout}
                  disabled={loggingOut}
                >
                  {loggingOut ? 'Logging out...' : 'Logout'}
                </button>
              </div>

              <button
                className="hamburger"
                onClick={() => setMenuOpen((prev) => !prev)}
                aria-label="Toggle menu"
                aria-expanded={menuOpen}
              >
                <span />
                <span />
                <span />
              </button>
            </>
          )}

          {!isAuthenticated && (
            <div className="navbar-nav">
              <NavLink to="/login" className={navLinkClass}>
                Login
              </NavLink>
              <NavLink to="/register" className={`${navLinkClass({ isActive: false })} btn btn-primary btn-sm`}>
                Sign Up
              </NavLink>
            </div>
          )}
        </div>
      </nav>

      {/* Mobile menu */}
      {isAuthenticated && (
        <div className={`mobile-menu ${menuOpen ? 'open' : ''}`}>
          <div className="mobile-user-info">Signed in as {user?.name}</div>
          <div className="mobile-menu-divider" />
          <NavLink
            to="/dashboard"
            className={navLinkClass}
            onClick={() => setMenuOpen(false)}
          >
            Dashboard
          </NavLink>
          <NavLink
            to="/activity"
            className={navLinkClass}
            onClick={() => setMenuOpen(false)}
          >
            Activity Log
          </NavLink>
          <div className="mobile-menu-divider" />
          <button
            className="btn btn-secondary btn-sm"
            onClick={handleLogout}
            disabled={loggingOut}
            style={{ margin: '0 0.25rem' }}
          >
            {loggingOut ? 'Logging out...' : 'Logout'}
          </button>
        </div>
      )}
    </>
  );
}

export default Navbar;
