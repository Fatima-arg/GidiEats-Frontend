import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Clock, Flame, ShieldCheck, Sparkles, Star, Store, Bike, Users } from 'lucide-react';
import { api, apiMessage, unwrap } from '../../api/client';
import { useAuth } from '../../store/auth';
import { roleHome } from '../../components/Protected';
import { Button, Field, Input } from '../../components/ui';
import type { User } from '../../api/types';

const schema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email'),
  password: z.string().min(1, 'Password is required')
});
type Form = z.infer<typeof schema>;

const CORE_DEMO_ACCOUNTS = [
  { label: 'Customer (Fatima Adam Aminu)', email: 'customer@gidieats.ng', desc: 'BUK Student · Nana Hall', badge: 'Student' },
  { label: 'Admin (Platform Oversight)', email: 'admin@gidieats.ng', desc: 'Full System & Payments Ledger', badge: 'Admin' },
  { label: 'Pecancity Dedicated Rider', email: 'rider1@gidieats.ng', desc: 'In-House Rider · Pecancity', badge: 'Dedicated' },
  { label: 'Freelance Platform Rider', email: 'rider11@gidieats.ng', desc: 'Campus & Kano Freelance Rider', badge: 'Freelance' }
];

const RESTAURANT_DEMO_ACCOUNTS = [
  { name: 'Pecancity Restaurant', email: 'pecancity@gidieats.ng', alt: 'staff1@gidieats.ng', location: 'Opp BUK New Site', cuisine: 'Nigerian Dishes' },
  { name: 'B-B Treats', email: 'bbtreats@gidieats.ng', alt: 'staff2@gidieats.ng', location: 'Danbare BUK', cuisine: 'Fast Food' },
  { name: 'The Cooks Restaurant', email: 'thecooks@gidieats.ng', alt: 'staff3@gidieats.ng', location: 'Danbare Bypass', cuisine: 'Quick Meals' },
  { name: 'TAYBAH Restaurant', email: 'taybah@gidieats.ng', alt: 'staff4@gidieats.ng', location: 'Jambulo / Kabuga', cuisine: 'Arab Grills' },
  { name: 'Frenchies Restaurant', email: 'frenchies@gidieats.ng', alt: 'staff5@gidieats.ng', location: 'Kofar Kabuga', cuisine: 'Pizza & Steak' },
  { name: 'Anisa Restaurant & Lounge', email: 'anisa@gidieats.ng', alt: 'staff6@gidieats.ng', location: 'Kofar Kabuga', cuisine: 'Burgers & Pasta' },
  { name: 'KFC Kabuga', email: 'kfc@gidieats.ng', alt: 'staff7@gidieats.ng', location: '22 Gwarzo Road', cuisine: 'Fried Chicken' },
  { name: 'Royal Taste Restaurant', email: 'royaltaste@gidieats.ng', alt: 'staff8@gidieats.ng', location: 'Kofar Kabuga', cuisine: 'Kebabs & Suya' },
  { name: 'Dee_Royale Eatery', email: 'deeroyale@gidieats.ng', alt: 'staff9@gidieats.ng', location: 'TAT Plaza Kabuga', cuisine: 'Chinese Rice' },
  { name: 'Katforex Restaurant', email: 'katforex@gidieats.ng', alt: 'staff10@gidieats.ng', location: 'Aminu Kano Way', cuisine: 'Shawarma & Wings' }
];

const RIDER_DEMO_ACCOUNTS = [
  { name: 'Pecancity Dedicated Rider', email: 'rider1@gidieats.ng', type: 'Dedicated In-House', spot: 'Pecancity (BUK New Site)' },
  { name: 'B-B Treats Dedicated Rider', email: 'rider2@gidieats.ng', type: 'Dedicated In-House', spot: 'B-B Treats (Danbare)' },
  { name: 'The Cooks Dedicated Rider', email: 'rider3@gidieats.ng', type: 'Dedicated In-House', spot: 'The Cooks (Danbare)' },
  { name: 'TAYBAH Dedicated Rider', email: 'rider4@gidieats.ng', type: 'Dedicated In-House', spot: 'TAYBAH (Jambulo)' },
  { name: 'Frenchies Dedicated Rider', email: 'rider5@gidieats.ng', type: 'Dedicated In-House', spot: 'Frenchies (Kabuga)' },
  { name: 'Anisa Dedicated Rider', email: 'rider6@gidieats.ng', type: 'Dedicated In-House', spot: 'Anisa Lounge (Kabuga)' },
  { name: 'KFC Dedicated Rider', email: 'rider7@gidieats.ng', type: 'Dedicated In-House', spot: 'KFC (Kabuga)' },
  { name: 'Freelance Platform Rider #1', email: 'rider11@gidieats.ng', type: 'Freelance / Unlinked', spot: 'BUK New Site & Danbare' },
  { name: 'Freelance Platform Rider #2', email: 'rider12@gidieats.ng', type: 'Freelance / Unlinked', spot: 'Kofar Kabuga & Gwarzo Rd' },
  { name: 'Freelance Platform Rider #3', email: 'rider13@gidieats.ng', type: 'Freelance / Unlinked', spot: 'All Kano Campuses' }
];

export function LoginPage() {
  const navigate = useNavigate();
  const setAuth = useAuth((s) => s.setAuth);
  const [error, setError] = useState<string | null>(null);
  const [demoTab, setDemoTab] = useState<'roles' | 'restaurants' | 'riders'>('roles');
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<Form>({
    resolver: zodResolver(schema),
    mode: 'onTouched',
    shouldUseNativeValidation: false
  });

  const onSubmit = async (values: Form) => {
    try {
      setError(null);
      const res = await api.post('/auth/login', values);
      const data = unwrap<{ token: string; user: User }>(res as never);
      setAuth({ token: data.token, user: data.user });
      navigate(roleHome(data.user.role));
    } catch (e) {
      setError(apiMessage(e));
    }
  };

  const fillDemo = (email: string) => {
    setValue('email', email, { shouldValidate: true });
    setValue('password', 'Demo@123', { shouldValidate: true });
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-12 bg-slate-50/80">
      {/* Left Column: Rich Food Visual Showcase (7 cols on desktop) */}
      <div className="hidden lg:relative lg:col-span-7 lg:flex flex-col justify-between overflow-hidden bg-slate-950 p-12 text-white">
        {/* Background Food Hero Image with Warm Dark Gradient */}
        <div className="absolute inset-0 z-0">
          <img
            src="/food/chicken-jollof-rice.jpg"
            alt="Delicious Nigerian Jollof Rice"
            className="h-full w-full object-cover object-center opacity-45 scale-105 filter saturate-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/75 to-slate-950/40" />
        </div>

        {/* Top: Main App Logo */}
        <div className="relative z-10 flex items-center justify-between">
          <Link to="/" className="inline-block group">
            <img
              src="/logo.png"
              alt="GidiEats Food Delivery"
              className="h-16 w-auto object-contain drop-shadow-xl transition-transform group-hover:scale-105"
            />
          </Link>
          <span className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-extrabold text-amber-300 backdrop-blur-md border border-white/10">
            <Sparkles className="h-3.5 w-3.5 text-amber-400" /> BUK Campus & Kano Food Treats App
          </span>
        </div>

        {/* Middle: Food Showcase & Taglines */}
        <div className="relative z-10 max-w-xl space-y-6 my-auto">
          <div className="inline-flex items-center gap-2 rounded-full bg-brand-600/30 px-3.5 py-1 text-xs font-black text-amber-300 border border-brand-500/30">
            <Flame className="h-4 w-4 fill-amber-400 text-amber-400" />
            <span>Hot, Smoky & Fresh to Your Doorstep</span>
          </div>

          <h1 className="text-4xl font-black leading-tight sm:text-5xl tracking-tight text-white drop-shadow-sm">
            Craving real flavor? <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-orange-400 to-amber-200">
              Delivered in 20–35 mins.
            </span>
          </h1>

          <p className="text-sm text-slate-300 leading-relaxed max-w-lg font-medium">
            Order authentic dishes like steaming Party Jollof, Tuwon Shinkafa with Miyan Taushe, Egusi with Pounded Yam, peppered Suya, and artisan pizzas & burgers from top kitchens across Kano and near BUK New Site.
          </p>

          {/* Floating Food Preview Cards */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="flex items-center gap-3 rounded-2xl bg-slate-900/80 p-3 backdrop-blur-md border border-white/10 shadow-lg">
              <img
                src="/food/chicken-jollof-rice.jpg"
                alt="Chicken Jollof"
                className="h-12 w-12 rounded-xl object-cover shrink-0"
              />
              <div className="min-w-0">
                <p className="truncate text-xs font-bold text-white">Party Jollof & Chicken</p>
                <div className="flex items-center gap-1 text-[11px] text-amber-400 mt-0.5">
                  <Star className="h-3 w-3 fill-amber-400" />
                  <span className="font-extrabold">4.9</span>
                  <span className="text-slate-400">(1,240+)</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-2xl bg-slate-900/80 p-3 backdrop-blur-md border border-white/10 shadow-lg">
              <img
                src="/food/suya-10-pcs.jpg"
                alt="Peppered Suya"
                className="h-12 w-12 rounded-xl object-cover shrink-0"
              />
              <div className="min-w-0">
                <p className="truncate text-xs font-bold text-white">Spicy Peppered Suya</p>
                <div className="flex items-center gap-1 text-[11px] text-slate-300 mt-0.5">
                  <Clock className="h-3 w-3 text-brand-400" />
                  <span>25 mins · BUK New Site</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom: Social Proof Footer */}
        <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400 border-t border-white/10 pt-4">
          <span>Serving BUK New Site, Danbare, Kabuga, Jambulo & Kano</span>
          <span className="font-semibold text-slate-300">© {new Date().getFullYear()} GidiEats Kano · BUK</span>
        </div>
      </div>

      {/* Right Column: Sign In Form (5 cols on desktop) */}
      <div className="lg:col-span-5 flex flex-col justify-center px-6 py-10 sm:px-12 xl:px-16">
        <div className="w-full max-w-md mx-auto space-y-6">
          {/* Logo prominently shown */}
          <div className="text-center space-y-2">
            <Link to="/" className="inline-block group">
              <img
                src="/logo.png"
                alt="GidiEats Food Delivery"
                className="h-14 sm:h-16 w-auto object-contain mx-auto transition-transform group-hover:scale-105 drop-shadow-sm"
              />
            </Link>
            <h2 className="text-2xl font-black text-slate-900 sm:text-3xl">Welcome back</h2>
            <p className="text-xs text-slate-500 sm:text-sm">
              Sign in to order food, track riders, and manage your kitchen.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="card p-6 sm:p-7 space-y-4 bg-white shadow-soft" noValidate>
            <Field label="Email Address">
              <div className="relative">
                <Input
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  className="pl-3.5"
                  {...register('email')}
                />
              </div>
              {errors.email && <p className="mt-1 text-xs text-red-600 font-bold">{errors.email.message}</p>}
            </Field>

            <Field label="Password">
              <Input
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                {...register('password')}
              />
              {errors.password && <p className="mt-1 text-xs text-red-600 font-bold">{errors.password.message}</p>}
            </Field>

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-bold text-red-700">
                {error}
              </div>
            )}

            <Button type="submit" className="btn-primary w-full py-3 text-sm font-extrabold shadow-md shadow-brand-500/20" loading={isSubmitting}>
              Sign in to GidiEats
            </Button>
          </form>

          {/* Quick Demo Sign-Ins */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-4 space-y-3 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-brand-600" /> 1-Click Demo Accounts
              </span>
              <span className="text-[10px] font-mono font-bold text-slate-400">PW: Demo@123</span>
            </div>

            {/* Switcher Tabs */}
            <div className="flex rounded-xl bg-slate-100 p-1 text-[11px] font-bold">
              <button
                type="button"
                onClick={() => setDemoTab('roles')}
                className={`flex-1 py-1.5 rounded-lg transition flex items-center justify-center gap-1 ${
                  demoTab === 'roles' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Users className="h-3 w-3" /> Core Roles
              </button>
              <button
                type="button"
                onClick={() => setDemoTab('restaurants')}
                className={`flex-1 py-1.5 rounded-lg transition flex items-center justify-center gap-1 ${
                  demoTab === 'restaurants' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Store className="h-3 w-3" /> All 10 Restaurants
              </button>
              <button
                type="button"
                onClick={() => setDemoTab('riders')}
                className={`flex-1 py-1.5 rounded-lg transition flex items-center justify-center gap-1 ${
                  demoTab === 'riders' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Bike className="h-3 w-3" /> Riders
              </button>
            </div>

            {/* Tab 1: Core Roles */}
            {demoTab === 'roles' && (
              <div className="grid grid-cols-2 gap-2">
                {CORE_DEMO_ACCOUNTS.map((acc) => (
                  <button
                    key={acc.email}
                    type="button"
                    onClick={() => fillDemo(acc.email)}
                    className="flex flex-col rounded-xl border border-slate-100 bg-slate-50/80 p-2.5 text-left hover:border-brand-400 hover:bg-brand-50/60 transition active:scale-98 group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold uppercase tracking-wide text-brand-600">{acc.badge}</span>
                    </div>
                    <span className="text-xs font-bold text-slate-800 group-hover:text-brand-600 truncate">{acc.label}</span>
                    <span className="text-[10px] text-slate-500 truncate">{acc.desc}</span>
                    <span className="text-[9px] font-mono text-slate-400 mt-1 truncate">{acc.email}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Tab 2: All 10 Restaurants */}
            {demoTab === 'restaurants' && (
              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                {RESTAURANT_DEMO_ACCOUNTS.map((r, i) => (
                  <button
                    key={r.email}
                    type="button"
                    onClick={() => fillDemo(r.email)}
                    className="flex w-full items-center justify-between rounded-xl border border-slate-100 bg-slate-50/80 px-2.5 py-2 text-left hover:border-brand-400 hover:bg-brand-50/60 transition active:scale-98 group"
                  >
                    <div className="min-w-0 pr-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold text-brand-700 bg-brand-50 px-1 rounded">#{i + 1}</span>
                        <span className="text-xs font-bold text-slate-800 group-hover:text-brand-600 truncate">{r.name}</span>
                      </div>
                      <p className="text-[10px] text-slate-400 truncate">{r.location} · {r.cuisine}</p>
                    </div>
                    <span className="shrink-0 text-[10px] font-mono font-medium text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                      {r.email}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* Tab 3: Riders */}
            {demoTab === 'riders' && (
              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                {RIDER_DEMO_ACCOUNTS.map((rd) => (
                  <button
                    key={rd.email}
                    type="button"
                    onClick={() => fillDemo(rd.email)}
                    className="flex w-full items-center justify-between rounded-xl border border-slate-100 bg-slate-50/80 px-2.5 py-2 text-left hover:border-brand-400 hover:bg-brand-50/60 transition active:scale-98 group"
                  >
                    <div className="min-w-0 pr-2">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded ${
                          rd.type.includes('Dedicated')
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-indigo-100 text-indigo-800'
                        }`}>
                          {rd.type}
                        </span>
                        <span className="text-xs font-bold text-slate-800 group-hover:text-brand-600 truncate">{rd.name}</span>
                      </div>
                      <p className="text-[10px] text-slate-400 truncate">{rd.spot}</p>
                    </div>
                    <span className="shrink-0 text-[10px] font-mono font-medium text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                      {rd.email}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Create account link */}
          <p className="text-center text-xs text-slate-500 sm:text-sm">
            New to GidiEats?{' '}
            <Link to="/register" className="font-extrabold text-brand-600 hover:text-brand-700 hover:underline">
              Create an account
            </Link>
          </p>

          <div className="text-center">
            <Link to="/" className="text-xs font-semibold text-slate-400 hover:text-slate-600">
              ← Continue browsing as guest
            </Link>
          </div>

          {/* Project Footnote */}
          <div className="border-t border-slate-100 pt-4 text-center text-[11px] text-slate-400">
            <p className="font-semibold text-slate-600">GidiEats Kano · BUK Campus Food Delivery</p>
            <p className="mt-0.5">Final Year Project by Fatima Adam Aminu (Bayero University Kano)</p>
          </div>
        </div>
      </div>
    </div>
  );
}