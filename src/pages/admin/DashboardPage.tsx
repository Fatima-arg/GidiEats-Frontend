import { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { Users, Store, Bike, ShoppingBag, Banknote, Clock } from 'lucide-react';
import { api, unwrap } from '../../api/client';
import type { DashboardPayload } from '../../api/types';
import { EmptyState, Spinner } from '../../components/ui';
import { naira, titleCase } from '../../lib/format';

const PIE_COLORS = ['#f97316', '#0ea5e9', '#10b981', '#8b5cf6', '#f43f5e', '#f59e0b'];

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

export function AdminDashboard() {
  const [data, setData] = useState<DashboardPayload | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/dashboard')
      .then((res) => setData(unwrap(res as never) as DashboardPayload))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner label="Loading overview…" />;
  if (!data) return <p className="text-sm text-slate-500">Unable to load overview.</p>;

  const c = data.counts ?? {};
  const r = data.revenue ?? {};
  const charts = data.charts ?? {};

  return (
    <div>
      <h1 className="page-title mb-4">Platform overview</h1>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Metric icon={<Users className="h-4 w-4" />} label="Customers" value={String(c.totalCustomers ?? 0)} />
        <Metric icon={<Store className="h-4 w-4" />} label="Restaurants" value={String(c.totalRestaurants ?? 0)} />
        <Metric icon={<Bike className="h-4 w-4" />} label="Riders" value={String(c.totalRiders ?? 0)} />
        <Metric icon={<ShoppingBag className="h-4 w-4" />} label="Orders" value={String(c.totalOrders ?? 0)} />
        <Metric icon={<Banknote className="h-4 w-4" />} label="Revenue" value={naira(r.total ?? 0)} />
        <Metric icon={<Banknote className="h-4 w-4" />} label="Today" value={naira(r.today ?? 0)} />
        <Metric icon={<Clock className="h-4 w-4" />} label="Pending approvals" value={String(c.pendingRestaurants ?? 0)} />
        <Metric icon={<Clock className="h-4 w-4" />} label="Live deliveries" value={String(c.activeDeliveries ?? 0)} />
      </div>

      {c.pendingRestaurants > 0 && (
        <a href="/admin/restaurants?status=PENDING" className="mt-4 block rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
          <span className="font-semibold">{c.pendingRestaurants} restaurant{c.pendingRestaurants !== 1 ? 's' : ''} awaiting approval.</span>{' '}
          Review them →
        </a>
      )}

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <div className="card p-5">
          <h2 className="font-bold text-slate-800 mb-3">Sales (30 days)</h2>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={(charts.sales30 ?? []).map((d) => ({ ...d, label: d.label.slice(5) }))}>
              <defs>
                <linearGradient id="asales" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ea580c" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#ea580c" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="label" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} width={40} />
              <Tooltip formatter={(v) => naira(v as number)} />
              <Area type="monotone" dataKey="value" stroke="#ea580c" fill="url(#asales)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-5">
          <h2 className="font-bold text-slate-800 mb-3">Orders (30 days)</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={(charts.orders30 ?? []).map((d) => ({ ...d, label: d.label.slice(5) }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="label" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 10 }} tickLine={false} axisLine={false} width={30} />
              <Tooltip />
              <Bar dataKey="value" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <div className="card p-5">
          <h2 className="font-bold text-slate-800 mb-3">Revenue by restaurant</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              layout="vertical"
              data={(charts.revenueByRestaurant ?? []).map((x) => ({ name: String(x.name).slice(0, 22), value: x.value }))}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis type="number" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
              <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
              <Tooltip formatter={(v) => naira(v as number)} />
              <Bar dataKey="value" fill="#10b981" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-5">
          <h2 className="font-bold text-slate-800 mb-3">Order status distribution</h2>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={(charts.statusDistribution ?? []).map((d) => ({ name: titleCase(d.status), value: d.count }))}
                dataKey="value"
                nameKey="name"
                innerRadius={50}
                outerRadius={85}
                paddingAngle={3}
              >
                {(charts.statusDistribution ?? []).map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card p-5 mt-5">
        <h2 className="font-bold text-slate-800 mb-2">Popular items</h2>
        {(charts.popularItems ?? []).length === 0 && <EmptyState title="No sales yet" />}
        <div className="space-y-2">
          {(charts.popularItems ?? []).map((it) => (
            <div key={String(it.name)} className="flex items-center justify-between text-sm">
              <span className="text-slate-700 font-medium">{String(it.name)}</span>
              <span className="text-slate-400">
                {it.quantity} sold · {naira(it.revenue ?? 0)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}