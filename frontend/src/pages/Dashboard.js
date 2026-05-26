import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { schedulesAPI } from '../utils/api';
import {
  getWeekStart,
  getWeekDays,
  formatDateISO,
  formatDayShort,
  formatTime12h,
  isToday,
  getWeekRangeLabel,
} from '../utils/dateUtils';
import LoadingSpinner from '../components/LoadingSpinner';

const CATEGORY_COLORS = {
  class: '#3b82f6',
  work: '#8b5cf6',
  gym: '#22c55e',
  study: '#f59e0b',
  other: '#6b7280',
};

const CATEGORY_BG = {
  class: '#eff6ff',
  work: '#f5f3ff',
  gym: '#f0fdf4',
  study: '#fffbeb',
  other: '#f9fafb',
};

const PRIORITY_BADGE = {
  low: { bg: '#dcfce7', color: '#15803d', label: 'Low' },
  medium: { bg: '#fef3c7', color: '#92400e', label: 'Med' },
  high: { bg: '#fee2e2', color: '#b91c1c', label: 'High' },
};

function ScheduleItem({ item, onEdit, onToggleComplete, onDelete }) {
  const catColor = CATEGORY_COLORS[item.category] || CATEGORY_COLORS.other;
  const catBg = CATEGORY_BG[item.category] || CATEGORY_BG.other;
  const priority = PRIORITY_BADGE[item.priority] || PRIORITY_BADGE.low;

  const handleToggle = async (e) => {
    e.stopPropagation();
    await onToggleComplete(item);
  };

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (window.confirm(`Delete "${item.title}"?`)) {
      await onDelete(item.id);
    }
  };

  return (
    <div
      className="schedule-item"
      style={{
        backgroundColor: catBg,
        borderLeft: `3px solid ${catColor}`,
        opacity: item.completed ? 0.6 : 1,
      }}
      onClick={() => onEdit(item)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onEdit(item)}
      aria-label={`${item.title} - click to edit`}
    >
      <div className="schedule-item-header">
        <input
          type="checkbox"
          checked={item.completed}
          onChange={handleToggle}
          onClick={(e) => e.stopPropagation()}
          aria-label={`Mark ${item.title} as ${item.completed ? 'incomplete' : 'complete'}`}
          style={{ flexShrink: 0, marginTop: '2px' }}
        />
        <span
          className="schedule-item-title"
          style={{ textDecoration: item.completed ? 'line-through' : 'none' }}
        >
          {item.title}
        </span>
        <button
          className="schedule-item-delete"
          onClick={handleDelete}
          aria-label="Delete item"
          title="Delete"
        >
          &#x2715;
        </button>
      </div>

      <div className="schedule-item-meta">
        <span className="schedule-item-time">
          {formatTime12h(item.start_time)} &ndash; {formatTime12h(item.end_time)}
        </span>
        <span
          className="badge"
          style={{ backgroundColor: priority.bg, color: priority.color }}
        >
          {priority.label}
        </span>
      </div>

      <div className="schedule-item-category">
        <span
          style={{
            display: 'inline-block',
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: catColor,
            marginRight: '4px',
          }}
        />
        {item.category}
      </div>
    </div>
  );
}

function Dashboard() {
  const navigate = useNavigate();
  const [currentWeekStart, setCurrentWeekStart] = useState(() => getWeekStart(new Date()));
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toggling, setToggling] = useState(new Set());

  const weekDays = getWeekDays(currentWeekStart);

  const fetchWeekSchedules = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const weekParam = formatDateISO(currentWeekStart);
      const response = await schedulesAPI.getByWeek(weekParam);
      setSchedules(response.data.schedules || []);
    } catch (err) {
      setError(err.message || 'Failed to load schedules.');
    } finally {
      setLoading(false);
    }
  }, [currentWeekStart]);

  useEffect(() => {
    fetchWeekSchedules();
  }, [fetchWeekSchedules]);

  const goToPrevWeek = () => {
    setCurrentWeekStart((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() - 7);
      return d;
    });
  };

  const goToNextWeek = () => {
    setCurrentWeekStart((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() + 7);
      return d;
    });
  };

  const goToCurrentWeek = () => {
    setCurrentWeekStart(getWeekStart(new Date()));
  };

  const getItemsForDay = (date) => {
    const dateStr = formatDateISO(date);
    return schedules.filter((item) => item.date === dateStr);
  };

  const handleEdit = (item) => {
    navigate(`/schedules/${item.id}/edit`);
  };

  const handleAdd = (date) => {
    navigate('/schedules/new', { state: { date: formatDateISO(date) } });
  };

  const handleToggleComplete = async (item) => {
    if (toggling.has(item.id)) return;
    setToggling((prev) => new Set(prev).add(item.id));
    try {
      const updated = { ...item, completed: !item.completed };
      // Remove time seconds if present
      const cleanTime = (t) => t ? t.substring(0, 5) : t;
      const payload = {
        title: updated.title,
        description: updated.description || '',
        category: updated.category,
        start_time: cleanTime(updated.start_time),
        end_time: cleanTime(updated.end_time),
        date: updated.date,
        priority: updated.priority,
        deadline: updated.deadline || '',
        completed: updated.completed,
      };
      const response = await schedulesAPI.update(item.id, payload);
      setSchedules((prev) =>
        prev.map((s) => (s.id === item.id ? response.data.schedule : s))
      );
    } catch (err) {
      alert(err.message || 'Failed to update item.');
    } finally {
      setToggling((prev) => {
        const next = new Set(prev);
        next.delete(item.id);
        return next;
      });
    }
  };

  const handleDelete = async (id) => {
    try {
      await schedulesAPI.delete(id);
      setSchedules((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      alert(err.message || 'Failed to delete item.');
    }
  };

  const totalItems = schedules.length;
  const completedItems = schedules.filter((s) => s.completed).length;

  return (
    <>
      <style>{`
        .dashboard-header {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .dashboard-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--gray-900);
        }

        .week-nav {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: var(--white);
          border: 1px solid var(--gray-200);
          border-radius: var(--border-radius-lg);
          padding: 0.5rem;
          box-shadow: var(--shadow-sm);
        }

        .week-nav-label {
          font-size: 0.9rem;
          font-weight: 600;
          color: var(--gray-700);
          min-width: 180px;
          text-align: center;
          padding: 0 0.5rem;
        }

        .week-nav-btn {
          width: 32px;
          height: 32px;
          border: none;
          background: none;
          cursor: pointer;
          border-radius: var(--border-radius);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--gray-600);
          font-size: 1.1rem;
          transition: var(--transition);
          flex-shrink: 0;
        }

        .week-nav-btn:hover {
          background: var(--gray-100);
          color: var(--gray-900);
        }

        .stats-bar {
          display: flex;
          gap: 1rem;
          margin-bottom: 1.5rem;
          flex-wrap: wrap;
        }

        .stat-card {
          background: var(--white);
          border: 1px solid var(--gray-200);
          border-radius: var(--border-radius-lg);
          padding: 1rem 1.25rem;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          box-shadow: var(--shadow-sm);
          flex: 1;
          min-width: 120px;
        }

        .stat-icon {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.25rem;
          flex-shrink: 0;
        }

        .stat-value {
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--gray-900);
          line-height: 1;
        }

        .stat-label {
          font-size: 0.75rem;
          color: var(--gray-500);
          margin-top: 2px;
        }

        .week-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 0.5rem;
          overflow-x: auto;
          padding-bottom: 0.5rem;
        }

        @media (max-width: 900px) {
          .week-grid {
            grid-template-columns: repeat(7, minmax(120px, 1fr));
          }
        }

        @media (max-width: 600px) {
          .week-grid {
            grid-template-columns: repeat(7, minmax(110px, 1fr));
          }
        }

        .day-column {
          background: var(--white);
          border: 1px solid var(--gray-200);
          border-radius: var(--border-radius-lg);
          overflow: hidden;
          min-height: 300px;
          display: flex;
          flex-direction: column;
          box-shadow: var(--shadow-sm);
          transition: var(--transition);
        }

        .day-column.today {
          border-color: var(--primary);
          box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.15);
        }

        .day-header {
          padding: 0.625rem 0.5rem;
          text-align: center;
          border-bottom: 1px solid var(--gray-100);
          background: var(--gray-50);
        }

        .day-column.today .day-header {
          background: var(--primary-bg);
        }

        .day-name {
          font-size: 0.7rem;
          font-weight: 600;
          text-transform: uppercase;
          color: var(--gray-500);
          letter-spacing: 0.05em;
        }

        .day-column.today .day-name {
          color: var(--primary);
        }

        .day-number {
          font-size: 1.1rem;
          font-weight: 700;
          color: var(--gray-800);
          line-height: 1.2;
          margin-top: 1px;
        }

        .day-column.today .day-number {
          color: var(--primary);
        }

        .day-items {
          flex: 1;
          padding: 0.375rem;
          display: flex;
          flex-direction: column;
          gap: 0.375rem;
          overflow-y: auto;
          max-height: 500px;
        }

        .day-add-btn {
          margin: 0.375rem;
          padding: 0.375rem;
          background: none;
          border: 1.5px dashed var(--gray-300);
          border-radius: var(--border-radius);
          cursor: pointer;
          color: var(--gray-400);
          font-size: 0.75rem;
          text-align: center;
          transition: var(--transition);
          width: calc(100% - 0.75rem);
        }

        .day-add-btn:hover {
          border-color: var(--primary);
          color: var(--primary);
          background-color: var(--primary-bg);
        }

        .schedule-item {
          padding: 0.5rem;
          border-radius: var(--border-radius);
          cursor: pointer;
          transition: var(--transition);
          border: 1px solid transparent;
        }

        .schedule-item:hover {
          box-shadow: var(--shadow-sm);
          transform: translateY(-1px);
          border-color: rgba(0,0,0,0.05);
        }

        .schedule-item-header {
          display: flex;
          align-items: flex-start;
          gap: 0.375rem;
          margin-bottom: 0.25rem;
        }

        .schedule-item-title {
          font-size: 0.8rem;
          font-weight: 600;
          color: var(--gray-800);
          flex: 1;
          line-height: 1.3;
          word-break: break-word;
        }

        .schedule-item-delete {
          background: none;
          border: none;
          cursor: pointer;
          color: var(--gray-400);
          font-size: 0.75rem;
          padding: 0 2px;
          line-height: 1;
          flex-shrink: 0;
          border-radius: 4px;
          transition: var(--transition);
        }

        .schedule-item-delete:hover {
          color: var(--danger);
          background: var(--danger-bg);
        }

        .schedule-item-meta {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.25rem;
          flex-wrap: wrap;
          margin-bottom: 0.25rem;
        }

        .schedule-item-time {
          font-size: 0.7rem;
          color: var(--gray-500);
          white-space: nowrap;
        }

        .schedule-item-category {
          font-size: 0.68rem;
          color: var(--gray-500);
          text-transform: capitalize;
          display: flex;
          align-items: center;
        }

        .empty-day {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--gray-300);
          font-size: 0.75rem;
          padding: 1rem 0.5rem;
          text-align: center;
        }

        .legend {
          display: flex;
          flex-wrap: wrap;
          gap: 0.75rem;
          margin-top: 1.25rem;
          padding: 1rem;
          background: var(--white);
          border: 1px solid var(--gray-200);
          border-radius: var(--border-radius-lg);
          box-shadow: var(--shadow-sm);
        }

        .legend-title {
          font-size: 0.8rem;
          font-weight: 600;
          color: var(--gray-600);
          width: 100%;
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: 0.375rem;
          font-size: 0.8rem;
          color: var(--gray-600);
        }

        .legend-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          flex-shrink: 0;
        }
      `}</style>

      <div className="page-content">
        {/* Header */}
        <div className="dashboard-header">
          <div>
            <h1 className="dashboard-title">My Schedule</h1>
          </div>

          <div className="week-nav">
            <button className="week-nav-btn" onClick={goToPrevWeek} aria-label="Previous week">
              &#8249;
            </button>
            <button
              className="week-nav-label"
              onClick={goToCurrentWeek}
              style={{ background: 'none', border: 'none', cursor: 'pointer' }}
              title="Go to current week"
            >
              {getWeekRangeLabel(currentWeekStart)}
            </button>
            <button className="week-nav-btn" onClick={goToNextWeek} aria-label="Next week">
              &#8250;
            </button>
          </div>

          <button
            className="btn btn-primary"
            onClick={() => navigate('/schedules/new')}
          >
            + Add Event
          </button>
        </div>

        {/* Stats */}
        <div className="stats-bar">
          <div className="stat-card">
            <div className="stat-icon" style={{ backgroundColor: '#eef2ff' }}>
              📅
            </div>
            <div>
              <div className="stat-value">{totalItems}</div>
              <div className="stat-label">This week</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ backgroundColor: '#f0fdf4' }}>
              ✅
            </div>
            <div>
              <div className="stat-value">{completedItems}</div>
              <div className="stat-label">Completed</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{ backgroundColor: '#fff7ed' }}>
              ⏳
            </div>
            <div>
              <div className="stat-value">{totalItems - completedItems}</div>
              <div className="stat-label">Remaining</div>
            </div>
          </div>
          {totalItems > 0 && (
            <div className="stat-card">
              <div className="stat-icon" style={{ backgroundColor: '#fdf4ff' }}>
                📊
              </div>
              <div>
                <div className="stat-value">
                  {Math.round((completedItems / totalItems) * 100)}%
                </div>
                <div className="stat-label">Done</div>
              </div>
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="alert alert-error mb-4" role="alert">
            <span>&#9888;</span>
            <span>
              {error}{' '}
              <button
                onClick={fetchWeekSchedules}
                style={{
                  background: 'none',
                  border: 'none',
                  textDecoration: 'underline',
                  cursor: 'pointer',
                  color: 'inherit',
                  padding: 0,
                }}
              >
                Retry
              </button>
            </span>
          </div>
        )}

        {/* Calendar Grid */}
        {loading ? (
          <LoadingSpinner message="Loading your schedule..." />
        ) : (
          <div className="week-grid">
            {weekDays.map((day) => {
              const dayItems = getItemsForDay(day);
              const todayClass = isToday(day) ? 'today' : '';
              const dayName = day.toLocaleDateString('en-US', { weekday: 'short' });
              const dayNum = day.getDate();

              return (
                <div key={formatDateISO(day)} className={`day-column ${todayClass}`}>
                  <div className="day-header">
                    <div className="day-name">{dayName}</div>
                    <div className="day-number">{dayNum}</div>
                  </div>

                  <div className="day-items">
                    {dayItems.length === 0 ? (
                      <div className="empty-day">No events</div>
                    ) : (
                      dayItems.map((item) => (
                        <ScheduleItem
                          key={item.id}
                          item={item}
                          onEdit={handleEdit}
                          onToggleComplete={handleToggleComplete}
                          onDelete={handleDelete}
                        />
                      ))
                    )}
                  </div>

                  <button
                    className="day-add-btn"
                    onClick={() => handleAdd(day)}
                    aria-label={`Add event on ${formatDayShort(day)}`}
                  >
                    + Add
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Legend */}
        <div className="legend">
          <div className="legend-title">Categories</div>
          {Object.entries(CATEGORY_COLORS).map(([cat, color]) => (
            <div key={cat} className="legend-item">
              <div className="legend-dot" style={{ backgroundColor: color }} />
              <span style={{ textTransform: 'capitalize' }}>{cat}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

export default Dashboard;
