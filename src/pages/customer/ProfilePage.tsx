import { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { api, apiMessage, unwrap } from '../../api/client';
import type { Address } from '../../api/types';
import { Button, Field, Input, Spinner } from '../../components/ui';
import { useAuth } from '../../store/auth';
import { avatarColor } from '../../styles/colors';

export function ProfilePage() {
  const { user } = useAuth();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ label: 'Home', phone: '', street: '', city: '', state: '' });

  useEffect(() => {
    api
      .get('/addresses')
      .then((res) => {
        const data = unwrap<Address[]>(res as never);
        setAddresses(Array.isArray(data) ? data : []);
      })
      .catch(() => setAddresses([]))
      .finally(() => setLoading(false));
  }, []);

  const saveAddress = async () => {
    try {
      setSaving(true);
      setError(null);
      const res = await api.post('/addresses', form);
      const created = unwrap<Address>(res as never);
      setAddresses((prev) => [...prev, created]);
      setShowForm(false);
      setForm({ label: 'Home', phone: '', street: '', city: '', state: '' });
    } catch (e) {
      setError(apiMessage(e));
    } finally {
      setSaving(false);
    }
  };

  const removeAddress = async (id: number) => {
    try {
      await api.delete(`/addresses/${id}`);
      setAddresses((prev) => prev.filter((a) => a.id !== id));
    } catch {
      /* noop */
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 sm:text-3xl">My Profile & Addresses</h1>
        <p className="mt-1 text-xs text-slate-500 sm:text-sm">
          Manage your personal details and saved delivery locations across Kano and BUK campus.
        </p>
      </div>

      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
        {/* Left Column: Profile Card (5 cols on desktop) */}
        <div className="space-y-6 lg:col-span-5">
          <section className="card p-6 bg-white space-y-4">
            <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
              <div
                className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-2xl font-black text-white shadow-md ${avatarColor(
                  user?.id
                )}`}
              >
                {(user?.firstName ?? '?')[0]}
              </div>
              <div className="min-w-0">
                <h2 className="text-lg font-black text-slate-900 truncate">
                  {user?.firstName} {user?.lastName}
                </h2>
                <span className="badge bg-brand-50 text-brand-700 text-[10px] mt-0.5">
                  Customer
                </span>
              </div>
            </div>

            <div className="space-y-2.5 text-xs">
              <div>
                <span className="label">Email Address</span>
                <p className="font-bold text-slate-800">{user?.email}</p>
              </div>
              <div>
                <span className="label">Primary Phone</span>
                <p className="font-bold text-slate-800">{user?.phone || 'Not set'}</p>
              </div>
              <div>
                <span className="label">Account Status</span>
                <span className="badge bg-emerald-100 text-emerald-800">Active</span>
              </div>
            </div>
          </section>
        </div>

        {/* Right Column: Saved Addresses (7 cols on desktop) */}
        <div className="space-y-6 lg:col-span-7">
          <section className="card p-6 bg-white space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-base font-extrabold text-slate-900">Saved Addresses</h2>
                <p className="text-xs text-slate-400">For fast, 1-click checkout</p>
              </div>
              <button
                type="button"
                className="inline-flex items-center gap-1 rounded-xl bg-brand-50 px-3 py-1.5 text-xs font-bold text-brand-700 hover:bg-brand-100 transition"
                onClick={() => setShowForm((v) => !v)}
              >
                <Plus className="h-3.5 w-3.5" /> Add New
              </button>
            </div>

            {loading && <Spinner label="Loading saved addresses…" />}

            <div className="space-y-3">
              {addresses.map((a) => (
                <div
                  key={a.id}
                  className="flex items-start justify-between rounded-2xl border border-slate-100 bg-slate-50/50 p-4 hover:border-slate-200 transition"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-black text-slate-800">{a.label}</p>
                      {a.isDefault && (
                        <span className="badge bg-brand-100 text-brand-800 text-[10px]">Default</span>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-slate-600">
                      {a.street}, {a.city}, {a.state}
                    </p>
                    <p className="mt-0.5 text-[11px] font-semibold text-slate-400">
                      Phone: {a.phone}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="p-1.5 text-slate-300 hover:text-red-500 rounded-lg transition"
                    onClick={() => removeAddress(a.id)}
                    title="Delete address"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
              {!loading && addresses.length === 0 && (
                <p className="text-xs text-slate-400 py-6 text-center">
                  You haven't saved any delivery addresses yet. Add one to speed up future orders!
                </p>
              )}
            </div>

            {showForm && (
              <div className="mt-4 space-y-3 rounded-2xl border border-brand-200 bg-brand-50/40 p-4">
                <p className="text-xs font-bold text-slate-800">Add new address</p>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Label">
                    <Input
                      value={form.label}
                      onChange={(e) => setForm({ ...form, label: e.target.value })}
                      placeholder="Home, Work..."
                    />
                  </Field>
                  <Field label="Phone">
                    <Input
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      placeholder="+234…"
                    />
                  </Field>
                </div>
                <Field label="Street Address">
                  <Input
                    value={form.street}
                    onChange={(e) => setForm({ ...form, street: e.target.value })}
                    placeholder="e.g. Nana Hall Block B, BUK New Site"
                  />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="City">
                    <Input
                      value={form.city}
                      onChange={(e) => setForm({ ...form, city: e.target.value })}
                      placeholder="BUK New Site"
                    />
                  </Field>
                  <Field label="State">
                    <Input
                      value={form.state}
                      onChange={(e) => setForm({ ...form, state: e.target.value })}
                      placeholder="Kano"
                    />
                  </Field>
                </div>
                {error && <div className="rounded-xl bg-red-50 p-2.5 text-xs text-red-700">{error}</div>}
                <div className="flex items-center gap-2 pt-1">
                  <Button className="btn-primary text-xs" loading={saving} onClick={saveAddress}>
                    Save address
                  </Button>
                  <Button className="btn-secondary text-xs" onClick={() => setShowForm(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}