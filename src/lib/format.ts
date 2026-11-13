export const naira = (value: number | string | null | undefined): string => {
  const n = Number(value) || 0;
  return `₦${n.toLocaleString('en-NG', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
};

export const formatDate = (value?: string | Date | null): string => {
  if (!value) return '—';
  return new Date(value).toLocaleString('en-NG', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const timeAgo = (value?: string | Date | null): string => {
  if (!value) return '—';
  const then = new Date(value).getTime();
  const mins = Math.floor((Date.now() - then) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return formatDate(value);
};

export const initial = (name?: string): string => (name ? name.trim()[0]?.toUpperCase() ?? '?' : '?');

export const titleCase = (s?: string): string =>
  (s || '').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());