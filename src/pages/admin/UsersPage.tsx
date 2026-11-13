import { useEffect, useMemo, useState } from 'react';
import { Bike, Check, MapPin, Pencil, Plus, Search, Shield, Star, Store, X } from 'lucide-react';
import clsx from 'clsx';
import { api, apiMessage, unwrap } from '../../api/client';
import type { Restaurant, User } from '../../api/types';
import { Badge, Button, EmptyState, Field, Input, Select, Spinner } from '../../components/ui';
import { avatarColor } from '../../styles/colors';
import { formatDate } from '../../lib/format';

const ROLE_TABS = [
  { value: 'ALL', label: 'All users' },
  { value: 'CUSTOMER', label: 'Customers' },
  { value: 'RIDER', label: 'Riders' },
  { value: 'RESTAFF', label: 'Staff' },
  { value: 'ADMIN', label: 'Admins' }
];

const ROLE_TONE: Record<string, 'blue' | 'green' | 'purple' | 'orange' | 'slate'> = {
  ADMIN: 'purple',
  RESTAFF: 'orange',
  RIDER: 'blue',
  CUSTOMER: 'green'
};

const EMPTY_CREATE_FORM = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  password: '',
  role: 'CUSTOMER' as 'CUSTOMER' | 'RIDER' | 'RESTAFF' | 'ADMIN',
  restaurantId: '',
  vehicleType: 'MOTORCYCLE',
  licensePlate: '',
  position: 'WAITER'
};

export function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ALL');
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Create form state
  const [createForm, setCreateForm] = useState(EMPTY_CREATE_FORM);

  // Edit form state
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    role: 'CUSTOMER' as 'CUSTOMER' | 'RIDER' | 'RESTAFF' | 'ADMIN',
    isActive: true,
    // Rider specific
    vehicleType: 'MOTORCYCLE',
    licensePlate: '',
    availabilityStatus: 'AVAILABLE',
    riderRestaurantId: '',
    riderIsActive: true,
    // Staff specific
    staffRestaurantId: '',
    staffPosition: 'MANAGER'
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [uRes, rRes] = await Promise.all([
        api.get('/users', { params: { limit: 100 } }),
        api.get('/restaurants', { params: { limit: 100, includeInactive: 'true' } })
      ]);
      const uData = unwrap<User[]>(uRes as never);
      const rData = unwrap<Restaurant[]>(rRes as never);
      setUsers(Array.isArray(uData) ? uData : []);
      setRestaurants(Array.isArray(rData) ? rData : []);
    } catch (e) {
      setError(apiMessage(e));
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered users by role tab and search query
  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter((u) => {
      if (activeTab !== 'ALL' && u.role !== activeTab) return false;
      if (!q) return true;
      const fullName = `${u.firstName ?? ''} ${u.lastName ?? ''}`.toLowerCase();
      const email = (u.email ?? '').toLowerCase();
      const phone = (u.phone ?? '').toLowerCase();
      const restName = (u.staff?.restaurant?.name ?? u.rider?.restaurant?.name ?? '').toLowerCase();
      const plate = (u.rider?.licensePlate ?? '').toLowerCase();
      return (
        fullName.includes(q) ||
        email.includes(q) ||
        phone.includes(q) ||
        restName.includes(q) ||
        plate.includes(q)
      );
    });
  }, [users, activeTab, search]);

  // Counts for tabs
  const counts = useMemo(() => {
    const res: Record<string, number> = { ALL: users.length, CUSTOMER: 0, RIDER: 0, RESTAFF: 0, ADMIN: 0 };
    for (const u of users) {
      if (res[u.role] !== undefined) res[u.role]++;
    }
    return res;
  }, [users]);

  const toggleActive = async (u: User) => {
    try {
      setError(null);
      await api.put(`/users/${u.id}/status`, { isActive: !u.isActive });
      setUsers((prev) => prev.map((item) => (item.id === u.id ? { ...item, isActive: !item.isActive } : item)));
    } catch (e) {
      setError(apiMessage(e));
    }
  };

  const openEdit = (u: User) => {
    setEditingUser(u);
    setError(null);
    setSuccessMessage(null);
    setEditForm({
      firstName: u.firstName ?? '',
      lastName: u.lastName ?? '',
      email: u.email ?? '',
      phone: u.phone ?? '',
      password: '',
      role: u.role,
      isActive: u.isActive ?? true,
      vehicleType: u.rider?.vehicleType ?? 'MOTORCYCLE',
      licensePlate: u.rider?.licensePlate ?? '',
      availabilityStatus: u.rider?.availabilityStatus ?? 'AVAILABLE',
      riderRestaurantId: u.rider?.restaurantId ? String(u.rider.restaurantId) : '',
      riderIsActive: u.rider?.isActive ?? true,
      staffRestaurantId: u.staff?.restaurantId ? String(u.staff.restaurantId) : '',
      staffPosition: u.staff?.position ?? 'MANAGER'
    });
  };

  const handleSaveEdit = async () => {
    if (!editingUser) return;
    try {
      setBusy(true);
      setError(null);

      if (!editForm.firstName.trim() || !editForm.lastName.trim() || !editForm.email.trim() || !editForm.phone.trim()) {
        setError('First name, last name, email and phone are required.');
        return;
      }

      const payload: Record<string, unknown> = {
        firstName: editForm.firstName.trim(),
        lastName: editForm.lastName.trim(),
        email: editForm.email.trim(),
        phone: editForm.phone.trim(),
        role: editForm.role,
        isActive: editForm.isActive
      };

      if (editForm.password.trim()) {
        payload.password = editForm.password.trim();
      }

      if (editForm.role === 'RIDER') {
        payload.rider = {
          vehicleType: editForm.vehicleType,
          licensePlate: editForm.licensePlate.trim() || null,
          availabilityStatus: editForm.availabilityStatus,
          restaurantId: editForm.riderRestaurantId ? Number(editForm.riderRestaurantId) : null,
          isActive: editForm.riderIsActive
        };
      } else if (editForm.role === 'RESTAFF') {
        payload.restaff = {
          restaurantId: editForm.staffRestaurantId ? Number(editForm.staffRestaurantId) : null,
          position: editForm.staffPosition
        };
      }

      await api.put(`/users/${editingUser.id}`, payload);
      setSuccessMessage(`User ${editForm.firstName} updated successfully.`);
      setEditingUser(null);
      await loadData();
    } catch (e) {
      setError(apiMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const handleCreateUser = async () => {
    try {
      setBusy(true);
      setError(null);
      if (!createForm.firstName.trim() || !createForm.lastName.trim() || !createForm.email.trim() || !createForm.phone.trim() || !createForm.password) {
        setError('Please fill in all basic fields including password.');
        return;
      }
      if (createForm.role === 'RESTAFF' && !createForm.restaurantId) {
        setError('Please select an assigned restaurant for this staff member.');
        return;
      }

      const payload: Record<string, unknown> = {
        firstName: createForm.firstName.trim(),
        lastName: createForm.lastName.trim(),
        email: createForm.email.trim(),
        phone: createForm.phone.trim(),
        password: createForm.password,
        role: createForm.role
      };

      if (createForm.role === 'RESTAFF') {
        payload.restaurantId = Number(createForm.restaurantId);
        payload.position = createForm.position;
      } else if (createForm.role === 'RIDER') {
        payload.vehicleType = createForm.vehicleType;
        payload.licensePlate = createForm.licensePlate.trim() || null;
        payload.restaurantId = createForm.restaurantId ? Number(createForm.restaurantId) : null;
      }

      await api.post('/users', payload);
      setShowCreate(false);
      setCreateForm(EMPTY_CREATE_FORM);
      setSuccessMessage(`Account created for ${createForm.firstName} (${createForm.role})`);
      await loadData();
    } catch (e) {
      setError(apiMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="page-title">Users & Accounts</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage customers, riders, restaurant managers, and admins in Kano
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button className="btn-primary" onClick={() => { setShowCreate((v) => !v); setError(null); }}>
            <Plus className="h-4 w-4" /> Add account
          </Button>
        </div>
      </div>

      {/* Alerts */}
      {error && <div className="rounded-xl bg-red-50 p-3 text-sm text-red-700 border border-red-200">{error}</div>}
      {successMessage && (
        <div className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700 border border-emerald-200 flex items-center justify-between">
          <span>{successMessage}</span>
          <button onClick={() => setSuccessMessage(null)} className="text-emerald-500 hover:text-emerald-700">✕</button>
        </div>
      )}

      {/* Role Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Role Tabs */}
        <div className="flex flex-wrap items-center gap-1.5">
          {ROLE_TABS.map((tab) => {
            const isSelected = activeTab === tab.value;
            const count = counts[tab.value] ?? 0;
            return (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={clsx(
                  'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition',
                  isSelected
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                )}
              >
                <span>{tab.label}</span>
                <span
                  className={clsx(
                    'rounded-full px-1.5 py-0.2 text-[10px] font-bold leading-none',
                    isSelected ? 'bg-white/25 text-white' : 'bg-slate-100 text-slate-600'
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, email, phone, restaurant…"
            className="input !pl-9 !py-1.5 text-xs w-full"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Add User Modal / Inline Form */}
      {showCreate && (
        <div className="card p-5 border-2 border-brand-200 bg-brand-50/20 shadow-sm animate-in fade-in duration-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-bold text-slate-800">Add New Account</h2>
              <p className="text-xs text-slate-500">Create a customer, rider, restaurant staff, or admin</p>
            </div>
            <button className="p-1 text-slate-400 hover:text-slate-600" onClick={() => setShowCreate(false)}>✕</button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="First name">
              <Input
                value={createForm.firstName}
                onChange={(e) => setCreateForm({ ...createForm, firstName: e.target.value })}
                placeholder="e.g. Fatima"
              />
            </Field>
            <Field label="Last name">
              <Input
                value={createForm.lastName}
                onChange={(e) => setCreateForm({ ...createForm, lastName: e.target.value })}
                placeholder="e.g. Aminu"
              />
            </Field>
            <Field label="Email">
              <Input
                type="email"
                value={createForm.email}
                onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                placeholder="fatima@buk.edu.ng"
              />
            </Field>
            <Field label="Phone">
              <Input
                value={createForm.phone}
                onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                placeholder="08031234567"
              />
            </Field>
            <Field label="Password">
              <Input
                type="password"
                value={createForm.password}
                onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                placeholder="Min 8 characters with letter & number"
              />
            </Field>
            <Field label="Account Role">
              <Select
                value={createForm.role}
                onChange={(e) => setCreateForm({ ...createForm, role: e.target.value as any })}
              >
                <option value="CUSTOMER">Customer (Student / Buyer)</option>
                <option value="RIDER">Delivery Rider</option>
                <option value="RESTAFF">Restaurant Staff / Kitchen</option>
                <option value="ADMIN">System Administrator</option>
              </Select>
            </Field>

            {/* Role specific: RESTAFF */}
            {createForm.role === 'RESTAFF' && (
              <>
                <Field label="Assigned Restaurant">
                  <Select
                    value={createForm.restaurantId}
                    onChange={(e) => setCreateForm({ ...createForm, restaurantId: e.target.value })}
                  >
                    <option value="">Select Kano restaurant…</option>
                    {restaurants.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name} ({r.addressCity})
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Staff Position">
                  <Select
                    value={createForm.position}
                    onChange={(e) => setCreateForm({ ...createForm, position: e.target.value })}
                  >
                    {['MANAGER', 'CHEF', 'CASHIER', 'WAITER'].map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </Select>
                </Field>
              </>
            )}

            {/* Role specific: RIDER */}
            {createForm.role === 'RIDER' && (
              <>
                <Field label="Vehicle Type">
                  <Select
                    value={createForm.vehicleType}
                    onChange={(e) => setCreateForm({ ...createForm, vehicleType: e.target.value })}
                  >
                    <option value="MOTORCYCLE">Motorcycle (Standard)</option>
                    <option value="BICYCLE">Bicycle</option>
                    <option value="CAR">Car</option>
                  </Select>
                </Field>
                <Field label="License Plate" hint="Optional">
                  <Input
                    value={createForm.licensePlate}
                    onChange={(e) => setCreateForm({ ...createForm, licensePlate: e.target.value })}
                    placeholder="e.g. KAN-123-XY"
                  />
                </Field>
                <div className="sm:col-span-2">
                  <Field
                    label="Linked Restaurant"
                    hint="Choose a specific Kano restaurant for dedicated deliveries, or Freelance for all campus orders"
                  >
                    <Select
                      value={createForm.restaurantId}
                      onChange={(e) => setCreateForm({ ...createForm, restaurantId: e.target.value })}
                    >
                      <option value="">None (Freelance Platform Rider — receives orders from all restaurants)</option>
                      {restaurants.map((r) => (
                        <option key={r.id} value={r.id}>
                          Linked: {r.name} ({r.addressCity})
                        </option>
                      ))}
                    </Select>
                  </Field>
                </div>
              </>
            )}
          </div>
          <div className="mt-4 flex gap-2">
            <Button className="btn-primary" loading={busy} onClick={handleCreateUser}>
              Create Account
            </Button>
            <Button className="btn-secondary" onClick={() => setShowCreate(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Users List */}
      {loading && <Spinner label="Loading users and accounts…" />}
      {!loading && filteredUsers.length === 0 && (
        <EmptyState title="No matching accounts found">
          <p className="text-xs text-slate-400">
            {search ? `No accounts matched "${search}".` : 'No accounts in this category.'}
          </p>
        </EmptyState>
      )}

      {!loading && filteredUsers.length > 0 && (
        <div className="card overflow-hidden shadow-sm">
          <div className="divide-y divide-slate-100">
            {filteredUsers.map((u) => {
              const customerAddress = u.customer?.addresses?.[0];
              const isRider = u.role === 'RIDER';
              const isStaff = u.role === 'RESTAFF';
              const isCustomer = u.role === 'CUSTOMER';
              const isAdmin = u.role === 'ADMIN';

              return (
                <div
                  key={u.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 hover:bg-slate-50/60 transition"
                >
                  {/* Left: Avatar + Details */}
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div
                      className={clsx(
                        'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl font-bold text-white shadow-sm',
                        avatarColor(u.id)
                      )}
                    >
                      {(u.firstName ?? '?')[0].toUpperCase()}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-800 truncate">
                          {u.firstName} {u.lastName}
                        </span>
                        <Badge tone={ROLE_TONE[u.role] ?? 'slate'}>{u.role}</Badge>
                        {u.isActive === false ? (
                          <span className="text-[11px] font-semibold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
                            Disabled
                          </span>
                        ) : (
                          <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                            Active
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5 flex-wrap">
                        <span>{u.email}</span>
                        <span>•</span>
                        <span>{u.phone}</span>
                        {u.createdAt && (
                          <>
                            <span>•</span>
                            <span className="text-slate-400">Joined {formatDate(u.createdAt)}</span>
                          </>
                        )}
                      </div>

                      {/* Sub-role details */}
                      {isRider && (
                        <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs">
                          <span className="inline-flex items-center gap-1 rounded bg-sky-50 px-2 py-0.5 font-medium text-sky-800 border border-sky-200">
                            <Bike className="h-3 w-3" />
                            {u.rider?.vehicleType ?? 'MOTORCYCLE'}
                            {u.rider?.licensePlate ? ` · ${u.rider.licensePlate}` : ''}
                          </span>

                          {u.rider?.restaurant ? (
                            <span className="inline-flex items-center gap-1 rounded bg-amber-50 px-2 py-0.5 font-medium text-amber-800 border border-amber-200">
                              <Store className="h-3 w-3" />
                              Dedicated to: {u.rider.restaurant.name}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded bg-emerald-50 px-2 py-0.5 font-medium text-emerald-800 border border-emerald-200">
                              🌐 Freelance Rider (All Kano)
                            </span>
                          )}

                          <span className="inline-flex items-center gap-1 text-slate-500">
                            <span
                              className={clsx(
                                'h-2 w-2 rounded-full',
                                u.rider?.availabilityStatus === 'AVAILABLE'
                                  ? 'bg-emerald-500'
                                  : u.rider?.availabilityStatus === 'BUSY'
                                  ? 'bg-amber-500'
                                  : 'bg-slate-400'
                              )}
                            />
                            {u.rider?.availabilityStatus ?? 'AVAILABLE'}
                          </span>

                          {typeof u.rider?.rating === 'number' && (
                            <span className="inline-flex items-center gap-1 text-amber-600 font-medium">
                              <Star className="h-3 w-3 fill-amber-400 text-amber-500" />
                              {u.rider.rating.toFixed(1)} ({u.rider.totalDeliveries ?? 0} trips)
                            </span>
                          )}
                        </div>
                      )}

                      {isStaff && (
                        <div className="mt-1.5 flex items-center gap-2 text-xs">
                          <span className="inline-flex items-center gap-1 font-medium text-brand-700 bg-brand-50 border border-brand-200 px-2 py-0.5 rounded">
                            <Store className="h-3 w-3" />
                            {u.staff?.restaurant?.name ?? 'Unassigned restaurant'}
                            {u.staff?.position ? ` · ${u.staff.position}` : ''}
                          </span>
                        </div>
                      )}

                      {isCustomer && customerAddress && (
                        <div className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                          <MapPin className="h-3 w-3 text-slate-400" />
                          <span>{customerAddress.street}, {customerAddress.city}</span>
                        </div>
                      )}

                      {isAdmin && (
                        <div className="mt-1 flex items-center gap-1 text-xs text-purple-700 font-medium">
                          <Shield className="h-3 w-3" />
                          <span>Full Administrator Privileges</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    <Button
                      className="btn-secondary !py-1.5 !px-2.5 text-xs flex items-center gap-1"
                      onClick={() => openEdit(u)}
                    >
                      <Pencil className="h-3.5 w-3.5" /> Edit
                    </Button>
                    <button
                      onClick={() => toggleActive(u)}
                      className={clsx(
                        'rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition',
                        u.isActive === false
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-red-50 hover:text-red-600'
                      )}
                    >
                      {u.isActive === false ? 'Enable' : 'Disable'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs" onClick={() => setEditingUser(null)} />
          <div className="relative w-full max-w-xl max-h-[92vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-3">
                <div
                  className={clsx(
                    'flex h-10 w-10 items-center justify-center rounded-xl font-bold text-white',
                    avatarColor(editingUser.id)
                  )}
                >
                  {(editingUser.firstName ?? '?')[0].toUpperCase()}
                </div>
                <div>
                  <h2 className="font-bold text-slate-800 text-base">
                    Edit {editingUser.firstName} {editingUser.lastName}
                  </h2>
                  <p className="text-xs text-slate-400">User ID #{editingUser.id} · Role: {editingUser.role}</p>
                </div>
              </div>
              <button
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                onClick={() => setEditingUser(null)}
              >
                ✕
              </button>
            </div>

            {error && <div className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700 border border-red-200">{error}</div>}

            <div className="space-y-4">
              {/* Basic Fields */}
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="First Name">
                  <Input
                    value={editForm.firstName}
                    onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                  />
                </Field>
                <Field label="Last Name">
                  <Input
                    value={editForm.lastName}
                    onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                  />
                </Field>
                <Field label="Email Address">
                  <Input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  />
                </Field>
                <Field label="Phone Number">
                  <Input
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  />
                </Field>
                <Field label="System Role">
                  <Select
                    value={editForm.role}
                    onChange={(e) => setEditForm({ ...editForm, role: e.target.value as any })}
                  >
                    <option value="CUSTOMER">CUSTOMER</option>
                    <option value="RIDER">RIDER</option>
                    <option value="RESTAFF">RESTAFF (Staff)</option>
                    <option value="ADMIN">ADMIN</option>
                  </Select>
                </Field>
                <Field label="Reset Password" hint="Leave blank to keep existing password">
                  <Input
                    type="password"
                    value={editForm.password}
                    onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                    placeholder="New password (optional)"
                  />
                </Field>
              </div>

              {/* Active Toggle */}
              <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200">
                <input
                  id="user-is-active"
                  type="checkbox"
                  checked={editForm.isActive}
                  onChange={(e) => setEditForm({ ...editForm, isActive: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                />
                <label htmlFor="user-is-active" className="text-sm font-medium text-slate-700">
                  User Account Active (user can sign in)
                </label>
              </div>

              {/* Rider Specific Configuration */}
              {editForm.role === 'RIDER' && (
                <div className="rounded-xl border border-sky-200 bg-sky-50/30 p-4 space-y-3">
                  <div className="flex items-center gap-2 text-sky-800 font-semibold text-sm">
                    <Bike className="h-4 w-4" /> Rider Settings & Assignment
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="Vehicle Type">
                      <Select
                        value={editForm.vehicleType}
                        onChange={(e) => setEditForm({ ...editForm, vehicleType: e.target.value })}
                      >
                        <option value="MOTORCYCLE">Motorcycle</option>
                        <option value="BICYCLE">Bicycle</option>
                        <option value="CAR">Car</option>
                      </Select>
                    </Field>
                    <Field label="License Plate">
                      <Input
                        value={editForm.licensePlate}
                        onChange={(e) => setEditForm({ ...editForm, licensePlate: e.target.value })}
                        placeholder="e.g. KAN-341-DA"
                      />
                    </Field>
                    <Field label="Availability Status">
                      <Select
                        value={editForm.availabilityStatus}
                        onChange={(e) => setEditForm({ ...editForm, availabilityStatus: e.target.value })}
                      >
                        <option value="AVAILABLE">AVAILABLE (Receiving orders)</option>
                        <option value="BUSY">BUSY (On a delivery)</option>
                        <option value="OFFLINE">OFFLINE (Resting)</option>
                      </Select>
                    </Field>
                    <Field
                      label="Linked Kano Restaurant"
                      hint="Assign directly to a restaurant or keep freelance"
                    >
                      <Select
                        value={editForm.riderRestaurantId}
                        onChange={(e) => setEditForm({ ...editForm, riderRestaurantId: e.target.value })}
                      >
                        <option value="">None (Freelance Rider — receives orders from all restaurants)</option>
                        {restaurants.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.name} ({r.addressCity})
                          </option>
                        ))}
                      </Select>
                    </Field>
                  </div>
                  <p className="text-xs text-slate-500">
                    💡 If linked to a restaurant, new orders from that restaurant appear on this rider's dashboard for direct delivery.
                  </p>
                </div>
              )}

              {/* Staff Specific Configuration */}
              {editForm.role === 'RESTAFF' && (
                <div className="rounded-xl border border-orange-200 bg-orange-50/30 p-4 space-y-3">
                  <div className="flex items-center gap-2 text-brand-800 font-semibold text-sm">
                    <Store className="h-4 w-4" /> Restaurant Staff Settings
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="Assigned Restaurant">
                      <Select
                        value={editForm.staffRestaurantId}
                        onChange={(e) => setEditForm({ ...editForm, staffRestaurantId: e.target.value })}
                      >
                        <option value="">Select Kano restaurant…</option>
                        {restaurants.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.name} ({r.addressCity})
                          </option>
                        ))}
                      </Select>
                    </Field>
                    <Field label="Staff Position">
                      <Select
                        value={editForm.staffPosition}
                        onChange={(e) => setEditForm({ ...editForm, staffPosition: e.target.value })}
                      >
                        {['MANAGER', 'CHEF', 'CASHIER', 'WAITER'].map((p) => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </Select>
                    </Field>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="mt-6 flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <Button className="btn-secondary" onClick={() => setEditingUser(null)}>
                Cancel
              </Button>
              <Button className="btn-primary" loading={busy} onClick={handleSaveEdit}>
                <Check className="h-4 w-4" /> Save Changes
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
