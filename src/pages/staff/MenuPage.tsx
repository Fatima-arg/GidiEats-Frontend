import { useEffect, useMemo, useState } from 'react';
import { Pencil, Plus, Trash2, UtensilsCrossed } from 'lucide-react';
import { api, apiMessage, unwrap } from '../../api/client';
import type { Category, FoodItem } from '../../api/types';
import { Button, EmptyState, Field, Input, Select, Spinner, StatusBadge, TextArea } from '../../components/ui';
import { naira } from '../../lib/format';

export function StaffMenu() {
  const [items, setItems] = useState<FoodItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [restaurantId, setRestaurantId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<FoodItem | null>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ name: '', price: '', description: '', isAvailable: true, categoryId: '' });

  const load = async () => {
    try {
      const dash = await api.get('/dashboard');
      const rid = (unwrap(dash as never) as { restaurantId?: number }).restaurantId;
      setRestaurantId(rid ?? null);
      const res = await api.get('/food-items/admin/items', { params: { limit: 100 } });
      const list = unwrap<FoodItem[]>(res as never);
      setItems(Array.isArray(list) ? list : []);
      if (rid) {
        const catRes = await api.get('/categories', { params: { restaurantId: rid, limit: 100 } });
        const cats = unwrap<Category[]>(catRes as never);
        setCategories(Array.isArray(cats) ? cats : []);
      }
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openCreate = () => {
    setCreating(true);
    setEditing(null);
    setForm({ name: '', price: '', description: '', isAvailable: true, categoryId: categories[0] ? String(categories[0].id) : '' });
    setError(null);
  };

  const openEdit = (item: FoodItem) => {
    setEditing(item);
    setCreating(false);
    setForm({ name: item.name, price: String(item.price), description: item.description ?? '', isAvailable: item.isAvailable, categoryId: "" });
    setError(null);
  };

  const save = async () => {
    try {
      setBusy(true);
      setError(null);
      if (creating) {
        if (!restaurantId) throw new Error('Your restaurant could not be resolved.');
        if (!form.categoryId) throw new Error('Please pick a menu category.');
        await api.post('/food-items', {
          restaurantId,
          categoryId: Number(form.categoryId),
          name: form.name.trim(),
          price: Number(form.price),
          description: form.description.trim() || undefined,
          isAvailable: form.isAvailable
        });
      } else if (editing) {
        await api.put(`/food-items/${editing.id}`, {
          name: form.name.trim(),
          price: Number(form.price),
          description: form.description.trim() || undefined,
          isAvailable: form.isAvailable
        });
      }
      setEditing(null);
      setCreating(false);
      await load();
    } catch (e) {
      setError(apiMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const toggleAvailability = async (item: FoodItem) => {
    try {
      await api.put(`/food-items/${item.id}`, { isAvailable: !item.isAvailable });
      await load();
    } catch {
      /* noop */
    }
  };

  const remove = async (item: FoodItem) => {
    if (!window.confirm(`Delete ${item.name}?`)) return;
    try {
      await api.delete(`/food-items/${item.id}`);
      await load();
    } catch (e) {
      setError(apiMessage(e));
    }
  };

  const sorted = useMemo(
    () => [...items].sort((a, b) => Number(b.price) - Number(a.price)),
    [items]
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="page-title">Menu items</h1>
        <Button className="btn-primary" onClick={openCreate}>
          <Plus className="h-4 w-4" /> Add item
        </Button>
      </div>

      {error && <div className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

      {loading && <Spinner label="Loading menu…" />}

      {!loading && (
        <div className="card overflow-hidden">
          {sorted.length === 0 && <EmptyState title="No menu items yet" />}
          <div className="divide-y divide-slate-100">
            {sorted.map((item) => (
              <div key={item.id} className="flex items-center gap-3 p-4">
                {item.image ? (
                  <img src={item.image} alt="" className="h-12 w-12 rounded-xl object-cover" />
                ) : (
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                    <UtensilsCrossed className="h-6 w-6" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-slate-800 truncate">{item.name}</p>
                  <p className="text-sm font-bold text-brand-600">{naira(item.price)}</p>
                </div>
                <StatusBadge status={item.isAvailable ? 'AVAILABLE' : 'UNAVAILABLE'} />
                <button
                  className="p-2 rounded-lg text-slate-400 hover:bg-slate-100"
                  onClick={() => toggleAvailability(item)}
                  title={item.isAvailable ? 'Mark unavailable' : 'Mark available'}
                >
                  <UtensilsCrossed className="h-4 w-4" />
                </button>
                <button className="p-2 rounded-lg text-slate-400 hover:bg-slate-100" onClick={() => openEdit(item)}>
                  <Pencil className="h-4 w-4" />
                </button>
                <button className="p-2 rounded-lg text-slate-300 hover:text-red-500" onClick={() => remove(item)}>
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {(creating || editing) && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40" onClick={() => { setCreating(false); setEditing(null); }} />
          <div className="relative w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl">
            <h2 className="font-bold text-slate-800 mb-4">{editing ? `Edit ${editing.name}` : 'Add menu item'}</h2>
            <div className="space-y-3">
              {creating && (
                <Field label="Category">
                  <Select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
                    {categories.length === 0 && <option value="">No categories yet</option>}
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </Select>
                </Field>
              )}
              <Field label="Name">
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </Field>
              <Field label="Price (₦)">
                <Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
              </Field>
              <Field label="Description">
                <TextArea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
              </Field>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-600">
                <input
                  type="checkbox"
                  checked={form.isAvailable}
                  onChange={(e) => setForm({ ...form, isAvailable: e.target.checked })}
                  className="accent-brand-600"
                />
                Available for ordering
              </label>
              {!creating && <p className="text-xs text-slate-400">Categories cannot be changed after creation.</p>}
              <div className="flex gap-2 pt-1">
                <Button className="btn-primary flex-1" loading={busy} onClick={save}>
                  {editing ? 'Save changes' : 'Create item'}
                </Button>
                <Button className="btn-secondary" onClick={() => { setCreating(false); setEditing(null); }}>
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}