/** Extract a readable message from axios / API errors */
export function parseApiError(err, fallback = 'Something went wrong. Please try again.') {
  const data = err?.response?.data;
  if (!data) return err?.message || fallback;
  if (typeof data.message === 'string') return data.message;
  const detail = data.detail;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) {
    return detail.map(d => (typeof d === 'string' ? d : d.msg || String(d))).join('; ');
  }
  return fallback;
}
