import clsx from 'clsx';
import { NavLink, useNavigate } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import { LogOut } from 'lucide-react';
import { useAuth } from '../store/auth';
import { Avatar } from './ui';
import { BrandMark } from './BrandMark';
import { BottomNav } from './BottomNav';
import type { Role } from '../api/types';

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
}

const BRAND_ROLE: Record<Role, string> = {
  CUSTOMER: 'Customer',
  RESTAFF: 'Kitchen',
  RIDER: 'Rider',
  ADMIN: 'Admin'
};

export function DashboardLayout({ nav, children }: { nav: NavItem[]; children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const home = nav[0]?.to ?? '/';

  return (
    <div className="min-h-dvh bg-slate-50/70 text-slate-800 md:flex">
      {/* Desktop Sidebar */}
      <aside className="fixed inset-y-0 z-30 hidden w-60 shrink-0 border-r border-slate-200/80 bg-white md:block shadow-xs">
        <div className="flex h-full flex-col">
          <div className="border-b border-slate-100 px-5 py-4 flex items-center h-16">
            <BrandMark to={home} subtitle={user ? BRAND_ROLE[user.role] : undefined} />
          </div>
          <nav className="flex-1 space-y-1.5 overflow-y-auto px-3.5 py-4">
            {nav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  clsx(
                    'flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-bold transition-all',
                    isActive
                      ? 'bg-brand-600 text-white shadow-sm shadow-brand-500/20'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  )
                }
              >
                <item.icon className="h-4 w-4 shrink-0 stroke-[2.2]" />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>
          <div className="border-t border-slate-100 p-3.5 space-y-2">
            <div className="rounded-xl border border-brand-100 bg-brand-50/50 p-2.5 text-[11px] text-slate-600">
              <div className="flex items-center gap-1.5 font-bold text-slate-800">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-600"></span>
                <span>BUK Kano Project</span>
              </div>
              <p className="mt-0.5 text-[10px] text-slate-500">Fatima Adam Aminu</p>
            </div>
            <button
              type="button"
              className="flex w-full items-center gap-2.5 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-500 hover:bg-red-50 hover:text-red-600 transition"
              onClick={() => {
                logout();
                navigate('/login');
              }}
            >
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          </div>
        </div>
      </aside>

      {/* Main Area */}
      <div className="min-w-0 flex-1 md:pl-60 flex flex-col">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-3 border-b border-slate-200/80 bg-white/95 px-4 sm:px-6 backdrop-blur-md shadow-2xs">
          <div className="md:hidden">
            <BrandMark to={home} subtitle={user ? BRAND_ROLE[user.role] : undefined} />
          </div>
          <div className="ml-auto flex items-center gap-3">
            {user && (
              <div className="hidden text-right leading-tight sm:block">
                <div className="flex items-center gap-1.5 justify-end">
                  <span className="text-xs font-black text-slate-800">
                    {user.firstName} {user.lastName}
                  </span>
                  <span className="badge bg-brand-100 text-brand-800 text-[10px]">
                    {BRAND_ROLE[user.role]}
                  </span>
                </div>
                <p className="text-[11px] font-medium text-slate-400">{user.email}</p>
              </div>
            )}
            <Avatar name={user ? `${user.firstName} ${user.lastName}` : '?'} size="sm" />
            <button
              type="button"
              className="hidden rounded-xl p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 md:inline-flex transition"
              title="Sign out"
              onClick={() => {
                logout();
                navigate('/login');
              }}
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </header>

        <main className="page shell flex-1 pb-24 md:pb-10">
          {children}
        </main>

        {/* Dashboard Footer (Admin, Staff, Rider) */}
        <footer className="mt-auto border-t border-slate-200/80 bg-white/70 py-4 px-4 sm:px-6 text-xs text-slate-500 pb-24 md:pb-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
            <div>
              <span className="font-bold text-slate-800">GidiEats Kano</span>
              <span className="mx-1.5">·</span>
              <span>BUK Campus Food Delivery Management System</span>
            </div>
            <div className="text-[11px] text-slate-500">
              Final Year Project · <strong className="text-slate-700">Fatima Adam Aminu</strong> (Bayero University Kano)
            </div>
          </div>
        </footer>
      </div>

      <BottomNav items={nav} />
    </div>
  );
}
