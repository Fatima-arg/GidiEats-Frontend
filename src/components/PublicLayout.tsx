import { useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Compass, LogOut, ReceiptText, Search, ShoppingBag, User } from 'lucide-react';
import clsx from 'clsx';
import { useCart } from '../store/cart';
import { useAuth } from '../store/auth';
import { BrandMark } from './BrandMark';
import { BottomNav } from './BottomNav';
import { CartBar, CartDrawer } from './CartDrawer';
import { naira } from '../lib/format';

export function PublicLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [drawer, setDrawer] = useState(false);
  const { lines, totalItems } = useCart();
  const location = useLocation();
  const hideTabs = location.pathname.startsWith('/checkout');

  const subtotal = lines.reduce((sum, l) => sum + Number(l.item.price) * l.qty, 0);
  const cartCount = totalItems();

  const mobileTabs = user
    ? [
        { to: '/', label: 'Explore', icon: Compass, end: true },
        { to: '/?focus=search', label: 'Search', icon: Search },
        { to: '/app/orders', label: 'Orders', icon: ReceiptText },
        { to: '/app/profile', label: 'Profile', icon: User }
      ]
    : [
        { to: '/', label: 'Explore', icon: Compass, end: true },
        { to: '/?focus=search', label: 'Search', icon: Search },
        { to: '/track', label: 'Track', icon: ReceiptText },
        { to: '/login', label: 'Account', icon: User }
      ];

  const desktopNav = [
    { to: '/', label: 'Restaurants', end: true },
    { to: '/track', label: 'Track Order' },
    ...(user ? [{ to: '/app/orders', label: 'My Orders' }] : [])
  ];

  return (
    <div className="min-h-dvh bg-slate-50/70 text-slate-800 flex flex-col">
      {/* Sticky Header */}
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 backdrop-blur-md shadow-xs">
        <div className="shell flex h-16 items-center justify-between gap-4">
          <BrandMark />

          {/* Desktop Navigation */}
          <nav className="hidden items-center gap-1.5 md:flex">
            {desktopNav.map((item) => (
              <NavLink
                key={`${item.to}-${item.label}`}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  clsx(
                    'rounded-xl px-3.5 py-2 text-sm font-bold transition-colors',
                    isActive
                      ? 'bg-brand-50 text-brand-700'
                      : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            {!user ? (
              <div className="hidden sm:flex items-center gap-2">
                <Link
                  to="/login"
                  className="rounded-xl px-3.5 py-2 text-sm font-bold text-slate-700 hover:bg-slate-100 transition"
                >
                  Sign in
                </Link>
                <Link
                  to="/register"
                  className="rounded-xl bg-slate-900 px-3.5 py-2 text-sm font-bold text-white hover:bg-slate-800 transition shadow-xs"
                >
                  Register
                </Link>
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-2">
                <Link
                  to="/app/profile"
                  className="flex items-center gap-2 rounded-xl px-3 py-1.5 text-sm font-bold text-slate-700 hover:bg-slate-100 transition"
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-100 text-xs font-black text-brand-700">
                    {user.firstName[0]}
                  </span>
                  <span className="max-w-[120px] truncate">{user.firstName}</span>
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    window.location.href = '/';
                  }}
                  className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 hover:bg-red-50 hover:text-red-600 transition"
                  title="Sign out"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            )}

            {/* Cart Trigger */}
            <button
              type="button"
              onClick={() => setDrawer(true)}
              className={clsx(
                'relative flex h-10 items-center gap-2 rounded-xl px-3.5 text-sm font-bold transition-all shadow-xs',
                cartCount > 0
                  ? 'bg-brand-600 text-white hover:bg-brand-700 shadow-brand-500/20'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              )}
            >
              <ShoppingBag className="h-4 w-4 shrink-0 stroke-[2.2]" />
              <span className="hidden sm:inline">
                {cartCount > 0 ? naira(subtotal) : 'Basket'}
              </span>
              {cartCount > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-slate-900 px-1 text-[11px] font-black text-white">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main
        className={clsx(
          'shell page flex-1',
          hideTabs ? 'pb-8' : cartCount > 0 ? 'pb-12 md:pb-10' : 'pb-8 md:pb-10'
        )}
      >
        {children}
      </main>

      {/* Comprehensive Footer (Unified for both Mobile & Desktop) */}
      <footer className={clsx(
        "mt-auto border-t border-slate-200/90 bg-white/95 backdrop-blur-sm text-slate-600 transition-all",
        hideTabs ? 'pb-8 pt-10' : 'pt-10 pb-28 md:pb-10'
      )}>
        <div className="shell space-y-8">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-12">
            {/* Col 1: Brand & Project Attribution (5 cols) */}
            <div className="space-y-4 md:col-span-5">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-brand-600 to-amber-500 p-0.5 shadow-md shadow-brand-500/20">
                  <img
                    src="/app-icon.png"
                    alt="GidiEats Logo"
                    className="h-full w-full rounded-[14px] object-cover"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-black tracking-tight text-slate-900">GidiEats Kano</span>
                    <span className="rounded-full bg-brand-50 border border-brand-200 px-2 py-0.5 text-[10px] font-extrabold text-brand-700">
                      BUK Campus
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium">Food Ordering & Delivery Management System</p>
                </div>
              </div>

              <div className="rounded-2xl border border-brand-100 bg-brand-50/50 p-4 space-y-1.5 text-xs">
                <div className="flex items-center gap-1.5 font-extrabold text-brand-900">
                  <span className="inline-block h-2 w-2 rounded-full bg-brand-600"></span>
                  <span>Bayero University Kano (BUK) Project</span>
                </div>
                <p className="text-slate-700">
                  Designed & Developed as a Final Year Project by <strong className="text-slate-900 font-bold">Fatima Adam Aminu</strong>.
                </p>
                <p className="text-[11px] text-slate-500">
                  Dedicated to serving students, campus staff, and local restaurants across Kano.
                </p>
              </div>
            </div>

            {/* Col 2: Campus Coverage Areas (4 cols) */}
            <div className="space-y-3 md:col-span-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                Kano & Campus Delivery Zones
              </h3>
              <ul className="grid grid-cols-2 gap-y-1.5 gap-x-2 text-xs text-slate-600">
                <li className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                  <span>BUK New Site</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                  <span>Danbare Bypass</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                  <span>Kofar Kabuga</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                  <span>Jambulo & Royal Plaza</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                  <span>BUK Old Site</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                  <span>Gwarzo Road</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                  <span>Aminu Kano Way</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                  <span>Ungogo Environs</span>
                </li>
              </ul>
            </div>

            {/* Col 3: Portal Navigation & Roles (3 cols) */}
            <div className="space-y-3 md:col-span-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                Quick Navigation
              </h3>
              <ul className="space-y-1.5 text-xs">
                <li>
                  <Link to="/" className="hover:text-brand-600 font-semibold transition">
                    Browse Restaurants & Menus
                  </Link>
                </li>
                <li>
                  <Link to="/track" className="hover:text-brand-600 font-semibold transition">
                    Track Live Delivery
                  </Link>
                </li>
                <li>
                  <Link to="/login" className="hover:text-brand-600 font-semibold transition">
                    Sign in to Account
                  </Link>
                </li>
                <li>
                  <Link to="/register" className="hover:text-brand-600 font-semibold transition">
                    Register Customer Account
                  </Link>
                </li>
                <li>
                  <Link to="/login" className="text-slate-400 hover:text-brand-600 transition">
                    Restaurant Staff & Kitchen Portal
                  </Link>
                </li>
                <li>
                  <Link to="/login" className="text-slate-400 hover:text-brand-600 transition">
                    Rider Delivery Portal
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Copyright & Security Strip */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100 pt-6 text-xs text-slate-500 text-center sm:text-left">
            <div>
              <span className="font-bold text-slate-800">© {new Date().getFullYear()} GidiEats Kano</span>
              <span className="mx-1.5">·</span>
              <span>Final Year Project for Fatima Adam Aminu (BUK Kano)</span>
            </div>
            <div className="flex items-center gap-3 text-[11px] font-medium text-slate-400">
              <span>Flutterwave Secure Payments</span>
              <span>·</span>
              <span>Cash on Delivery</span>
              <span>·</span>
              <span>Kano State, Nigeria</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Mobile Navigation & Floating Cart */}
      {!hideTabs && <BottomNav items={mobileTabs} />}
      {!hideTabs && <CartBar onOpen={() => setDrawer(true)} />}
      <CartDrawer open={drawer} onClose={() => setDrawer(false)} />
    </div>
  );
}
