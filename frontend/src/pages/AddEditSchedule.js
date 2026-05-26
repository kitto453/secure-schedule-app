import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { schedulesAPI } from '../utils/api';
import LoadingSpinner from '../components/LoadingSpinner';

const CATEGORIES = [
  { value: 'class', label: 'Class', color: '#3b82f6' },
  { value: 'work', label: 'Work', color: '#8b5cf6' },
  { value: 'gym', label: 'Gym', color: '#22c55e' },
  { value: 'study', label: 'Study', color: '#f59e0b' },
  { value: 'other', label: 'Other', color: '#6b7280' },
];

const PRIORITIES = [
  { value: 'low', label: 'Low', color: '#15803d' },
  { value: 'medium', label: 'Medium', color: '#92400e' },
  { value: 'high', label: 'High', color: '#b91c1c' },
];

const INITIAL_FORM = {
  title: '',
  description: '',
  category: 'other',
  date: '',
  start_time: '09:00',
  end_time: '10:00',
  priority: 'medium',
  deadline: '',
  completed: false,
};

function AddEditSchedule() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const isEditMode = Boolean(id);

  const [formData, setFormData] = useState(() => {
    const defaults = { ...INITIAL_FORM };
    // Pre-fill date from navigation state (when clicking "Add" on a specific day)
    if (location.state?.date) {
      defaults.date = location.state.date;
    } else {
      // Default to today
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const dd = String(today.getDate()).padStart(2, '0');
      defaults.date = `${yyyy}-${mm}-${dd}`;
    }
    return defaults;
  });

  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchingItem, setFetchingItem] = useState(isEditMode);

  // Load existing item in edit mode
  useEffect(() => {
    if (!isEditMode) return;

    const fetchItem = async () => {
      setFetchingItem(true);
      try {
        // Fetch all and find by ID (API doesn't have GET /schedules/:id)
        const response = await schedulesAPI.getAll();
        const item = response.data.schedules.find((s) => s.id === parseInt(id, 10));
        if (!item) {
          setServerError('Schedule item not found.');
          return;
        }
        // Format time to HH:MM (strip seconds)
        const cleanTime = (t) => (t ? t.substring(0, 5) : '');
        // Format deadline for datetime-local input
        let deadlineLocal = '';
        if (item.deadline) {
          const d = new Date(item.deadline);
          const offset = d.getTimezoneOffset();
          const localDate = new Date(d.getTime() - offset * 60000);
          deadlineLocal = localDate.toISOString().substring(0, 16);
        }
        setFormData({
          title: item.title || '',
          description: item.description || '',
          category: item.category || 'other',
          date: item.date || '',
          start_time: cleanTime(item.start_time),
          end_time: cleanTime(item.end_time),
          priority: item.priority || 'medium',
          deadline: deadlineLocal,
          completed: item.completed || false,
        });
      } catch (err) {
        setServerError(err.message || 'Failed to load schedule item.');
      } finally {
        setFetchingItem(false);
      }
    };

    fetchItem();
  }, [id, isEditMode]);

  const validate = () => {
    const errs = {};

    if (!formData.title.trim()) {
      errs.title = 'Title is required';
    } else if (formData.title.trim().length > 255) {
      errs.title = 'Title must not exceed 255 characters';
    }

    if (formData.description && formData.description.length > 2000) {
      errs.description = 'Description must not exceed 2000 characters';
    }

    if (!formData.category) {
      errs.category = 'Please select a category';
    }

    if (!formData.date) {
      errs.date = 'Date is required';
    }

    if (!formData.start_time) {
      errs.start_time = 'Start time is required';
    }

    if (!formData.end_time) {
      errs.end_time = 'End time is required';
    }

    if (formData.start_time && formData.end_time && formData.start_time >= formData.end_time) {
      errs.end_time = 'End time must be after start time';
    }

    if (!formData.priority) {
      errs.priority = 'Please select a priority';
    }

    return errs;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    setFormData((prev) => ({ ...prev, [name]: newValue }));
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
      // Scroll to first error
      const firstErrorField = Object.keys(validationErrors)[0];
      document.getElementById(firstErrorField)?.focus();
      return;
    }

    setLoading(true);
    setServerError('');

    const payload = {
      title: formData.title.trim(),
      description: formData.description.trim(),
      category: formData.category,
      date: formData.date,
      start_time: formData.start_time,
      end_time: formData.end_time,
      priority: formData.priority,
      deadline: formData.deadline || null,
      completed: formData.completed,
    };

    try {
      if (isEditMode) {
        await schedulesAPI.update(id, payload);
      } else {
        await schedulesAPI.create(payload);
      }
      navigate('/dashboard');
    } catch (err) {
      setServerError(err.message || 'Failed to save schedule item. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (fetchingItem) {
    return <LoadingSpinner message="Loading event..." />;
  }

  return (
    <>
      <style>{`
        .form-page {
          max-width: 680px;
          margin: 0 auto;
        }

        .form-page-header {
          margin-bottom: 1.5rem;
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .form-page-title {
          font-size: 1.5rem;
          font-weight: 700;
        }

        .back-btn {
          background: none;
          border: none;
          cursor: pointer;
          color: var(--gray-500);
          font-size: 1.25rem;
          padding: 0.25rem 0.5rem;
          border-radius: var(--border-radius);
          display: flex;
          align-items: center;
          transition: var(--transition);
          flex-shrink: 0;
        }

        .back-btn:hover {
          background: var(--gray-100);
          color: var(--gray-800);
        }

        .form-card {
          background: var(--white);
          border-radius: var(--border-radius-xl);
          box-shadow: var(--shadow);
          overflow: hidden;
        }

        .form-card-body {
          padding: 1.75rem;
        }

        .form-card-footer {
          padding: 1.25rem 1.75rem;
          border-top: 1px solid var(--gray-100);
          background: var(--gray-50);
          display: flex;
          justify-content: flex-end;
          gap: 0.75rem;
          flex-wrap: wrap;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }

        @media (max-width: 520px) {
          .form-row {
            grid-template-columns: 1fr;
          }
          .form-card-body {
            padding: 1.25rem;
          }
          .form-card-footer {
            padding: 1rem 1.25rem;
          }
        }

        .category-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .category-btn {
          padding: 0.5rem 1rem;
          border-radius: 9999px;
          border: 2px solid var(--gray-200);
          background: var(--white);
          cursor: pointer;
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--gray-600);
          transition: var(--transition);
          display: flex;
          align-items: center;
          gap: 0.375rem;
        }

        .category-btn.selected {
          color: white;
          border-color: transparent;
        }

        .category-btn:hover:not(.selected) {
          border-color: var(--gray-300);
          background: var(--gray-50);
        }

        .priority-grid {
          display: flex;
          gap: 0.5rem;
        }

        .priority-btn {
          flex: 1;
          padding: 0.5rem;
          border-radius: var(--border-radius);
          border: 2px solid var(--gray-200);
          background: var(--white);
          cursor: pointer;
          font-size: 0.875rem;
          font-weight: 600;
          transition: var(--transition);
          text-align: center;
        }

        .priority-btn.selected-low {
          background: #dcfce7;
          border-color: #86efac;
          color: #15803d;
        }

        .priority-btn.selected-medium {
          background: #fef3c7;
          border-color: #fcd34d;
          color: #92400e;
        }

        .priority-btn.selected-high {
          background: #fee2e2;
          border-color: #fca5a5;
          color: #b91c1c;
        }

        .priority-btn:not([class*="selected"]):hover {
          background: var(--gray-50);
          border-color: var(--gray-300);
        }

        .section-title {
          font-size: 0.8125rem;
          font-weight: 600;
          color: var(--gray-500);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 1rem;
          margin-top: 1.5rem;
          padding-top: 1.5rem;
          border-top: 1px solid var(--gray-100);
        }

        .section-title:first-child {
          margin-top: 0;
          padding-top: 0;
          border-top: none;
        }

        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 0.625rem;
          cursor: pointer;
          padding: 0.75rem 1rem;
          border: 1.5px solid var(--gray-200);
          border-radius: var(--border-radius);
          background: var(--white);
          transition: var(--transition);
          user-select: none;
        }

        .checkbox-label:hover {
          background: var(--gray-50);
          border-color: var(--gray-300);
        }

        .checkbox-label input[type="checkbox"] {
          width: 1.125rem;
          height: 1.125rem;
        }
      `}</style>

      <div className="page-content">
        <div className="form-page">
          {/* Page header */}
          <div className="form-page-header">
            <button
              className="back-btn"
              onClick={() => navigate(-1)}
              aria-label="Go back"
            >
              &#8592;
            </button>
            <h1 className="form-page-title">
              {isEditMode ? 'Edit Event' : 'New Event'}
            </h1>
          </div>

          {serverError && (
            <div className="alert alert-error mb-4" role="alert">
              <span>&#9888;</span>
              <span>{serverError}</span>
            </div>
          )}

          <div className="form-card">
            <form onSubmit={handleSubmit} noValidate>
              <div className="form-card-body">
                {/* Basic Info */}
                <div className="section-title">Event Details</div>

                <div className="form-group">
                  <label htmlFor="title">Title *</label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="e.g. Morning standup"
                    maxLength={255}
                    disabled={loading}
                    autoFocus={!isEditMode}
                    style={errors.title ? { borderColor: 'var(--danger)' } : {}}
                  />
                  {errors.title && <p className="form-error">{errors.title}</p>}
                </div>

                <div className="form-group">
                  <label htmlFor="description">Description</label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Add notes or details (optional)"
                    rows={3}
                    maxLength={2000}
                    disabled={loading}
                    style={errors.description ? { borderColor: 'var(--danger)' } : {}}
                  />
                  {errors.description && (
                    <p className="form-error">{errors.description}</p>
                  )}
                  <p className="form-hint">{formData.description.length}/2000</p>
                </div>

                {/* Category */}
                <div className="section-title">Category</div>

                <div className="form-group">
                  <div className="category-grid" role="radiogroup" aria-label="Category">
                    {CATEGORIES.map((cat) => (
                      <button
                        key={cat.value}
                        type="button"
                        className={`category-btn ${
                          formData.category === cat.value ? 'selected' : ''
                        }`}
                        style={
                          formData.category === cat.value
                            ? { backgroundColor: cat.color }
                            : {}
                        }
                        onClick={() => {
                          setFormData((prev) => ({ ...prev, category: cat.value }));
                          if (errors.category)
                            setErrors((prev) => ({ ...prev, category: '' }));
                        }}
                        disabled={loading}
                        aria-pressed={formData.category === cat.value}
                      >
                        <span
                          style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            backgroundColor:
                              formData.category === cat.value ? 'white' : cat.color,
                            flexShrink: 0,
                          }}
                        />
                        {cat.label}
                      </button>
                    ))}
                  </div>
                  {errors.category && <p className="form-error">{errors.category}</p>}
                </div>

                {/* Priority */}
                <div className="section-title">Priority</div>

                <div className="form-group">
                  <div className="priority-grid" role="radiogroup" aria-label="Priority">
                    {PRIORITIES.map((p) => (
                      <button
                        key={p.value}
                        type="button"
                        className={`priority-btn ${
                          formData.priority === p.value ? `selected-${p.value}` : ''
                        }`}
                        onClick={() => {
                          setFormData((prev) => ({ ...prev, priority: p.value }));
                          if (errors.priority)
                            setErrors((prev) => ({ ...prev, priority: '' }));
                        }}
                        disabled={loading}
                        aria-pressed={formData.priority === p.value}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                  {errors.priority && <p className="form-error">{errors.priority}</p>}
                </div>

                {/* Schedule */}
                <div className="section-title">Schedule</div>

                <div className="form-group">
                  <label htmlFor="date">Date *</label>
                  <input
                    type="date"
                    id="date"
                    name="date"
                    value={formData.date}
                    onChange={handleChange}
                    disabled={loading}
                    style={errors.date ? { borderColor: 'var(--danger)' } : {}}
                  />
                  {errors.date && <p className="form-error">{errors.date}</p>}
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="start_time">Start time *</label>
                    <input
                      type="time"
                      id="start_time"
                      name="start_time"
                      value={formData.start_time}
                      onChange={handleChange}
                      disabled={loading}
                      style={errors.start_time ? { borderColor: 'var(--danger)' } : {}}
                    />
                    {errors.start_time && (
                      <p className="form-error">{errors.start_time}</p>
                    )}
                  </div>

                  <div className="form-group">
                    <label htmlFor="end_time">End time *</label>
                    <input
                      type="time"
                      id="end_time"
                      name="end_time"
                      value={formData.end_time}
                      onChange={handleChange}
                      disabled={loading}
                      style={errors.end_time ? { borderColor: 'var(--danger)' } : {}}
                    />
                    {errors.end_time && (
                      <p className="form-error">{errors.end_time}</p>
                    )}
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="deadline">Deadline (optional)</label>
                  <input
                    type="datetime-local"
                    id="deadline"
                    name="deadline"
                    value={formData.deadline}
                    onChange={handleChange}
                    disabled={loading}
                    style={errors.deadline ? { borderColor: 'var(--danger)' } : {}}
                  />
                  {errors.deadline && <p className="form-error">{errors.deadline}</p>}
                  <p className="form-hint">Set an optional hard deadline for this task.</p>
                </div>

                {/* Completed - only in edit mode */}
                {isEditMode && (
                  <>
                    <div className="section-title">Status</div>
                    <div className="form-group">
                      <label
                        className="checkbox-label"
                        htmlFor="completed"
                        style={{ marginBottom: 0 }}
                      >
                        <input
                          type="checkbox"
                          id="completed"
                          name="completed"
                          checked={formData.completed}
                          onChange={handleChange}
                          disabled={loading}
                        />
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--gray-800)' }}>
                            Mark as completed
                          </div>
                          <div style={{ fontSize: '0.8125rem', color: 'var(--gray-500)' }}>
                            {formData.completed
                              ? 'This event is marked as done'
                              : 'This event is still pending'}
                          </div>
                        </div>
                      </label>
                    </div>
                  </>
                )}
              </div>

              <div className="form-card-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => navigate(-1)}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner spinner-sm" />
                      {isEditMode ? 'Saving...' : 'Creating...'}
                    </>
                  ) : isEditMode ? (
                    'Save changes'
                  ) : (
                    'Create event'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}

export default AddEditSchedule;
