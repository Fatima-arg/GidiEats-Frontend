import { useEffect, useState } from 'react';
import { Plus, Store } from 'lucide-react';
import clsx from 'clsx';
import { api, apiMessage, unwrap } from '../../api/client';
import type { Restaurant, User } from '../../api/types';
import { Badge, Button, EmptyState, Field, Input, Select, Spinner } from '../../components/ui';
import { avatarColor } from '../../styles/colors';
import { formatDate } from '../../lib/format';

const ROLES: Array<{ value: string; label: string }> = [
  { value: 'ALL', label: 'All roles' },
  { value: 'RESTAFF', label: 'Staff' },
  { value: 'RIDER', label: 'Riders' },
  { value: 'ADMIN', label: 'Admins' },
  { value: 'CUSTOMER', label: 'Customers' }
];

const ROLE_TONE: Record<string, 'blue' | 'green' | 'purple' | 'orange' | 'slate'> = {
  ADMIN: 'purple',
  RESTAFF: 'orange',
  RIDER: 'blue',
  CUSTOMER: 'green'
};

export function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState('ALL');
  const [showForm, setShowForm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    createRole: 'RIDER' as 'RIDER' | 'RESTAFF' | 'ADMIN',
    restaurantId: '',
    vehicleType: 'BICYCLE',
    position: 'WAITER'
  });

  const load = async (roleFilter: string) => {
    try {
      setLoading(true);
      const roleQ = roleFilter === 'ALL' ? '' : roleFilter;
      const res = await api.get('/users', {
        params: { limit: 100, ...(roleQ ? { role: roleQ } : {}) }
      });
      const data = unwrap<User[]>(res as never);
      setUsers(Array.isArray(data) ? data : []);
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(role);
    api.get('/restaurants', { params: { limit: 100 } }).then((r) => {
      const d = unwrap<Restaurant[]>(r as never);
      setRestaurants(Array.isArray(d) ? d : []);
    }).catch(() => setRestaurants([]));
  }, [role]);

  const toggleActive = async (u: User) => {
    try {
      await api.put(`/users/${u.id}/status`, { isActive: !u.isActive });
      await load(role);
    } catch (e) {
      setError(apiMessage(e));
    }
  };

  const createUser = async () => {
    try {
      setBusy(true);
      setError(null);
      if (!form.firstName.trim() || !form.lastName.trim() || !form.email.trim() || !form.phone.trim() || !form.password) {
        setError('Please fill in all fields.');
        return;
      }
      if (form.createRole === 'RESTAFF' && !form.restaurantId) {
        setError('Please select a restaurant for this staff member.');
        return;
      }
      await api.post('/users', {
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phone: form.phone,
        password: form.password,
        role: form.createRole,
        ...(form.createRole === 'RESTAFF'
          ? { restaurantId: Number(form.restaurantId), position: form.position }
          : {}),
        ...(form.createRole === 'RIDER' ? { vehicleType: form.vehicleType } : {})
      });
      setShowForm(false);
      setForm({ firstName: '', lastName: '', email: '', phone: '', password: '', createRole: 'RIDER', restaurantId: '', vehicleType: 'BICYCLE', position: 'WAITER' });
      await load(role);
    } catch (e) {
      setError(apiMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h1 className="page-title">Users</h1>
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            {ROLES.map((r) => (
              <button
                key={r.value}
                onClick={() => setRole(r.value)}
                className={clsx(
                  'rounded-full px-3 py-1.5 text-xs font-semibold transition',
                  role === r.value ? 'bg-brand-600 text-white' : 'bg-white text-slate-600 border border-slate-200'
                )}
              >
                {r.label}
              </button>
            ))}
          </div>
          <Button className="btn-primary" onClick={() => setShowForm((v) => !v)}>
            <Plus className="h-4 w-4" /> Add user
          </Button>
        </div>
      </div>

      {error && <div className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

      {showForm && (
        <div className="card p-5 mb-5">
          <h2 className="font-bold text-slate-800 mb-4">Create user account</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="First name">
              <Input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
            </Field>
            <Field label="Last name">
              <Input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
            </Field>
            <Field label="Email">
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </Field>
            <Field label="Phone">
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+234…" />
            </Field>
            <Field label="Password">
              <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            </Field>
            <Field label="Role">
              <Select
                value={form.createRole}
                onChange={(e) => setForm({ ...form, createRole: e.target.value as typeof form.createRole })}
              >
                <option value="RIDER">Rider</option>
                <option value="RESTAFF">Restaurant staff</option>
                <option value="ADMIN">Admin</option>
              </Select>
            </Field>
            {form.createRole === 'RESTAFF' && (
              <>
                <Field label="Restaurant">
                  <Select value={form.restaurantId} onChange={(e) => setForm({ ...form, restaurantId: e.target.value })}>
                    <option value="">Select…</option>
                    {restaurants.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Position">
                  <Select value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })}>
                    {['MANAGER', 'CHEF', 'CASHIER', 'WAITER'].map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </Select>
                </Field>
              </>
            )}
            {form.createRole === 'RIDER' && (
              <Field label="Vehicle type">
                <Select value={form.vehicleType} onChange={(e) => setForm({ ...form, vehicleType: e.target.value })}>
                  {['BICYCLE', 'MOTORCYCLE', 'CAR'].map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </Select>
              </Field>
            )}
          </div>
          <div className="mt-4 flex gap-2">
            <Button className="btn-primary" loading={busy} onClick={createUser}>
              Create user
            </Button>
            <Button className="btn-secondary" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {loading && <Spinner label="Loading users…" />}
      {!loading && users.length === 0 && <EmptyState title="No users found" />}

      <div className="card overflow-hidden">
        <div className="divide-y divide-slate-100">
          {users.map((u) => (
            <div key={u.id} className="flex items-center gap-3 p-4">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${avatarColor(u.id)}`}>
                {(u.firstName ?? '?')[0]}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-slate-800 truncate">
                  {u.firstName} {u.lastName}
                </p>
                <p className="text-xs text-slate-400 truncate">
                  {u.email} · {u.phone}
                </p>
                {u.role === 'RESTAFF' && (
                  <p className="mt-0.5 flex items-center gap-1 text-xs font-medium text-brand-700">
                    <Store className="h-3.5 w-3.5" />
                    {u.staff?.restaurant?.name ?? 'No restaurant assigned'}
                    {u.staff?.position ? ` · ${u.staff.position}` : ''}
                  </p>
                )}
                {u.role === 'RIDER' && u.rider?.vehicleType && (
                  <p className="mt-0.5 text-xs text-slate-400">Rider · {u.rider.vehicleType}</p>
                )}
              </div>
              <div className="hidden sm:block text-xs text-slate-400">{formatDate(u.createdAt)}</div>
              <Badge tone={ROLE_TONE[u.role] ?? 'slate'}>{u.role}</Badge>
              <button
                onClick={() => toggleActive(u)}
                className="rounded-lg border border-slate-200 px-2 py-1 text-xs font-semibold"
              >
                {u.isActive === false ? <span className="text-red-600">Disabled</span> : <span className="text-emerald-600">Active</span>}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}