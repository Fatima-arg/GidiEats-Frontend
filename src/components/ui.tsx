import { forwardRef } from 'react';
import { clsx } from 'clsx';
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { Loader2 } from 'lucide-react';

export function Button({
  className,
  loading,
  children,
  disabled,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean; children: ReactNode }) {
  return (
    <button className={className} disabled={disabled || loading} {...props}>
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(({ className, ...props }, ref) => {
  return <input ref={ref} className={clsx('input', className)} {...props} />;
});
Input.displayName = 'Input';

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>((props, ref) => {
  return <select ref={ref} className="input" {...props} />;
});
Select.displayName = 'Select';

export const TextArea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>((props, ref) => {
  return <textarea ref={ref} className="input" {...props} />;
});
TextArea.displayName = 'TextArea';

export function Field({
  label,
  children,
  hint
}: {
  label: string;
  children: ReactNode;
  hint?: ReactNode;
}) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
      {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

export function Badge({ tone = 'slate', children }: { tone?: keyof typeof tones; children: ReactNode }) {
  return <span className={clsx('badge', tones[tone])}>{children}</span>;
}

const tones = {
  slate: 'bg-slate-100 text-slate-700',
  green: 'bg-emerald-100 text-emerald-700',
  red: 'bg-red-100 text-red-700',
  amber: 'bg-amber-100 text-amber-700',
  blue: 'bg-sky-100 text-sky-700',
  purple: 'bg-violet-100 text-violet-700',
  orange: 'bg-brand-100 text-brand-700'
};

const STATUS_TONES: Record<string, keyof typeof tones> = {
  PENDING: 'amber',
  CONFIRMED: 'blue',
  PREPARING: 'purple',
  READY_FOR_PICKUP: 'orange',
  RIDER_ASSIGNED: 'blue',
  PICKED_UP: 'purple',
  OUT_FOR_DELIVERY: 'orange',
  DELIVERED: 'green',
  CANCELLED: 'red',
  REJECTED: 'red',
  SUCCESS: 'green',
  FAILED: 'red',
  DECLINED: 'red',
  ASSIGNED: 'blue',
  ACCEPTED: 'blue',
  AVAILABLE: 'green',
  BUSY: 'amber',
  UNAVAILABLE: 'red',
  ACTIVE: 'green'
};

export function StatusBadge({ status }: { status?: string | null }) {
  return <Badge tone={STATUS_TONES[status ?? ''] ?? 'slate'}>{status ?? '—'}</Badge>;
}

export function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-10 text-slate-400">
      <Loader2 className="h-6 w-6 animate-spin" />
      {label && <span className="text-sm">{label}</span>}
    </div>
  );
}

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="py-10 text-center">
      <p className="text-sm font-medium text-slate-500">{title}</p>
      {children && <div className="mt-2 text-sm text-slate-400">{children}</div>}
    </div>
  );
}

export function Avatar({ name, size = 'md' }: { name?: string; size?: 'sm' | 'md' | 'lg' }) {
  const sizes = { sm: 'h-8 w-8 text-xs', md: 'h-10 w-10 text-sm', lg: 'h-14 w-14 text-lg' };
  return (
    <div
      className={clsx(
        'flex items-center justify-center rounded-full bg-brand-600 font-bold text-white shrink-0',
        sizes[size]
      )}
    >
      {(name?.trim()[0] ?? '?').toUpperCase()}
    </div>
  );
}