import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Ban, Check, Eye, Pencil, Plus, Store } from 'lucide-react';
import clsx from 'clsx';
import { api, apiMessage, unwrap } from '../../api/client';
import type { Restaurant } from '../../api/types';
import { Badge, Button, EmptyState, Field, Input, Spinner, StatusBadge, TextArea } from '../../components/ui';
import { naira } from '../../lib/format';

type Editing = 'new' | Restaurant | null;

const EMPTY_FORM = {
  name: '',
  phone: '',
  email: '',
  addressStreet: '',
  addressCity: '',
  addressState: '',
  cuisineType: '',
  deliveryFee: '',
  deliveryTimeMin: '',
  opensAt: '09:00',
  closesAt: '21:00',
  description: ''
};

export function AdminRestaurants() {
  const [params] = useSearchParams();
  const [rows, setRows] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<Restaurant | null>(null);
  const [editing, setEditing] = useState<Editing>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const status = params.get('status');
      const res = await api.get('/restaurants', {
        params: {
          limit: 100,
          includeInactive: 'true',
          ...(status && { approvalStatus: status })
        }
      });
      const data = unwrap<Restaurant[]>(res as never);
      setRows(Array.isArray(data) ? data : []);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    load();
  }, [load]);

  const setStatus = async (r: Restaurant, approvalStatus: string) => {
    try {
      setBusy(r.id);
      setError(null);
      await api.put(`/restaurants/${r.id}/status`, { approvalStatus });
      await load();
    } catch (e) {
      setError(apiMessage(e));
    } finally {
      setBusy(null);
    }
  };

  const toggleActive = async (r: Restaurant) => {
    try {
      setBusy(r.id);
      setError(null);
      await api.put(`/restaurants/${r.id}/status`, { isActive: !r.isActive });
      await load();
    } catch (e) {
      setError(apiMessage(e));
    } finally {
      setBusy(null);
    }
  };

  const openNew = () => {
    setForm(EMPTY_FORM);
    setEditing('new');
    setError(null);
  };

  const openEdit = (r: Restaurant) => {
    setForm({
      name: r.name,
      phone: r.phone ?? '',
      email: r.email ?? '',
      addressStreet: r.addressStreet ?? '',
      addressCity: r.addressCity ?? '',
      addressState: r.addressState ?? '',
      cuisineType: r.cuisineType ?? '',
      deliveryFee: r.deliveryFee != null ? String(r.deliveryFee) : '',
      deliveryTimeMin: r.deliveryTimeMin != null ? String(r.deliveryTimeMin) : '',
      opensAt: r.opensAt ?? '09:00',
      closesAt: r.closesAt ?? '21:00',
      description: r.description ?? ''
    });
    setEditing(r);
    setError(null);
  };

  const saveRestaurant = async () => {
    if (!form.name.trim() || !form.phone.trim() || !form.addressStreet.trim() || !form.addressCity.trim() || !form.addressState.trim()) {
      setError('Name, phone, street, city and state are required.');
      return;
    }
    try {
      setSaving(true);
      setError(null);
      const payload = {
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim() || undefined,
        addressStreet: form.addressStreet.trim(),
        addressCity: form.addressCity.trim(),
        addressState: form.addressState.trim(),
        cuisineType: form.cuisineType.trim() || undefined,
        description: form.description.trim() || undefined,
        deliveryFee: form.deliveryFee !== '' ? Number(form.deliveryFee) : undefined,
        deliveryTimeMin: form.deliveryTimeMin !== '' ? Number(form.deliveryTimeMin) : undefined,
        opensAt: form.opensAt || undefined,
        closesAt: form.closesAt || undefined
      };
      if (editing === 'new') {
        await api.post('/restaurants', payload);
      } else if (editing) {
        await api.put(`/restaurants/${editing.id}`, payload);
      }
      setEditing(null);
      await load();
    } catch (e) {
      setError(apiMessage(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h1 className="page-title">Restaurants</h1>
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map((s) => (
              <a
                key={s}
                href={`/admin/restaurants${s === 'ALL' ? '' : `?status=${s}`}`}
                className={clsx(
                  'rounded-full px-3 py-1.5 text-xs font-semibold transition',
                  (s === 'ALL' && !params.get('status')) || params.get('status') === s
                    ? 'bg-brand-600 text-white'
                    : 'bg-white text-slate-600 border border-slate-200'
                )}
              >
                {s}
              </a>
            ))}
          </div>
          <Button className="btn-primary" onClick={openNew}>
            <Plus className="h-4 w-4" /> Add restaurant
          </Button>
        </div>
      </div>

      {error && <div className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
      {loading && <Spinner label="Loading restaurants…" />}
      {!loading && rows.length === 0 && <EmptyState title="No restaurants found" />}

      <div className="space-y-3">
        {rows.map((r) => (
          <div key={r.id} className="card p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-700">
                  <Store className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-slate-800 truncate">{r.name}</p>
                  <p className="text-xs text-slate-400">
                    {r.addressCity}, {r.addressState} · {r.cuisineType ?? '—'} · {naira(r.deliveryFee)} delivery
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={r.approvalStatus} />
                <Button className="btn-secondary !py-1.5 text-xs" onClick={() => setView(r)}>
                  <Eye className="h-4 w-4" />
                </Button>
                <Button className="btn-secondary !py-1.5 text-xs" onClick={() => openEdit(r)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                {r.approvalStatus === 'PENDING' && (
                  <>
                    <Button className="btn-primary !py-1.5 text-xs" loading={busy === r.id} onClick={() => setStatus(r, 'APPROVED')}>
                      <Check className="h-4 w-4" /> Approve
                    </Button>
                    <Button className="btn-danger !py-1.5 text-xs" loading={busy === r.id} onClick={() => setStatus(r, 'REJECTED')}>
                      <Ban className="h-4 w-4" /> Reject
                    </Button>
                  </>
                )}
                {r.approvalStatus !== 'PENDING' && (
                  <button
                    onClick={() => toggleActive(r)}
                    className="rounded-lg px-2 py-1 text-xs font-semibold border border-slate-200"
                  >
                    {r.isActive ? <Badge tone="green">Active</Badge> : <Badge tone="red">Disabled</Badge>}
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {view && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40" onClick={() => setView(null)} />
          <div className="relative w-full max-w-lg rounded-2xl bg-white p-5 shadow-2xl">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-slate-800">{view.name}</h2>
              <button className="p-1 text-slate-400" onClick={() => setView(null)}>✕</button>
            </div>
            <dl className="space-y-2 text-sm">
              {[
                ['Phone', view.phone],
                ['Email', view.email],
                ['Address', `${view.addressStreet}, ${view.addressCity}, ${view.addressState}`],
                ['Delivery', `${naira(view.deliveryFee)} · ${view.deliveryTimeMin} min`],
                ['Hours', `${view.opensAt} – ${view.closesAt}`],
                ['Rating', typeof view.rating === 'number' ? `${view.rating.toFixed(1)} (${view.ratingCount ?? 0})` : '—']
              ].map(([k, v]) => (
                <div key={String(k)} className="flex justify-between gap-4">
                  <dt className="text-slate-400">{k}</dt>
                  <dd className="font-medium text-slate-700 text-right">{String(v ?? '—')}</dd>
                </div>
              ))}
              {view.description && <p className="pt-2 text-slate-500">{view.description}</p>}
            </dl>
          </div>
        </div>
      )}

      {editing !== null && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40" onClick={() => setEditing(null)} />
          <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-slate-800">
                {editing === 'new' ? 'Add restaurant' : `Edit ${editing.name}`}
              </h2>
              <button className="p-1 text-slate-400" onClick={() => setEditing(null)}>✕</button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Name">
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Pecancity Restaurant" />
              </Field>
              <Field label="Phone">
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="080…" />
              </Field>
              <Field label="Email" hint="Optional">
                <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="kitchen@gidieats.ng" />
              </Field>
              <Field label="Cuisine" hint="Optional">
                <Input value={form.cuisineType} onChange={(e) => setForm({ ...form, cuisineType: e.target.value })} placeholder="e.g. Nigerian Barbecue" />
              </Field>
              <Field label="Street / area">
                <Input value={form.addressStreet} onChange={(e) => setForm({ ...form, addressStreet: e.target.value })} placeholder="Gwarzo Road, Opposite BUK New Site" />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="City">
                  <Input value={form.addressCity} onChange={(e) => setForm({ ...form, addressCity: e.target.value })} placeholder="BUK New Site" />
                </Field>
                <Field label="State">
                  <Input value={form.addressState} onChange={(e) => setForm({ ...form, addressState: e.target.value })} placeholder="Kano" />
                </Field>
              </div>
              <Field label="Delivery fee (₦)" hint="Optional">
                <Input type="number" min="0" value={form.deliveryFee} onChange={(e) => setForm({ ...form, deliveryFee: e.target.value })} placeholder="500" />
              </Field>
              <Field label="Delivery time (min)" hint="Optional">
                <Input type="number" min="5" value={form.deliveryTimeMin} onChange={(e) => setForm({ ...form, deliveryTimeMin: e.target.value })} placeholder="35" />
              </Field>
              <Field label="Opens (HH:MM)">
                <Input value={form.opensAt} onChange={(e) => setForm({ ...form, opensAt: e.target.value })} placeholder="09:00" />
              </Field>
              <Field label="Closes (HH:MM)">
                <Input value={form.closesAt} onChange={(e) => setForm({ ...form, closesAt: e.target.value })} placeholder="21:00" />
              </Field>
              <div className="sm:col-span-2">
                <Field label="Description" hint="Optional">
                  <TextArea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Short description shown on the storefront" />
                </Field>
              </div>
            </div>
            {error && <div className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
            <div className="mt-4 flex gap-2">
              <Button className="btn-primary" loading={saving} onClick={saveRestaurant}>
                {editing === 'new' ? 'Create restaurant' : 'Save changes'}
              </Button>
              <Button className="btn-secondary" onClick={() => setEditing(null)}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}