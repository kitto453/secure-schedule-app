import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/dashboard';

  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const newErrors = {};
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    if (!formData.password) {
      newErrors.password = 'Password is required';
    }
    return newErrors;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear field-level error on change
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
    if (serverError) setServerError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    setServerError('');
    try {
      await login(formData.email, formData.password);
      navigate(from, { replace: true });
    } catch (err) {
      setServerError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        .auth-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem 1rem;
          background: linear-gradient(135deg, #f0f4ff 0%, #fdf4ff 100%);
        }

        .auth-card {
          width: 100%;
          max-width: 440px;
          background: var(--white);
          border-radius: var(--border-radius-xl);
          box-shadow: var(--shadow-lg);
          overflow: hidden;
        }

        .auth-header {
          padding: 2rem 2rem 1.5rem;
          text-align: center;
          border-bottom: 1px solid var(--gray-100);
        }

        .auth-logo {
          width: 56px;
          height: 56px;
          background: var(--primary);
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.75rem;
          color: white;
          margin: 0 auto 1rem;
          font-weight: 700;
        }

        .auth-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--gray-900);
          margin-bottom: 0.25rem;
        }

        .auth-subtitle {
          font-size: 0.9rem;
          color: var(--gray-500);
        }

        .auth-body {
          padding: 1.75rem 2rem;
        }

        .auth-footer {
          padding: 1.25rem 2rem;
          border-top: 1px solid var(--gray-100);
          background: var(--gray-50);
          text-align: center;
          font-size: 0.9rem;
          color: var(--gray-600);
        }

        .input-wrapper {
          position: relative;
        }

        @media (max-width: 480px) {
          .auth-body {
            padding: 1.5rem;
          }
          .auth-header {
            padding: 1.5rem 1.5rem 1.25rem;
          }
        }
      `}</style>

      <div className="auth-page">
        <div className="auth-card">
          <div className="auth-header">
            <div className="auth-logo">S</div>
            <h1 className="auth-title">Welcome back</h1>
            <p className="auth-subtitle">Sign in to your SecureSchedule account</p>
          </div>

          <div className="auth-body">
            {serverError && (
              <div className="alert alert-error mb-4" role="alert">
                <span>&#9888;</span>
                <span>{serverError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate>
              <div className="form-group">
                <label htmlFor="email">Email address</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  autoComplete="email"
                  autoFocus
                  disabled={loading}
                  style={errors.email ? { borderColor: 'var(--danger)' } : {}}
                />
                {errors.email && <p className="form-error">{errors.email}</p>}
              </div>

              <div className="form-group">
                <label htmlFor="password">Password</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  disabled={loading}
                  style={errors.password ? { borderColor: 'var(--danger)' } : {}}
                />
                {errors.password && <p className="form-error">{errors.password}</p>}
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-full btn-lg"
                disabled={loading}
                style={{ marginTop: '0.5rem' }}
              >
                {loading ? (
                  <>
                    <span className="spinner spinner-sm" />
                    Signing in...
                  </>
                ) : (
                  'Sign in'
                )}
              </button>
            </form>
          </div>

          <div className="auth-footer">
            Don't have an account?{' '}
            <Link to="/register" style={{ fontWeight: 600 }}>
              Create one
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}

export default Login;
