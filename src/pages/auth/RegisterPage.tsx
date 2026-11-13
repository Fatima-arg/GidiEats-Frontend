import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Clock, Flame, Sparkles, Star } from 'lucide-react';
import { api, apiMessage, unwrap } from '../../api/client';
import { useAuth } from '../../store/auth';
import { Button, Field, Input } from '../../components/ui';
import { roleHome } from '../../components/Protected';
import type { User } from '../../api/types';

const schema = z
  .object({
    firstName: z.string().trim().min(2, 'First name is required'),
    lastName: z.string().trim().min(2, 'Last name is required'),
    email: z.string().min(1, 'Email is required').email('Enter a valid email'),
    phone: z.string().trim().min(7, 'Enter a valid phone number'),
    password: z.string().regex(/^(?=.*[A-Za-z])(?=.*\d).{8,}$/, 'Password must be 8+ characters with a letter and a digit'),
    confirm: z.string()
  })
  .refine((v) => v.password === v.confirm, { path: ['confirm'], message: 'Passwords do not match' });
type Form = z.infer<typeof schema>;

export function RegisterPage() {
  const navigate = useNavigate();
  const setAuth = useAuth((s) => s.setAuth);
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<Form>({
    resolver: zodResolver(schema),
    mode: 'onTouched',
    shouldUseNativeValidation: false
  });

  const onSubmit = async (values: Form) => {
    try {
      setError(null);
      const res = await api.post('/auth/register', {
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        phone: values.phone,
        password: values.password
      });
      const data = unwrap<{ token: string; user: User }>(res as never);
      setAuth({ token: data.token, user: data.user });
      navigate(roleHome(data.user.role));
    } catch (e) {
      setError(apiMessage(e));
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-12 bg-slate-50/80">
      {/* Left Column: Rich Food Visual Showcase (7 cols on desktop) */}
      <div className="hidden lg:relative lg:col-span-7 lg:flex flex-col justify-between overflow-hidden bg-slate-950 p-12 text-white">
        {/* Background Food Hero Image with Warm Dark Gradient */}
        <div className="absolute inset-0 z-0">
          <img
            src="/food/suya-10-pcs.jpg"
            alt="Spicy Grilled Suya"
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
            <Sparkles className="h-3.5 w-3.5 text-amber-400" /> Fast 25–40m Delivery
          </span>
        </div>

        {/* Middle: Food Showcase & Value Prop */}
        <div className="relative z-10 max-w-xl space-y-6 my-auto">
          <div className="inline-flex items-center gap-2 rounded-full bg-brand-600/30 px-3.5 py-1 text-xs font-black text-amber-300 border border-brand-500/30">
            <Flame className="h-4 w-4 fill-amber-400 text-amber-400" />
            <span>Join Kano & BUK Food Lovers</span>
          </div>

          <h1 className="text-4xl font-black leading-tight sm:text-5xl tracking-tight text-white drop-shadow-sm">
            Fresh food from Kano & BUK's best spots, <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-orange-400 to-amber-200">
              delivered straight to you.
            </span>
          </h1>

          <p className="text-sm text-slate-300 leading-relaxed max-w-lg font-medium">
            Create your account to save your favorite addresses, track orders in real time, and enjoy treats from Pecancity, B-B Treats, Frenchies, TAYBAH & more.
          </p>

          {/* Floating Food Preview Cards */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="flex items-center gap-3 rounded-2xl bg-slate-900/80 p-3 backdrop-blur-md border border-white/10 shadow-lg">
              <img
                src="/food/beef-pizza-large.jpg"
                alt="Beef Pizza"
                className="h-12 w-12 rounded-xl object-cover shrink-0"
              />
              <div className="min-w-0">
                <p className="truncate text-xs font-bold text-white">Frenchies Deluxe Pizza</p>
                <div className="flex items-center gap-1 text-[11px] text-amber-400 mt-0.5">
                  <Star className="h-3 w-3 fill-amber-400" />
                  <span className="font-extrabold">4.8</span>
                  <span className="text-slate-400">(890+)</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-2xl bg-slate-900/80 p-3 backdrop-blur-md border border-white/10 shadow-lg">
              <img
                src="/food/amala-and-ewedu-with-beef.jpg"
                alt="Amala & Ewedu"
                className="h-12 w-12 rounded-xl object-cover shrink-0"
              />
              <div className="min-w-0">
                <p className="truncate text-xs font-bold text-white">Amala, Ewedu & Beef</p>
                <div className="flex items-center gap-1 text-[11px] text-slate-300 mt-0.5">
                  <Clock className="h-3 w-3 text-brand-400" />
                  <span>25 mins · BUK New Site</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400 border-t border-white/10 pt-4">
          <span>Serving BUK New Site, Danbare, Kabuga, Jambulo & Kano</span>
          <span className="font-semibold text-slate-300">© {new Date().getFullYear()} GidiEats Kano · BUK Project by Fatima Adam Aminu</span>
        </div>
      </div>

      {/* Right Column: Register Form (5 cols on desktop) */}
      <div className="lg:col-span-5 flex flex-col justify-center px-6 py-10 sm:px-12 xl:px-16">
        <div className="w-full max-w-md mx-auto space-y-6">
          <div className="text-center space-y-2">
            <Link to="/" className="inline-block group">
              <img
                src="/logo.png"
                alt="GidiEats Food Delivery"
                className="h-14 sm:h-16 w-auto object-contain mx-auto transition-transform group-hover:scale-105 drop-shadow-sm"
              />
            </Link>
            <h2 className="text-2xl font-black text-slate-900 sm:text-3xl">Create your account</h2>
            <p className="text-xs text-slate-500 sm:text-sm">Start ordering from the best kitchens across Kano and BUK campus.</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="card p-6 sm:p-7 space-y-3.5 bg-white shadow-soft" noValidate>
            <div className="grid grid-cols-2 gap-3">
              <Field label="First name">
                <Input autoComplete="given-name" placeholder="Fatima" {...register('firstName')} />
                {errors.firstName && <p className="mt-1 text-xs text-red-600 font-bold">{errors.firstName.message}</p>}
              </Field>
              <Field label="Last name">
                <Input autoComplete="family-name" placeholder="Aminu" {...register('lastName')} />
                {errors.lastName && <p className="mt-1 text-xs text-red-600 font-bold">{errors.lastName.message}</p>}
              </Field>
            </div>
            <Field label="Email">
              <Input type="email" autoComplete="email" placeholder="you@example.com" {...register('email')} />
              {errors.email && <p className="mt-1 text-xs text-red-600 font-bold">{errors.email.message}</p>}
            </Field>
            <Field label="Phone Number">
              <Input type="tel" autoComplete="tel" placeholder="080 0000 0000" {...register('phone')} />
              {errors.phone && <p className="mt-1 text-xs text-red-600 font-bold">{errors.phone.message}</p>}
            </Field>
            <Field label="Password" hint="At least 8 characters with a letter and a number">
              <Input autoComplete="new-password" type="password" placeholder="••••••••" {...register('password')} />
              {errors.password && <p className="mt-1 text-xs text-red-600 font-bold">{errors.password.message}</p>}
            </Field>
            <Field label="Confirm password">
              <Input autoComplete="new-password" type="password" placeholder="••••••••" {...register('confirm')} />
              {errors.confirm && <p className="mt-1 text-xs text-red-600 font-bold">{errors.confirm.message}</p>}
            </Field>
            {error && <div className="rounded-xl bg-red-50 p-3 text-xs font-bold text-red-700 border border-red-200">{error}</div>}
            <Button type="submit" className="btn-primary w-full py-3 text-sm font-extrabold shadow-md shadow-brand-500/20" loading={isSubmitting}>
              Create account & start ordering
            </Button>
          </form>

          <p className="mt-6 text-center text-xs text-slate-500 sm:text-sm">
            Already have an account?{' '}
            <Link to="/login" className="font-extrabold text-brand-600 hover:text-brand-700 hover:underline">
              Sign in
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