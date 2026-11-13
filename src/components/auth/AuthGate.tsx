import { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { UserPlus } from 'lucide-react';
import { api, apiMessage, unwrap } from '../../api/client';
import { useAuth } from '../../store/auth';
import { Button, Field, Input } from '../ui';
import type { User } from '../../api/types';

const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email'),
  password: z.string().min(1, 'Password is required')
});
type LoginForm = z.infer<typeof loginSchema>;

const registerSchema = z.object({
  firstName: z.string().trim().min(2, 'First name is required'),
  lastName: z.string().trim().min(2, 'Last name is required'),
  email: z.string().min(1, 'Email is required').email('Enter a valid email'),
  phone: z.string().trim().min(7, 'Enter a valid phone number'),
  password: z.string().regex(/^(?=.*[A-Za-z])(?=.*\d).{8,}$/, 'Password must be 8+ characters with a letter and a digit')
});
type RegisterForm = z.infer<typeof registerSchema>;

export function AuthGate() {
  const setAuth = useAuth((s) => s.setAuth);
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [error, setError] = useState<string | null>(null);

  const login = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    mode: 'onTouched',
    shouldUseNativeValidation: false
  });
  const register = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    mode: 'onTouched',
    shouldUseNativeValidation: false
  });

  const onLogin = async (values: LoginForm) => {
    try {
      setError(null);
      const res = await api.post('/auth/login', values);
      const data = unwrap<{ token: string; user: User }>(res as never);
      setAuth({ token: data.token, user: data.user });
    } catch (e) {
      setError(apiMessage(e));
    }
  };

  const onRegister = async (values: RegisterForm) => {
    try {
      setError(null);
      const res = await api.post('/auth/register', values);
      const data = unwrap<{ token: string; user: User }>(res as never);
      setAuth({ token: data.token, user: data.user });
    } catch (e) {
      setError(apiMessage(e));
    }
  };

  return (
    <section className="card p-6 mb-5 bg-white shadow-soft">
      {/* Brand & Food Purpose Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-brand-600 to-amber-500 p-0.5 shadow-md shadow-brand-500/20">
            <img src="/app-icon.png" alt="GidiEats" className="h-full w-full rounded-[14px] object-cover" />
          </div>
          <div>
            <h2 className="text-base font-black text-slate-900">Sign in to your GidiEats Account</h2>
            <p className="text-xs text-slate-500">Track deliveries, save favorite addresses, and rate dishes.</p>
          </div>
        </div>

        {/* Food Previews */}
        <div className="hidden sm:flex items-center -space-x-2 shrink-0">
          <img src="/food/chicken-jollof-rice.jpg" alt="Jollof" className="h-9 w-9 rounded-full object-cover ring-2 ring-white shadow-xs" />
          <img src="/food/suya-10-pcs.jpg" alt="Suya" className="h-9 w-9 rounded-full object-cover ring-2 ring-white shadow-xs" />
          <img src="/food/beef-pizza-large.jpg" alt="Pizza" className="h-9 w-9 rounded-full object-cover ring-2 ring-white shadow-xs" />
        </div>
      </div>

      <div className="mb-4 grid grid-cols-2 rounded-xl bg-slate-100 p-1">
        <button
          type="button"
          onClick={() => {
            setMode('login');
            setError(null);
          }}
          className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
            mode === 'login' ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-500'
          }`}
        >
          Sign in
        </button>
        <button
          type="button"
          onClick={() => {
            setMode('register');
            setError(null);
          }}
          className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
            mode === 'register' ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-500'
          }`}
        >
          Create account
        </button>
      </div>

      {mode === 'login' ? (
        <form onSubmit={login.handleSubmit(onLogin)} className="space-y-3" noValidate>
          <Field label="Email">
            <Input type="email" autoComplete="email" placeholder="you@example.com" {...login.register('email')} />
            {login.formState.errors.email && <p className="mt-1 text-xs text-red-600">{login.formState.errors.email.message}</p>}
          </Field>
          <Field label="Password">
            <Input type="password" autoComplete="current-password" placeholder="••••••••" {...login.register('password')} />
            {login.formState.errors.password && <p className="mt-1 text-xs text-red-600">{login.formState.errors.password.message}</p>}
          </Field>
          {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
          <Button type="submit" className="btn-primary w-full" loading={login.formState.isSubmitting}>
            Sign in
          </Button>
        </form>
      ) : (
        <form onSubmit={register.handleSubmit(onRegister)} className="space-y-3" noValidate>
          <div className="grid grid-cols-2 gap-3">
            <Field label="First name">
              <Input autoComplete="given-name" placeholder="Ngozi" {...register.register('firstName')} />
              {register.formState.errors.firstName && (
                <p className="mt-1 text-xs text-red-600">{register.formState.errors.firstName.message}</p>
              )}
            </Field>
            <Field label="Last name">
              <Input autoComplete="family-name" placeholder="Okeke" {...register.register('lastName')} />
              {register.formState.errors.lastName && (
                <p className="mt-1 text-xs text-red-600">{register.formState.errors.lastName.message}</p>
              )}
            </Field>
          </div>
          <Field label="Email">
            <Input type="email" autoComplete="email" placeholder="you@example.com" {...register.register('email')} />
            {register.formState.errors.email && (
              <p className="mt-1 text-xs text-red-600">{register.formState.errors.email.message}</p>
            )}
          </Field>
          <Field label="Phone">
            <Input type="tel" autoComplete="tel" placeholder="+234 800 000 0000" {...register.register('phone')} />
            {register.formState.errors.phone && (
              <p className="mt-1 text-xs text-red-600">{register.formState.errors.phone.message}</p>
            )}
          </Field>
          <Field label="Password" hint="At least 8 characters with a letter and a number">
            <Input autoComplete="new-password" type="password" placeholder="••••••••" {...register.register('password')} />
            {register.formState.errors.password && (
              <p className="mt-1 text-xs text-red-600">{register.formState.errors.password.message}</p>
            )}
          </Field>
          {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
          <Button type="submit" className="btn-primary w-full" loading={register.formState.isSubmitting}>
            <UserPlus className="h-4 w-4" /> Create account & continue
          </Button>
        </form>
      )}

      <p className="mt-4 text-center text-xs text-slate-400">
        Prefer the full forms? <Link to="/login" className="font-semibold text-brand-600 hover:text-brand-700">Sign in</Link> ·{' '}
        <Link to="/register" className="font-semibold text-brand-600 hover:text-brand-700">Create account</Link>
      </p>
    </section>
  );
}