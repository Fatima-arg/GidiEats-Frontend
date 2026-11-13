import { Link } from 'react-router-dom';

export function BrandMark({
  to = '/',
  subtitle,
  variant = 'icon',
  className = ''
}: {
  to?: string;
  subtitle?: string;
  variant?: 'icon' | 'full';
  className?: string;
}) {
  if (variant === 'full') {
    return (
      <Link to={to} className={`group inline-flex items-center ${className}`}>
        <img
          src="/logo.png"
          alt="GidiEats Food Delivery"
          className="h-10 w-auto object-contain transition-transform group-hover:scale-105"
        />
      </Link>
    );
  }

  return (
    <Link to={to} className={`group flex min-w-0 items-center gap-2.5 ${className}`}>
      <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-brand-600 to-amber-500 p-0.5 shadow-md shadow-brand-500/20 transition-transform group-hover:scale-105">
        <img
          src="/app-icon.png"
          alt="GidiEats Icon"
          className="h-full w-full rounded-[14px] object-cover"
        />
      </div>
      <div className="min-w-0 leading-tight">
        <div className="flex items-center gap-1.5">
          <span className="truncate text-lg font-black tracking-tight text-slate-900 group-hover:text-brand-600 transition-colors">
            GidiEats
          </span>
          <span className="hidden sm:inline-flex rounded-md bg-brand-50 px-1.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-brand-700">
            Kano · BUK
          </span>
        </div>
        {subtitle ? (
          <p className="truncate text-xs font-semibold text-slate-500">{subtitle}</p>
        ) : (
          <p className="truncate text-[11px] font-medium text-slate-400">Fresh treats · 25–40m</p>
        )}
      </div>
    </Link>
  );
}
