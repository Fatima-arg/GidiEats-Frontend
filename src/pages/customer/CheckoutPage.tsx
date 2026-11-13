import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Lock, MapPin, Plus, ShieldCheck, Trash2, Wallet } from 'lucide-react';
import { api, apiMessage, unwrap } from '../../api/client';
import { useCart } from '../../store/cart';
import { useAuth } from '../../store/auth';
import type { Address } from '../../api/types';
import { Button, EmptyState, Field, Input, Spinner } from '../../components/ui';
import { naira } from '../../lib/format';
import { FlutterwaveModal } from '../../components/payment/FlutterwaveModal';

const SERVICE_FEE_RATE = 0.05;

export function CheckoutPage() {
  const navigate = useNavigate();
  const user = useAuth((s) => s.user);
  const { lines, clear, totalItems, remove } = useCart();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [addressId, setAddressId] = useState<number | ''>('');
  const [paymentMethod, setPaymentMethod] = useState<'CARD' | 'CASH'>('CARD');
  const [instructions, setInstructions] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [showNewAddress, setShowNewAddress] = useState(false);
  const [loading, setLoading] = useState(false);
  const [flwModal, setFlwModal] = useState<{
    isOpen: boolean;
    orderId: number;
    orderNumber: string;
    amount: number;
    phone?: string;
    email?: string;
    customerName?: string;
  } | null>(null);

  // For logged-in user adding a new address
  const [newAddr, setNewAddr] = useState({ label: 'Home', phone: '', street: '', city: 'BUK New Site', state: 'Kano' });

  // For guest checkout address form
  const [guestAddr, setGuestAddr] = useState({
    name: '',
    phone: '',
    street: '',
    city: 'BUK New Site',
    state: 'Kano'
  });

  const restaurant = lines[0]?.restaurant ?? null;
  const subtotal = useMemo(() => lines.reduce((s, l) => s + Number(l.item.price) * l.qty, 0), [lines]);
  const deliveryFee = Number(restaurant?.deliveryFee ?? 0);
  const serviceFee = Math.round(subtotal * SERVICE_FEE_RATE * 100) / 100;
  const total = subtotal + deliveryFee + serviceFee;

  useEffect(() => {
    if (user) {
      setLoading(true);
      api
        .get('/addresses')
        .then((res) => {
          const data = unwrap<Address[]>(res as never);
          const list = Array.isArray(data) ? data : [];
          setAddresses(list);
          const def = list.find((a) => a.isDefault) ?? list[0];
          if (def) setAddressId(def.id);
        })
        .catch(() => setAddresses([]))
        .finally(() => setLoading(false));
    }
  }, [user]);

  const saveAddress = async () => {
    if (!newAddr.phone.trim() || !newAddr.street.trim() || !newAddr.city.trim() || !newAddr.state.trim()) {
      setError('Please fill in your phone, street, city and state.');
      return;
    }
    try {
      setError(null);
      const res = await api.post('/addresses', newAddr);
      const created = unwrap<Address>(res as never);
      setAddresses((prev) => [...prev, created]);
      setAddressId(created.id);
      setShowNewAddress(false);
      setNewAddr({ label: 'Home', phone: '', street: '', city: 'BUK New Site', state: 'Kano' });
    } catch (e) {
      setError(apiMessage(e));
    }
  };

  const placeOrder = async () => {
    if (busy) return;
    if (!restaurant) {
      setError('Invalid order: no restaurant selected.');
      return;
    }

    try {
      setError(null);
      setBusy(true);

      const basePayload = {
        restaurantId: restaurant.id,
        items: lines.map((l) => ({ foodItemId: l.item.id, quantity: l.qty })),
        paymentMethod,
        specialInstructions: instructions.trim() || undefined
      };

      let orderPayload: Record<string, unknown>;

      if (user) {
        if (!addressId) {
          setError('Please select or add a delivery address to continue.');
          setBusy(false);
          return;
        }
        orderPayload = { ...basePayload, addressId: Number(addressId) };
      } else {
        if (!guestAddr.name.trim() || !guestAddr.phone.trim() || !guestAddr.street.trim() || !guestAddr.city.trim()) {
          setError('Please fill in your recipient name, phone number, and delivery street address.');
          setBusy(false);
          return;
        }
        orderPayload = { ...basePayload, deliveryAddress: guestAddr };
      }

      const orderRes = await api.post('/orders', orderPayload);
      const order = unwrap<{ id: number; orderNumber: string }>(orderRes as never);

      if (paymentMethod === 'CARD') {
        const phone = user ? undefined : guestAddr.phone.trim();
        const customerName = user
          ? [user.firstName, user.lastName].filter(Boolean).join(' ') || undefined
          : guestAddr.name.trim();
        const email = user?.email;

        setFlwModal({
          isOpen: true,
          orderId: order.id,
          orderNumber: order.orderNumber,
          amount: total,
          phone,
          email,
          customerName
        });
        setBusy(false);
        return;
      }

      clear();

      if (user) {
        navigate(`/app/orders/${order.id}`);
      } else {
        localStorage.setItem('gidieats.guestPhone', guestAddr.phone.trim());
        navigate(`/track/${order.orderNumber}?phone=${encodeURIComponent(guestAddr.phone.trim())}`);
      }
    } catch (e) {
      setError(apiMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const handleFlwSuccess = () => {
    if (!flwModal) return;
    const { orderId, orderNumber, phone } = flwModal;
    setFlwModal(null);
    clear();
    if (user) {
      navigate(`/app/orders/${orderId}`);
    } else {
      const guestPhone = phone || guestAddr.phone.trim();
      localStorage.setItem('gidieats.guestPhone', guestPhone);
      navigate(`/track/${orderNumber}?phone=${encodeURIComponent(guestPhone)}`);
    }
  };

  const handleFlwClose = () => {
    if (!flwModal) return;
    const { orderId, orderNumber, phone } = flwModal;
    setFlwModal(null);
    clear();
    if (user) {
      navigate(`/app/orders/${orderId}`);
    } else {
      const guestPhone = phone || guestAddr.phone.trim();
      localStorage.setItem('gidieats.guestPhone', guestPhone);
      navigate(`/track/${orderNumber}?phone=${encodeURIComponent(guestPhone)}`);
    }
  };

  if (lines.length === 0) {
    return (
      <EmptyState title="Your basket is empty">
        <p className="mt-1 text-sm text-slate-500">
          Discover delicious restaurants across Kano and BUK campus and build your order.
        </p>
        <Link to="/" className="btn-primary mt-4 inline-flex items-center gap-2">
          <span>Browse restaurants</span>
        </Link>
      </EmptyState>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back button & Title */}
      <div>
        <Link
          to="/"
          className="mb-2 inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-brand-600 transition"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Storefront
        </Link>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h1 className="text-2xl font-black text-slate-900 sm:text-3xl">Checkout</h1>
          <p className="text-xs font-semibold text-slate-500">
            Ordering from <span className="font-extrabold text-brand-700">{restaurant?.name}</span> · {totalItems()} item{totalItems() === 1 ? '' : 's'}
          </p>
        </div>
      </div>

      {/* 2-Column Responsive Layout for Big & Small Screens */}
      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,1fr)_380px] xl:grid-cols-[minmax(0,1fr)_420px]">
        {/* Left Column: Delivery & Payment Details */}
        <div className="space-y-6">
          {/* Guest notice / Sign-in prompt */}
          {!user && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-brand-200 bg-brand-50/70 p-4 text-xs">
              <div>
                <p className="font-extrabold text-brand-900">
                  Checking out as a Guest
                </p>
                <p className="text-brand-700 mt-0.5">
                  No password required! You'll receive a live tracking link with your order number.
                </p>
              </div>
              <Link
                to="/login"
                className="shrink-0 rounded-xl bg-white px-3.5 py-1.5 text-xs font-bold text-brand-700 shadow-xs border border-brand-200 hover:bg-brand-50"
              >
                Sign in instead
              </Link>
            </div>
          )}

          {/* Section 1: Delivery Address */}
          <section className="card p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                  <MapPin className="h-4 w-4" />
                </div>
                <h2 className="text-base font-extrabold text-slate-900">
                  Delivery details
                </h2>
              </div>
            </div>

            {user ? (
              /* Logged In Address Selector */
              <div className="space-y-3">
                {loading && <Spinner label="Loading saved addresses…" />}

                {!loading && addresses.length > 0 && (
                  <div className="space-y-2.5">
                    {addresses.map((a) => (
                      <label
                        key={a.id}
                        className={`flex items-start gap-3 rounded-2xl border p-3.5 cursor-pointer transition ${
                          addressId === a.id
                            ? 'border-brand-500 bg-brand-50/60 ring-1 ring-brand-500'
                            : 'border-slate-200/90 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <input
                          type="radio"
                          name="address"
                          checked={addressId === a.id}
                          onChange={() => setAddressId(a.id)}
                          className="mt-1 accent-brand-600"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-extrabold text-slate-800">{a.label}</span>
                            {a.isDefault && (
                              <span className="badge bg-brand-100 text-brand-800 text-[10px]">Default</span>
                            )}
                          </div>
                          <p className="mt-0.5 text-xs text-slate-500">
                            {a.street}, {a.city}, {a.state}
                          </p>
                          <p className="text-[11px] font-semibold text-slate-400 mt-0.5">Phone: {a.phone}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                )}

                {!loading && addresses.length === 0 && !showNewAddress && (
                  <p className="text-xs text-slate-400">You haven't saved any delivery addresses yet.</p>
                )}

                {/* Add new address toggler */}
                {!showNewAddress ? (
                  <button
                    type="button"
                    onClick={() => setShowNewAddress(true)}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-600 hover:text-brand-700 pt-1"
                  >
                    <Plus className="h-4 w-4" /> Add a new address
                  </button>
                ) : (
                  <div className="space-y-3 rounded-2xl border border-brand-200 bg-brand-50/40 p-4">
                    <p className="text-xs font-bold text-slate-800">Add new delivery address</p>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Label">
                        <Input
                          value={newAddr.label}
                          onChange={(e) => setNewAddr({ ...newAddr, label: e.target.value })}
                          placeholder="Home, Office..."
                        />
                      </Field>
                      <Field label="Contact Phone">
                        <Input
                          value={newAddr.phone}
                          onChange={(e) => setNewAddr({ ...newAddr, phone: e.target.value })}
                          placeholder="080 0000 0000"
                        />
                      </Field>
                    </div>
                    <Field label="Street Address">
                      <Input
                        value={newAddr.street}
                        onChange={(e) => setNewAddr({ ...newAddr, street: e.target.value })}
                        placeholder="e.g. Nana Hall Room 14, BUK New Site, Kano"
                      />
                    </Field>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="City">
                        <Input
                          value={newAddr.city}
                          onChange={(e) => setNewAddr({ ...newAddr, city: e.target.value })}
                          placeholder="BUK New Site"
                        />
                      </Field>
                      <Field label="State">
                        <Input
                          value={newAddr.state}
                          onChange={(e) => setNewAddr({ ...newAddr, state: e.target.value })}
                          placeholder="Kano"
                        />
                      </Field>
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      <Button className="btn-primary text-xs" onClick={saveAddress}>
                        Save Address
                      </Button>
                      <Button className="btn-secondary text-xs" onClick={() => setShowNewAddress(false)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Guest Checkout Form */
              <div className="space-y-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field label="Your Full Name">
                    <Input
                      value={guestAddr.name}
                      onChange={(e) => setGuestAddr({ ...guestAddr, name: e.target.value })}
                      placeholder="e.g. Fatima Adam Aminu"
                    />
                  </Field>
                  <Field label="Delivery Phone Number" hint="Used for rider calls & live tracking">
                    <Input
                      type="tel"
                      value={guestAddr.phone}
                      onChange={(e) => setGuestAddr({ ...guestAddr, phone: e.target.value })}
                      placeholder="e.g. 08012345678"
                    />
                  </Field>
                </div>
                <Field label="Delivery Street Address">
                  <Input
                    value={guestAddr.street}
                    onChange={(e) => setGuestAddr({ ...guestAddr, street: e.target.value })}
                    placeholder="e.g. Nana Hall Room 14, BUK New Site"
                  />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="City">
                    <Input
                      value={guestAddr.city}
                      onChange={(e) => setGuestAddr({ ...guestAddr, city: e.target.value })}
                      placeholder="BUK New Site"
                    />
                  </Field>
                  <Field label="State">
                    <Input
                      value={guestAddr.state}
                      onChange={(e) => setGuestAddr({ ...guestAddr, state: e.target.value })}
                      placeholder="Kano"
                    />
                  </Field>
                </div>
              </div>
            )}
          </section>

          {/* Section 2: Payment Method */}
          <section className="card p-5 sm:p-6 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                <Wallet className="h-4 w-4" />
              </div>
              <h2 className="text-base font-extrabold text-slate-900">
                Payment method
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPaymentMethod('CARD')}
                className={`flex items-start gap-3 rounded-2xl border p-4 text-left transition ${
                  paymentMethod === 'CARD'
                    ? 'border-orange-500 bg-orange-50/60 ring-1 ring-orange-500'
                    : 'border-slate-200/90 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-100 text-orange-600 shrink-0 font-black text-sm">
                  FW
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="block text-sm font-extrabold text-slate-900">Flutterwave</span>
                    <span className="badge bg-orange-100 text-orange-800 text-[10px] font-bold">Recommended</span>
                  </div>
                  <span className="block text-xs text-slate-500 mt-0.5">
                    Pay with Card, Bank Transfer, or USSD
                  </span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('CASH')}
                className={`flex items-start gap-3 rounded-2xl border p-4 text-left transition ${
                  paymentMethod === 'CASH'
                    ? 'border-brand-500 bg-brand-50/60 ring-1 ring-brand-500'
                    : 'border-slate-200/90 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-100 text-brand-600 shrink-0">
                  <Wallet className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="block text-sm font-extrabold text-slate-900">Cash on Delivery</span>
                  <span className="block text-xs text-slate-500 mt-0.5">Pay the rider when your meal arrives</span>
                </div>
              </button>
            </div>

            {paymentMethod === 'CARD' && (
              <div className="rounded-xl bg-orange-50/70 p-3.5 text-xs text-slate-600 border border-orange-200/70 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-orange-950">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  <span>Flutterwave Gateway Active</span>
                </div>
                <p>
                  Supports instant card testing (Mastercard, Verve), virtual bank transfer simulation, and USSD dial codes.
                </p>
              </div>
            )}
          </section>

          {/* Section 3: Delivery Instructions */}
          <section className="card p-5 sm:p-6 space-y-3">
            <label className="label" htmlFor="instructions">
              Driver Instructions / Notes (Optional)
            </label>
            <textarea
              id="instructions"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="e.g. Please leave at the security gate, call on arrival, extra pepper sauce…"
              className="input min-h-[80px]"
            />
          </section>
        </div>

        {/* Right Column: Sticky Order Summary */}
        <aside className="sticky top-24 space-y-4 rounded-3xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-soft">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-base font-extrabold text-slate-900">Order Summary</h3>
            <p className="text-xs font-semibold text-slate-400 mt-0.5">
              From {restaurant?.name}
            </p>
          </div>

          {/* Dish items */}
          <div className="max-h-[300px] space-y-2.5 overflow-y-auto no-scrollbar pr-1">
            {lines.map((l) => (
              <div key={l.item.id} className="flex items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <button
                    type="button"
                    onClick={() => remove(l.item.id)}
                    className="text-slate-300 hover:text-red-500 transition"
                    title="Remove item"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                  <span className="font-extrabold text-brand-700">{l.qty}×</span>
                  <span className="truncate text-slate-800 font-medium">{l.item.name}</span>
                </div>
                <span className="shrink-0 font-bold text-slate-900">
                  {naira(Number(l.item.price) * l.qty)}
                </span>
              </div>
            ))}
          </div>

          {/* Fees & Total */}
          <div className="space-y-2 border-t border-slate-100 pt-3 text-xs">
            <div className="flex justify-between text-slate-500">
              <span>Subtotal ({totalItems()} items)</span>
              <span className="font-semibold text-slate-800">{naira(subtotal)}</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Delivery Fee</span>
              <span className="font-semibold text-slate-800">{naira(deliveryFee)}</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Platform Service Fee (5%)</span>
              <span className="font-semibold text-slate-800">{naira(serviceFee)}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-slate-200 text-sm font-black text-slate-900">
              <span>Total Amount</span>
              <span className="text-brand-600 text-base">{naira(total)}</span>
            </div>
          </div>

          {error && (
            <div className="rounded-xl bg-red-50 p-3 text-xs font-semibold text-red-700 border border-red-200">
              {error}
            </div>
          )}

          <Button
            className="btn-primary w-full py-3.5 text-sm font-extrabold shadow-md shadow-brand-500/20"
            loading={busy}
            onClick={placeOrder}
          >
            {paymentMethod === 'CARD' ? `Pay ${naira(total)} & Order` : `Place Cash Order (${naira(total)})`}
          </Button>

          <div className="flex items-center justify-center gap-2 pt-1 text-[11px] font-semibold text-slate-400">
            <Lock className="h-3.5 w-3.5" />
            <span>256-bit encrypted secure checkout</span>
          </div>
        </aside>
      </div>

      {flwModal && (
        <FlutterwaveModal
          isOpen={flwModal.isOpen}
          orderId={flwModal.orderId}
          orderNumber={flwModal.orderNumber}
          amount={flwModal.amount}
          phone={flwModal.phone}
          email={flwModal.email}
          customerName={flwModal.customerName}
          onClose={handleFlwClose}
          onSuccess={handleFlwSuccess}
        />
      )}
    </div>
  );
}