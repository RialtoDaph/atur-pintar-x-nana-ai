/**
 * Timezone-aware date utilities for Atur Pintar
 */

const USER_TIMEZONE = Intl.DateTimeFormat().resolvedOptions().timeZone;
const USER_LOCALE = navigator?.language || "id-ID";

/**
 * Get today's date string in user's local timezone (YYYY-MM-DD)
 */
export function getLocalToday() {
  return new Date().toLocaleDateString("sv-SE", { timeZone: USER_TIMEZONE }); // sv-SE gives YYYY-MM-DD
}

/**
 * Format date as DD MMM YYYY in user's locale
 */
export function formatDate(date) {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString(USER_LOCALE, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: USER_TIMEZONE,
  });
}

/**
 * Format time as HH:mm in user's locale
 */
export function formatTime(date) {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "";
  return d.toLocaleTimeString(USER_LOCALE, {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: USER_TIMEZONE,
  });
}

/**
 * Format date and time together
 */
export function formatDateTime(date) {
  if (!date) return "";
  return `${formatDate(date)}, ${formatTime(date)}`;
}

/**
 * Check if a date string (YYYY-MM-DD) is today in user's local timezone
 */
export function isLocalToday(dateStr) {
  return dateStr === getLocalToday();
}

/**
 * Get current month in YYYY-MM format (local timezone)
 */
export function getLocalMonth() {
  const today = getLocalToday(); // YYYY-MM-DD
  return today.substring(0, 7);
}

/**
 * fetchWithRetry — auto-retry on failure
 */
export async function fetchWithRetry(fn, maxRetries = 2, delayMs = 800) {
  let lastError;
  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (i < maxRetries) {
        await new Promise(r => setTimeout(r, delayMs * (i + 1)));
      }
    }
  }
  throw lastError;
}