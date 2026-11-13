import { NavLink } from 'react-router-dom';
import clsx from 'clsx';
import type { LucideIcon } from 'lucide-react';

export interface BottomNavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
}

export function BottomNav({ items }: { items: BottomNavItem[] }) {
  if (!items.length) return null;
  return (
    <nav className="bottom-nav md:hidden shadow-lg shadow-slate-900/10">
      <div
        className="mx-auto grid max-w-md px-2 py-1"
        style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
      >
        {items.map((item) => (
          <NavLink
            key={`${item.to}-${item.label}`}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              clsx(
                'flex min-h-[48px] flex-col items-center justify-center gap-1 rounded-xl py-1 text-[11px] font-bold transition-all',
                isActive
                  ? 'text-brand-600 bg-brand-50/80'
                  : 'text-slate-400 hover:text-slate-600'
              )
            }
          >
            <item.icon className="h-5 w-5 shrink-0 stroke-[2.2]" />
            <span className="leading-none">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
