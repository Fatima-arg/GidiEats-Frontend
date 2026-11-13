const COLORS = [
  'bg-brand-600',
  'bg-sky-600',
  'bg-emerald-600',
  'bg-violet-600',
  'bg-rose-600',
  'bg-amber-600',
  'bg-teal-600',
  'bg-indigo-600',
  'bg-fuchsia-600'
];

export const avatarColor = (id?: number | null): string => {
  const idx = (typeof id === 'number' ? id : 0) % COLORS.length;
  return COLORS[idx];
};