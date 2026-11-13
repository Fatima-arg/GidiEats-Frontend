import { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Area,
  AreaChart
} from 'recharts';
import { api, unwrap } from '../../api/client';
import type { DashboardPayload } from '../../api/types';
import { Spinner } from '../../components/ui';
import { naira, titleCase } from '../../lib/format';
import { ShoppingBag, Timer, Banknote, CheckCircle2, Bike } from 'lucide-react';

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">{label}</span>
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600">{icon}</span>
      </div>
      <p className="mt-2 text-2xl font-extrabold text-slate-800">{value}</p>
    </div>
  );
}

export function StaffDashboard() {
  const [data, setData] = useState<DashboardPayload | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/dashboard')
      .then((res) => setData(unwrap(res as never) as DashboardPayload))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner label="Loading dashboard…" />;
  if (!data) return <p className="text-sm text-slate-500">Unable to load dashboard.</p>;

  const c = data.counts ?? {};
  const r = data.revenue ?? {};
  const charts = data.charts ?? {};

  return (
    <div>
      <h1 className="page-title mb-4">Kitchen dashboard</h1>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <Metric icon={<ShoppingBag className="h-4 w-4" />} label="Total orders" value={String(c.totalOrders ?? 0)} />
        <Metric icon={<Timer className="h-4 w-4" />} label="Pending" value={String(c.pendingOrders ?? 0)} />
        <Metric icon={<Bike className="h-4 w-4" />} label="Ready for pickup" value={String(c.readyForPickup ?? 0)} />
        <Metric icon={<CheckCircle2 className="h-4 w-4" />} label="Delivered" value={String(c.completedOrders ?? 0)} />
        <Metric icon={<Banknote className="h-4 w-4" />} label="Revenue" value={naira(r.total ?? 0)} />
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <div className="card p-5">
          <h2 className="font-bold text-slate-800 mb-3">Sales (last 30 days)</h2>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={(charts.sales30 ?? []).map((d) => ({ ...d, label: d.label.slice(5) }))}>
              <defs>
                <linearGradient id="sales" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ea580c" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#ea580c" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="label" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} width={40} />
              <Tooltip formatter={(v) => naira(v as number)} />
              <Area type="monotone" dataKey="value" stroke="#ea580c" fill="url(#sales)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-5">
          <h2 className="font-bold text-slate-800 mb-3">Order status distribution</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={(charts.statusDistribution ?? []).map((d) => ({ name: titleCase(d.status), count: d.count }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 10 }} tickLine={false} axisLine={false} width={30} />
              <Tooltip />
              <Bar dataKey="count" fill="#f97316" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card p-5 mt-5">
        <h2 className="font-bold text-slate-800 mb-3">Popular items</h2>
        <div className="space-y-2">
          {(charts.popularItems ?? []).map((it) => (
            <div key={String(it.name)} className="flex items-center justify-between text-sm">
              <span className="text-slate-700 font-medium">{String(it.name)}</span>
              <span className="text-slate-400">{it.quantity} sold</span>
            </div>
          ))}
          {(charts.popularItems ?? []).length === 0 && <p className="text-sm text-slate-400">No sales yet.</p>}
        </div>
      </div>
    </div>
  );
}