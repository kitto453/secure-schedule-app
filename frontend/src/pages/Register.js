import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Full name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    } else if (!/^[a-zA-Z\s'-]+$/.test(formData.name.trim())) {
      newErrors.name = 'Name can only contain letters, spaces, hyphens, and apostrophes';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password =
        'Password must contain at least one uppercase letter, one lowercase letter, and one number';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    return newErrors;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
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
      await register(formData.name.trim(), formData.email, formData.password);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setServerError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrength = () => {
    const p = formData.password;
    if (!p) return null;
    let score = 0;
    if (p.length >= 8) score++;
    if (p.length >= 12) score++;
    if (/[A-Z]/.test(p)) score++;
    if (/[a-z]/.test(p)) score++;
    if (/\d/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;

    if (score <= 2) return { label: 'Weak', color: 'var(--danger)', width: '33%' };
    if (score <= 4) return { label: 'Fair', color: 'var(--warning)', width: '66%' };
    return { label: 'Strong', color: 'var(--success)', width: '100%' };
  };

  const strength = getPasswordStrength();

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

        .password-strength-bar {
          margin-top: 0.5rem;
          height: 4px;
          background: var(--gray-200);
          border-radius: 2px;
          overflow: hidden;
        }

        .password-strength-fill {
          height: 100%;
          border-radius: 2px;
          transition: width 0.3s ease, background-color 0.3s ease;
        }

        .password-strength-label {
          margin-top: 0.25rem;
          font-size: 0.75rem;
          font-weight: 500;
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
            <h1 className="auth-title">Create account</h1>
            <p className="auth-subtitle">Join SecureSchedule to manage your schedule</p>
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
                <label htmlFor="name">Full name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Jane Doe"
                  autoComplete="name"
                  autoFocus
                  disabled={loading}
                  style={errors.name ? { borderColor: 'var(--danger)' } : {}}
                />
                {errors.name && <p className="form-error">{errors.name}</p>}
              </div>

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
                  placeholder="Min. 8 characters"
                  autoComplete="new-password"
                  disabled={loading}
                  style={errors.password ? { borderColor: 'var(--danger)' } : {}}
                />
                {formData.password && strength && (
                  <>
                    <div className="password-strength-bar">
                      <div
                        className="password-strength-fill"
                        style={{
                          width: strength.width,
                          backgroundColor: strength.color,
                        }}
                      />
                    </div>
                    <p
                      className="password-strength-label"
                      style={{ color: strength.color }}
                    >
                      {strength.label} password
                    </p>
                  </>
                )}
                {errors.password && <p className="form-error">{errors.password}</p>}
                {!errors.password && (
                  <p className="form-hint">
                    Must be 8+ characters with uppercase, lowercase, and a number.
                  </p>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm password</label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Repeat your password"
                  autoComplete="new-password"
                  disabled={loading}
                  style={errors.confirmPassword ? { borderColor: 'var(--danger)' } : {}}
                />
                {errors.confirmPassword && (
                  <p className="form-error">{errors.confirmPassword}</p>
                )}
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
                    Creating account...
                  </>
                ) : (
                  'Create account'
                )}
              </button>
            </form>
          </div>

          <div className="auth-footer">
            Already have an account?{' '}
            <Link to="/login" style={{ fontWeight: 600 }}>
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}

export default Register;
