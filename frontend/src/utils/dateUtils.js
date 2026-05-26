/**
 * Get the Monday (start) of the week for a given date.
 * @param {Date} date
 * @returns {Date}
 */
export function getWeekStart(date) {
  const d = new Date(date);
  const day = d.getDay(); // 0 = Sunday, 1 = Monday, ...
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust so Monday is first
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Get an array of 7 Date objects representing a full week starting from Monday.
 * @param {Date} weekStart - Monday of the week
 * @returns {Date[]}
 */
export function getWeekDays(weekStart) {
  const days = [];
  for (let i = 0; i < 7; i++) {
    const day = new Date(weekStart);
    day.setDate(weekStart.getDate() + i);
    days.push(day);
  }
  return days;
}

/**
 * Format a Date to YYYY-MM-DD string (local time).
 * @param {Date} date
 * @returns {string}
 */
export function formatDateISO(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Format a Date to a human-readable short format: Mon 5
 * @param {Date} date
 * @returns {string}
 */
export function formatDayShort(date) {
  return date.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' });
}

/**
 * Format a Date to a full readable format: Monday, January 5, 2026
 * @param {Date} date
 * @returns {string}
 */
export function formatDateFull(date) {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Format a Date to month/year: January 2026
 * @param {Date} date
 * @returns {string}
 */
export function formatMonthYear(date) {
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

/**
 * Format a time string HH:MM:SS or HH:MM to 12-hour format (12:00 PM).
 * @param {string} time - "HH:MM" or "HH:MM:SS"
 * @returns {string}
 */
export function formatTime12h(time) {
  if (!time) return '';
  const [hoursStr, minutesStr] = time.split(':');
  let hours = parseInt(hoursStr, 10);
  const minutes = minutesStr || '00';
  const period = hours >= 12 ? 'PM' : 'AM';
  if (hours === 0) hours = 12;
  else if (hours > 12) hours -= 12;
  return `${hours}:${minutes} ${period}`;
}

/**
 * Check if a date is today.
 * @param {Date} date
 * @returns {boolean}
 */
export function isToday(date) {
  const today = new Date();
  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
}

/**
 * Check if two Date objects represent the same calendar day.
 * @param {Date} a
 * @param {Date} b
 * @returns {boolean}
 */
export function isSameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/**
 * Format a datetime string to a readable timestamp.
 * @param {string} dateTimeStr
 * @returns {string}
 */
export function formatDateTime(dateTimeStr) {
  if (!dateTimeStr) return '';
  const date = new Date(dateTimeStr);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Format a relative time (e.g. "2 hours ago", "just now").
 * @param {string} dateTimeStr
 * @returns {string}
 */
export function formatRelativeTime(dateTimeStr) {
  if (!dateTimeStr) return '';
  const date = new Date(dateTimeStr);
  const now = new Date();
  const diffMs = now - date;
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return 'just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  return formatDateTime(dateTimeStr);
}

/**
 * Get human-readable week range label: "May 5 - May 11, 2026"
 * @param {Date} weekStart
 * @returns {string}
 */
export function getWeekRangeLabel(weekStart) {
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);

  const startLabel = weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const endLabel = weekEnd.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return `${startLabel} - ${endLabel}`;
}
