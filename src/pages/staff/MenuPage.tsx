import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Loader2, Pencil, Plus, Search, Trash2, Upload, UtensilsCrossed } from 'lucide-react';
import clsx from 'clsx';
import { api, apiMessage, resolveImageUrl, unwrap } from '../../api/client';
import type { Category, FoodItem, Restaurant } from '../../api/types';
import { Button, EmptyState, Field, Input, Select, Spinner, StatusBadge, TextArea } from '../../components/ui';
import { naira } from '../../lib/format';
import { useAuth } from '../../store/auth';

export function StaffMenu() {
  const user = useAuth((s) => s.user);
  const isAdmin = user?.role === 'ADMIN';
  const [searchParams, setSearchParams] = useSearchParams();

  const [items, setItems] = useState<FoodItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [restaurantId, setRestaurantId] = useState<number | null>(() => {
    const p = searchParams.get('restaurantId');
    return p ? Number(p) : null;
  });
  const [currentRestaurantName, setCurrentRestaurantName] = useState<string>('');

  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<FoodItem | null>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('ALL');

  const [form, setForm] = useState({
    name: '',
    price: '',
    description: '',
    image: '',
    isAvailable: true,
    categoryId: ''
  });

  // Load restaurants list if admin
  useEffect(() => {
    if (!isAdmin) return;
    (async () => {
      try {
        const res = await api.get('/restaurants', { params: { limit: 100 } });
        const list = unwrap<Restaurant[]>(res as never);
        if (Array.isArray(list)) {
          setRestaurants(list);
          // If no restaurantId set yet, default to first restaurant
          if (!restaurantId && list.length > 0) {
            setRestaurantId(list[0].id);
          }
        }
      } catch {
        /* noop */
      }
    })();
  }, [isAdmin]);

  const load = useCallback(async (targetRestaurantId?: number | null) => {
    try {
      setLoading(true);
      setError(null);
      let rid = targetRestaurantId ?? restaurantId;

      if (!isAdmin) {
        // Staff loads restaurantId from dashboard
        const dash = await api.get('/dashboard');
        const dData = (unwrap(dash as never) as { restaurantId?: number; restaurant?: { name?: string } });
        rid = dData?.restaurantId ?? null;
        setRestaurantId(rid);
        if (dData?.restaurant?.name) {
          setCurrentRestaurantName(dData.restaurant.name);
        }
      }

      if (rid) {
        // Load menu items for this restaurant
        const res = await api.get('/food-items/admin/items', {
          params: { restaurantId: rid, limit: 100 }
        });
        const list = unwrap<FoodItem[]>(res as never);
        setItems(Array.isArray(list) ? list : []);

        // Load categories for this restaurant
        const catRes = await api.get('/categories', { params: { restaurantId: rid, limit: 100 } });
        const cats = unwrap<Category[]>(catRes as never);
        setCategories(Array.isArray(cats) ? cats : []);
      } else {
        // If admin hasn't picked a restaurant yet or no restaurant linked
        const res = await api.get('/food-items/admin/items', { params: { limit: 100 } });
        const list = unwrap<FoodItem[]>(res as never);
        setItems(Array.isArray(list) ? list : []);
      }
    } catch (e) {
      setError(apiMessage(e));
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [isAdmin, restaurantId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleRestaurantChange = (newRid: number) => {
    setRestaurantId(newRid);
    setSearchParams({ restaurantId: String(newRid) });
    load(newRid);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    try {
      setUploadingImage(true);
      setError(null);
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const data = unwrap<{ url: string }>(res as never);
      if (data?.url) {
        setForm((prev) => ({ ...prev, image: data.url }));
      }
    } catch (err) {
      setError(apiMessage(err));
    } finally {
      setUploadingImage(false);
    }
  };

  const openCreate = () => {
    setCreating(true);
    setEditing(null);
    setForm({
      name: '',
      price: '',
      description: '',
      image: '',
      isAvailable: true,
      categoryId: categories[0] ? String(categories[0].id) : ''
    });
    setError(null);
  };

  const openEdit = (item: FoodItem) => {
    setEditing(item);
    setCreating(false);
    setForm({
      name: item.name,
      price: String(item.price),
      description: item.description ?? '',
      image: item.image ?? '',
      isAvailable: item.isAvailable,
      categoryId: item.categoryId ? String(item.categoryId) : (categories[0] ? String(categories[0].id) : '')
    });
    setError(null);
  };

  const save = async () => {
    try {
      setBusy(true);
      setError(null);

      const targetRid = restaurantId;
      if (!targetRid && creating) {
        throw new Error('Please select a restaurant first.');
      }
      if (!form.name.trim()) {
        throw new Error('Please enter the menu item name.');
      }
      if (!form.price || Number(form.price) <= 0) {
        throw new Error('Please enter a valid price greater than 0.');
      }

      const payload: Record<string, unknown> = {
        name: form.name.trim(),
        price: Number(form.price),
        description: form.description.trim() || undefined,
        image: form.image.trim() || null,
        isAvailable: form.isAvailable
      };

      if (creating) {
        if (!form.categoryId) throw new Error('Please pick a menu category.');
        payload.restaurantId = targetRid;
        payload.categoryId = Number(form.categoryId);
        await api.post('/food-items', payload);
      } else if (editing) {
        if (form.categoryId) {
          payload.categoryId = Number(form.categoryId);
        }
        await api.put(`/food-items/${editing.id}`, payload);
      }

      setEditing(null);
      setCreating(false);
      await load(targetRid);
    } catch (e) {
      setError(apiMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const toggleAvailability = async (item: FoodItem) => {
    try {
      await api.put(`/food-items/${item.id}`, { isAvailable: !item.isAvailable });
      await load(restaurantId);
    } catch {
      /* noop */
    }
  };

  const remove = async (item: FoodItem) => {
    if (!window.confirm(`Delete "${item.name}" from the menu?`)) return;
    try {
      await api.delete(`/food-items/${item.id}`);
      await load(restaurantId);
    } catch (e) {
      setError(apiMessage(e));
    }
  };

  const filteredItems = useMemo(() => {
    return items.filter((it) => {
      const matchesSearch = !searchQuery.trim() || it.name.toLowerCase().includes(searchQuery.toLowerCase().trim());
      const matchesCat = selectedCategoryFilter === 'ALL' || String(it.categoryId) === selectedCategoryFilter;
      return matchesSearch && matchesCat;
    });
  }, [items, searchQuery, selectedCategoryFilter]);

  const sorted = useMemo(
    () => [...filteredItems].sort((a, b) => Number(b.price) - Number(a.price)),
    [filteredItems]
  );

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h1 className="page-title">Menu items</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {isAdmin ? 'Manage food items across restaurants' : currentRestaurantName ? `${currentRestaurantName} menu` : 'Manage your restaurant menu items and prices'}
          </p>
        </div>
        <Button className="btn-primary" onClick={openCreate} disabled={isAdmin && !restaurantId}>
          <Plus className="h-4 w-4" /> Add item
        </Button>
      </div>

      {isAdmin && (
        <div className="mb-4 p-3 bg-brand-50/50 rounded-2xl border border-brand-100 flex flex-wrap items-center gap-3">
          <span className="text-xs font-bold text-brand-800 uppercase tracking-wider">Restaurant:</span>
          <div className="min-w-[220px] flex-1">
            <Select
              value={restaurantId ? String(restaurantId) : ''}
              onChange={(e) => handleRestaurantChange(Number(e.target.value))}
            >
              {restaurants.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} ({r.addressCity})
                </option>
              ))}
            </Select>
          </div>
          <span className="text-xs text-slate-400 font-medium">
            {items.length} items registered
          </span>
        </div>
      )}

      {error && <div className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

      {/* Filter and search bar */}
      <div className="flex flex-wrap gap-2.5 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search items by name…"
            className="!pl-9 text-sm"
          />
        </div>
        {categories.length > 0 && (
          <div className="min-w-[150px]">
            <Select
              value={selectedCategoryFilter}
              onChange={(e) => setSelectedCategoryFilter(e.target.value)}
              className="text-sm"
            >
              <option value="ALL">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={String(c.id)}>
                  {c.name}
                </option>
              ))}
            </Select>
          </div>
        )}
      </div>

      {loading && <Spinner label="Loading menu…" />}

      {!loading && (
        <div className="card overflow-hidden">
          {sorted.length === 0 ? (
            <EmptyState title={items.length === 0 ? "No menu items yet" : "No items match your filter"}>
              <p className="text-xs text-slate-500 mt-1">
                {items.length === 0 ? "Add your first delicious food item with a photo and price." : "Try clearing your search query or category filter."}
              </p>
            </EmptyState>
          ) : (
            <div className="divide-y divide-slate-100">
              {sorted.map((item) => (
                <div key={item.id} className="flex items-center gap-3 p-4 hover:bg-slate-50/60 transition">
                  {item.image ? (
                    <img
                      src={resolveImageUrl(item.image)}
                      alt={item.name}
                      className="h-14 w-14 shrink-0 rounded-xl object-cover bg-slate-100 border border-slate-200"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 border border-brand-100">
                      <UtensilsCrossed className="h-6 w-6" />
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-slate-800 truncate text-sm sm:text-base">{item.name}</p>
                      {item.isFeatured && (
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">
                          Featured
                        </span>
                      )}
                    </div>
                    {item.description && (
                      <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{item.description}</p>
                    )}
                    <p className="text-sm font-black text-brand-600 mt-1">{naira(item.price)}</p>
                  </div>

                  <StatusBadge status={item.isAvailable ? 'AVAILABLE' : 'UNAVAILABLE'} />

                  <div className="flex items-center gap-1">
                    <button
                      className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
                      onClick={() => toggleAvailability(item)}
                      title={item.isAvailable ? 'Mark unavailable' : 'Mark available'}
                    >
                      <UtensilsCrossed className="h-4 w-4" />
                    </button>
                    <button
                      className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-brand-600 transition"
                      onClick={() => openEdit(item)}
                      title="Edit item"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      className="p-2 rounded-lg text-slate-300 hover:bg-red-50 hover:text-red-600 transition"
                      onClick={() => remove(item)}
                      title="Delete item"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal for creating or editing menu item */}
      {(creating || editing) && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs" onClick={() => { setCreating(false); setEditing(null); }} />
          <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl">
            <h2 className="font-bold text-slate-800 text-lg mb-4">
              {editing ? `Edit ${editing.name}` : 'Add menu item'}
            </h2>

            <div className="space-y-4">
              {creating && categories.length > 0 && (
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

              <Field label="Item Name">
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Special Jollof Rice & Chicken"
                />
              </Field>

              <Field label="Price (₦)">
                <Input
                  type="number"
                  min="1"
                  step="50"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  placeholder="2500"
                />
              </Field>

              {/* Dual image input: URL paste + file upload with live preview */}
              <Field label="Item Photo" hint="Upload an image file or paste an image URL / web link">
                <div className="space-y-2">
                  <div className="flex gap-2 items-center">
                    <Input
                      value={form.image}
                      onChange={(e) => setForm({ ...form, image: e.target.value })}
                      placeholder="https://... or /uploads/..."
                    />
                    <label
                      className={clsx(
                        'btn-secondary !py-2 !px-3 text-xs shrink-0 cursor-pointer flex items-center gap-1.5 hover:bg-slate-100 transition',
                        uploadingImage && 'opacity-60 pointer-events-none'
                      )}
                    >
                      {uploadingImage ? (
                        <Loader2 className="h-4 w-4 animate-spin text-brand-600" />
                      ) : (
                        <Upload className="h-4 w-4 text-brand-600" />
                      )}
                      <span>{uploadingImage ? 'Uploading…' : 'Upload File'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        disabled={uploadingImage}
                        onChange={handleFileUpload}
                      />
                    </label>
                  </div>

                  {form.image && (
                    <div className="flex items-center gap-3 p-2 bg-slate-50 rounded-xl border border-slate-200">
                      <div className="relative h-14 w-14 shrink-0 rounded-lg overflow-hidden bg-white border border-slate-200">
                        <img
                          src={resolveImageUrl(form.image)}
                          alt="Preview"
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '';
                            (e.target as HTMLImageElement).alt = 'Invalid image';
                          }}
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-slate-700 truncate">Image linked</p>
                        <p className="text-[11px] font-mono text-slate-400 truncate">{form.image}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, image: '' })}
                        className="text-xs text-red-600 hover:text-red-700 font-medium px-2 py-1 rounded hover:bg-red-50"
                      >
                        Clear
                      </button>
                    </div>
                  )}
                </div>
              </Field>

              <Field label="Description (optional)">
                <TextArea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={2}
                  placeholder="Ingredients, portion size, spicy level..."
                />
              </Field>

              <label className="flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={form.isAvailable}
                  onChange={(e) => setForm({ ...form, isAvailable: e.target.checked })}
                  className="accent-brand-600 h-4 w-4 rounded"
                />
                Available for customer ordering
              </label>

              {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

              <div className="flex gap-2 pt-2 border-t border-slate-100">
                <Button className="btn-primary flex-1" loading={busy} onClick={save}>
                  {editing ? 'Save changes' : 'Create item'}
                </Button>
                <Button
                  className="btn-secondary"
                  onClick={() => {
                    setCreating(false);
                    setEditing(null);
                  }}
                >
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
