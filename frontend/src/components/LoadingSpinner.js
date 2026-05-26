import React from 'react';

function LoadingSpinner({ fullPage = false, message = 'Loading...' }) {
  if (fullPage) {
    return (
      <div className="loading-overlay">
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" style={{ margin: '0 auto 1rem' }} />
          <p style={{ color: 'var(--gray-500)', fontSize: '0.9rem' }}>{message}</p>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '3rem 1rem',
        flexDirection: 'column',
        gap: '1rem',
      }}
    >
      <div className="spinner" />
      <p style={{ color: 'var(--gray-500)', fontSize: '0.9rem' }}>{message}</p>
    </div>
  );
}

export default LoadingSpinner;
