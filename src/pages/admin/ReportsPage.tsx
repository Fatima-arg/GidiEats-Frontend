import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, Legend } from 'recharts';
import { api, unwrap } from '../../api/client';
import { Spinner } from '../../components/ui';
import { naira, titleCase } from '../../lib/format';

interface Reports {
  totals: { customers: number; restaurants: number; riders: number };
  revenueByRestaurant: { name: string; revenue: number; orders: number }[];
  ordersByRestaurant: { name: string; count: number }[];
  paymentsByMethod: { method: string; count: number; amount: number }[];
}

const COLORS = ['#f97316', '#0ea5e9', '#10b981', '#8b5cf6'];

export function AdminReports() {
  const [data, setData] = useState<Reports | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/dashboard/reports')
      .then((res) => setData(unwrap(res as never) as Reports))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner label="Preparing reports…" />;
  if (!data) return <p className="text-sm text-slate-500">Unable to load reports.</p>;

  return (
    <div>
      <h1 className="page-title mb-4">Reports</h1>

      <div className="grid grid-cols-3 gap-3 mb-6 max-w-lg">
        <div className="card p-4 text-center">
          <p className="text-2xl font-extrabold text-slate-800">{data.totals.customers}</p>
          <p className="text-xs text-slate-400 uppercase tracking-wide mt-1">Customers</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-extrabold text-slate-800">{data.totals.restaurants}</p>
          <p className="text-xs text-slate-400 uppercase tracking-wide mt-1">Restaurants</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-extrabold text-slate-800">{data.totals.riders}</p>
          <p className="text-xs text-slate-400 uppercase tracking-wide mt-1">Riders</p>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2 mb-5">
        <div className="card p-5">
          <h2 className="font-bold text-slate-800 mb-3">Revenue by restaurant</h2>
          {data.revenueByRestaurant.length === 0 ? (
            <p className="text-sm text-slate-400 py-8 text-center">No revenue yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart layout="vertical" data={data.revenueByRestaurant.map((r) => ({ name: String(r.name).slice(0, 20), revenue: r.revenue }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis type="number" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                <Tooltip formatter={(v) => naira(v as number)} />
                <Bar dataKey="revenue" fill="#f97316" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card p-5">
          <h2 className="font-bold text-slate-800 mb-3">Orders by restaurant</h2>
          {data.ordersByRestaurant.length === 0 ? (
            <p className="text-sm text-slate-400 py-8 text-center">No orders yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart layout="vertical" data={data.ordersByRestaurant.map((r) => ({ name: String(r.name).slice(0, 20), count: r.count }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#0ea5e9" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="card p-5">
        <h2 className="font-bold text-slate-800 mb-3">Payments by method</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={data.paymentsByMethod.map((p) => ({ name: titleCase(p.method), value: p.count }))} dataKey="value" nameKey="name" innerRadius={50} outerRadius={85} paddingAngle={3}>
                {data.paymentsByMethod.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2">
            {data.paymentsByMethod.map((p) => (
              <div key={p.method} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-sm">
                <span className="text-slate-600 font-medium">{titleCase(p.method)}</span>
                <span className="text-slate-500">
                  {p.count} payments · <span className="font-bold text-slate-700">{naira(p.amount)}</span>
                </span>
              </div>
            ))}
            {data.paymentsByMethod.length === 0 && <p className="text-sm text-slate-400 py-8 text-center">No payments yet.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}