import React, { useState, useEffect, useCallback } from 'react';
import { activityAPI } from '../utils/api';
import { formatDateTime, formatRelativeTime } from '../utils/dateUtils';
import LoadingSpinner from '../components/LoadingSpinner';

const ACTION_CONFIG = {
  login: { label: 'Login', icon: '🔐', color: '#3b82f6', bg: '#dbeafe' },
  logout: { label: 'Logout', icon: '🚪', color: '#6b7280', bg: '#f3f4f6' },
  register: { label: 'Registered', icon: '🎉', color: '#8b5cf6', bg: '#f5f3ff' },
  task_created: { label: 'Created event', icon: '➕', color: '#22c55e', bg: '#dcfce7' },
  task_edited: { label: 'Edited event', icon: '✏️', color: '#f59e0b', bg: '#fef3c7' },
  task_deleted: { label: 'Deleted event', icon: '🗑️', color: '#ef4444', bg: '#fee2e2' },
};

function ActionBadge({ action }) {
  const config = ACTION_CONFIG[action] || {
    label: action,
    icon: '•',
    color: '#6b7280',
    bg: '#f3f4f6',
  };

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.35rem',
        padding: '0.25rem 0.625rem',
        borderRadius: '9999px',
        backgroundColor: config.bg,
        color: config.color,
        fontSize: '0.8125rem',
        fontWeight: 600,
        whiteSpace: 'nowrap',
      }}
    >
      <span role="img" aria-hidden="true">{config.icon}</span>
      {config.label}
    </span>
  );
}

function ActivityLog() {
  const [activities, setActivities] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [actionFilter, setActionFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchActivities = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = { page: currentPage, limit: 20 };
      if (actionFilter) params.action = actionFilter;
      const response = await activityAPI.getAll(params);
      setActivities(response.data.activities || []);
      setPagination(response.data.pagination || null);
    } catch (err) {
      setError(err.message || 'Failed to load activity logs.');
    } finally {
      setLoading(false);
    }
  }, [currentPage, actionFilter]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  const handleFilterChange = (newFilter) => {
    setActionFilter(newFilter);
    setCurrentPage(1);
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const formatDetails = (action, details) => {
    if (!details) return null;
    if (action === 'login' || action === 'logout' || action === 'register') {
      return details.email ? `Email: ${details.email}` : null;
    }
    if (action === 'task_created' || action === 'task_edited' || action === 'task_deleted') {
      const parts = [];
      if (details.title) parts.push(details.title);
      if (details.date) parts.push(`on ${details.date}`);
      if (details.category) parts.push(`(${details.category})`);
      return parts.join(' ') || null;
    }
    return null;
  };

  return (
    <>
      <style>{`
        .activity-page-header {
          display: flex;
          flex-wrap: wrap;
          align-items: flex-start;
          justify-content: space-between;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .activity-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--gray-900);
        }

        .activity-subtitle {
          font-size: 0.9rem;
          color: var(--gray-500);
          margin-top: 0.25rem;
        }

        .filter-bar {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          margin-bottom: 1.25rem;
          align-items: center;
        }

        .filter-label {
          font-size: 0.8125rem;
          font-weight: 600;
          color: var(--gray-500);
          margin-right: 0.25rem;
        }

        .filter-btn {
          padding: 0.375rem 0.875rem;
          border-radius: 9999px;
          border: 1.5px solid var(--gray-200);
          background: var(--white);
          cursor: pointer;
          font-size: 0.8125rem;
          font-weight: 500;
          color: var(--gray-600);
          transition: var(--transition);
        }

        .filter-btn:hover {
          border-color: var(--primary);
          color: var(--primary);
        }

        .filter-btn.active {
          background: var(--primary);
          border-color: var(--primary);
          color: white;
        }

        .activity-table-wrapper {
          background: var(--white);
          border: 1px solid var(--gray-200);
          border-radius: var(--border-radius-xl);
          box-shadow: var(--shadow);
          overflow: hidden;
        }

        .activity-table {
          width: 100%;
          border-collapse: collapse;
        }

        .activity-table th {
          text-align: left;
          padding: 0.875rem 1.25rem;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--gray-500);
          background: var(--gray-50);
          border-bottom: 1px solid var(--gray-200);
          white-space: nowrap;
        }

        .activity-table td {
          padding: 0.875rem 1.25rem;
          border-bottom: 1px solid var(--gray-100);
          font-size: 0.9rem;
          vertical-align: middle;
        }

        .activity-table tr:last-child td {
          border-bottom: none;
        }

        .activity-table tr:hover td {
          background: var(--gray-50);
        }

        .activity-details {
          font-size: 0.8125rem;
          color: var(--gray-500);
          max-width: 280px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .activity-time {
          font-size: 0.8125rem;
          color: var(--gray-500);
          white-space: nowrap;
        }

        .activity-time-full {
          display: none;
        }

        @media (min-width: 640px) {
          .activity-time-relative {
            display: none;
          }
          .activity-time-full {
            display: block;
          }
        }

        .activity-ip {
          font-size: 0.75rem;
          color: var(--gray-400);
          font-family: monospace;
        }

        .pagination {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1rem 1.25rem;
          border-top: 1px solid var(--gray-100);
          flex-wrap: wrap;
          gap: 1rem;
          background: var(--gray-50);
        }

        .pagination-info {
          font-size: 0.875rem;
          color: var(--gray-500);
        }

        .pagination-buttons {
          display: flex;
          gap: 0.5rem;
          align-items: center;
        }

        .page-btn {
          width: 36px;
          height: 36px;
          border: 1.5px solid var(--gray-200);
          background: var(--white);
          border-radius: var(--border-radius);
          cursor: pointer;
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--gray-600);
          transition: var(--transition);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .page-btn:hover:not(:disabled) {
          border-color: var(--primary);
          color: var(--primary);
        }

        .page-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .page-btn.active {
          background: var(--primary);
          border-color: var(--primary);
          color: white;
        }

        .empty-state {
          padding: 4rem 2rem;
          text-align: center;
          color: var(--gray-400);
        }

        .empty-state-icon {
          font-size: 3rem;
          margin-bottom: 1rem;
        }

        .empty-state-text {
          font-size: 1rem;
          font-weight: 600;
          color: var(--gray-500);
          margin-bottom: 0.5rem;
        }

        .empty-state-sub {
          font-size: 0.875rem;
          color: var(--gray-400);
        }

        /* Mobile: card layout */
        @media (max-width: 639px) {
          .activity-table-wrapper {
            border: none;
            background: transparent;
            box-shadow: none;
          }

          .activity-table,
          .activity-table thead,
          .activity-table tbody,
          .activity-table th,
          .activity-table td,
          .activity-table tr {
            display: block;
          }

          .activity-table thead {
            display: none;
          }

          .activity-table tr {
            background: var(--white);
            border: 1px solid var(--gray-200);
            border-radius: var(--border-radius-lg);
            margin-bottom: 0.75rem;
            box-shadow: var(--shadow-sm);
            overflow: hidden;
          }

          .activity-table tr:hover td {
            background: var(--white);
          }

          .activity-table td {
            border-bottom: none;
            padding: 0.625rem 1rem;
            display: flex;
            align-items: center;
            gap: 0.5rem;
          }

          .activity-table td::before {
            content: attr(data-label);
            font-size: 0.75rem;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: var(--gray-400);
            min-width: 70px;
            flex-shrink: 0;
          }

          .pagination {
            border-radius: var(--border-radius-lg);
            border: 1px solid var(--gray-200);
            background: var(--white);
          }
        }
      `}</style>

      <div className="page-content">
        {/* Header */}
        <div className="activity-page-header">
          <div>
            <h1 className="activity-title">Activity Log</h1>
            <p className="activity-subtitle">Your recent account and scheduling activity</p>
          </div>
          <button
            className="btn btn-secondary btn-sm"
            onClick={fetchActivities}
            disabled={loading}
          >
            {loading ? 'Refreshing...' : '↻ Refresh'}
          </button>
        </div>

        {/* Filter bar */}
        <div className="filter-bar">
          <span className="filter-label">Filter:</span>
          <button
            className={`filter-btn ${actionFilter === '' ? 'active' : ''}`}
            onClick={() => handleFilterChange('')}
          >
            All
          </button>
          {Object.entries(ACTION_CONFIG).map(([key, cfg]) => (
            <button
              key={key}
              className={`filter-btn ${actionFilter === key ? 'active' : ''}`}
              onClick={() => handleFilterChange(key)}
            >
              {cfg.label}
            </button>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="alert alert-error mb-4" role="alert">
            <span>&#9888;</span>
            <span>
              {error}{' '}
              <button
                onClick={fetchActivities}
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

        {loading ? (
          <LoadingSpinner message="Loading activity log..." />
        ) : (
          <div className="activity-table-wrapper">
            {activities.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">📋</div>
                <p className="empty-state-text">No activity found</p>
                <p className="empty-state-sub">
                  {actionFilter
                    ? `No "${ACTION_CONFIG[actionFilter]?.label || actionFilter}" events recorded yet.`
                    : 'Your activity history will appear here.'}
                </p>
              </div>
            ) : (
              <>
                <table className="activity-table" aria-label="Activity log">
                  <thead>
                    <tr>
                      <th>Action</th>
                      <th>Details</th>
                      <th>IP Address</th>
                      <th>Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activities.map((activity) => {
                      const details = formatDetails(activity.action, activity.details);
                      return (
                        <tr key={activity.id}>
                          <td data-label="Action">
                            <ActionBadge action={activity.action} />
                          </td>
                          <td data-label="Details">
                            <span className="activity-details" title={details || ''}>
                              {details || (
                                <span style={{ color: 'var(--gray-300)' }}>—</span>
                              )}
                            </span>
                          </td>
                          <td data-label="IP">
                            <span className="activity-ip">
                              {activity.ip_address || '—'}
                            </span>
                          </td>
                          <td data-label="Time">
                            <div className="activity-time">
                              <span className="activity-time-relative">
                                {formatRelativeTime(activity.created_at)}
                              </span>
                              <span className="activity-time-full">
                                {formatDateTime(activity.created_at)}
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {pagination && pagination.totalPages > 1 && (
                  <div className="pagination">
                    <span className="pagination-info">
                      Showing {(pagination.page - 1) * pagination.limit + 1}–
                      {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                      {pagination.total} entries
                    </span>

                    <div className="pagination-buttons">
                      <button
                        className="page-btn"
                        onClick={() => handlePageChange(1)}
                        disabled={!pagination.hasPrevPage}
                        aria-label="First page"
                      >
                        «
                      </button>
                      <button
                        className="page-btn"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={!pagination.hasPrevPage}
                        aria-label="Previous page"
                      >
                        ‹
                      </button>

                      {/* Page number buttons */}
                      {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                        let pageNum;
                        if (pagination.totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= pagination.totalPages - 2) {
                          pageNum = pagination.totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        return (
                          <button
                            key={pageNum}
                            className={`page-btn ${pageNum === currentPage ? 'active' : ''}`}
                            onClick={() => handlePageChange(pageNum)}
                            aria-label={`Page ${pageNum}`}
                            aria-current={pageNum === currentPage ? 'page' : undefined}
                          >
                            {pageNum}
                          </button>
                        );
                      })}

                      <button
                        className="page-btn"
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={!pagination.hasNextPage}
                        aria-label="Next page"
                      >
                        ›
                      </button>
                      <button
                        className="page-btn"
                        onClick={() => handlePageChange(pagination.totalPages)}
                        disabled={!pagination.hasNextPage}
                        aria-label="Last page"
                      >
                        »
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </>
  );
}

export default ActivityLog;
