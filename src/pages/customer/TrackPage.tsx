import { useCallback, useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Bike, Check, CheckCircle2, MapPin, Search } from 'lucide-react';
import { Button, Field, Input, Spinner, StatusBadge } from '../../components/ui';
import { Order } from '../../api/types';
import { formatDate, naira } from '../../lib/format';
import { parseDeliveryAddress } from '../../lib/order';
import { api, apiMessage, resolveImageUrl, unwrap } from '../../api/client';
import { PaymentTrackerCard } from '../../components/payment/PaymentTrackerCard';
import { FlutterwaveModal } from '../../components/payment/FlutterwaveModal';

const TERMINAL = ['DELIVERED', 'CANCELLED', 'REJECTED'];
const STEPS = [
  { key: 'PENDING', label: 'Order Placed' },
  { key: 'CONFIRMED', label: 'Confirmed' },
  { key: 'PREPARING', label: 'In Kitchen' },
  { key: 'READY_FOR_PICKUP', label: 'Ready for Pickup' },
  { key: 'RIDER_ASSIGNED', label: 'Rider Assigned' },
  { key: 'OUT_FOR_DELIVERY', label: 'On the Way' },
  { key: 'DELIVERED', label: 'Delivered' }
] as const;

export function TrackPage() {
  const { orderNumber: paramNumber } = useParams();
  const [search] = useSearchParams();
  const initialPhone = search.get('phone') ?? '';

  const [orderNumber, setOrderNumber] = useState(paramNumber ?? '');
  const [phone, setPhone] = useState(initialPhone);
  const [result, setResult] = useState<Order | null>(null);
  const [history, setHistory] = useState<Order[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFlwModal, setShowFlwModal] = useState(false);

  const fetchOrder = useCallback(async (no: string, ph: string) => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.post('/orders/track', { orderNumber: no, phone: ph });
      const order = unwrap<Order>(res as never);
      setResult(order);
      localStorage.setItem('gidieats.guestPhone', ph.trim());
    } catch (e) {
      setError(apiMessage(e));
      setResult(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadHistory = useCallback(async (ph: string) => {
    if (!ph.trim()) return;
    try {
      setHistoryLoading(true);
      const res = await api.post('/orders/track/history', { phone: ph.trim() });
      const data = unwrap<Order[]>(res as never);
      setHistory(Array.isArray(data) ? data : []);
    } catch {
      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    if (paramNumber && initialPhone) {
      fetchOrder(paramNumber, initialPhone);
    }
  }, [paramNumber, initialPhone, fetchOrder]);

  useEffect(() => {
    const saved = localStorage.getItem('gidieats.guestPhone');
    if (saved) {
      setPhone((p) => p || saved);
      loadHistory(saved);
    }
  }, [loadHistory]);

  useEffect(() => {
    if (!result || TERMINAL.includes(result.status)) return;
    const timer = setInterval(() => {
      if (result.orderNumber && phone) fetchOrder(result.orderNumber, phone.trim());
    }, 15000);
    return () => clearInterval(timer);
  }, [result, phone, fetchOrder]);

  const acceptDelivery = async () => {
    if (!result) return;
    try {
      setConfirming(true);
      setError(null);
      const res = await api.post(`/orders/${result.id}/confirm-receipt`, { phone: phone.trim() });
      const order = unwrap<Order>(res as never);
      setResult(order);
      setHistory((h) => h.map((o) => (o.id === order.id ? { ...o, customerConfirmedAt: order.customerConfirmedAt } : o)));
    } catch (e) {
      setError(apiMessage(e));
    } finally {
      setConfirming(false);
    }
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderNumber.trim() || !phone.trim()) {
      setError('Please enter your order number and the phone used for delivery.');
      return;
    }
    fetchOrder(orderNumber.trim(), phone.trim());
    loadHistory(phone.trim());
  };

  const delivery = parseDeliveryAddress(result);
  const stepKeys = STEPS.map((s) => s.key);
  const stepIndex = result ? stepKeys.indexOf(result.status as (typeof stepKeys)[number]) : -1;

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 sm:text-3xl">Live Order Tracking</h1>
        <p className="mt-1 text-xs text-slate-500 sm:text-sm">
          Track real-time delivery status for any order placed as a guest or registered customer.
        </p>
      </div>

      {/* Grid: Search & Stepper */}
      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
        {/* Left Side: Order Search & Tracking Stepper (7 cols on desktop) */}
        <div className="space-y-6 lg:col-span-7">
          {/* Lookup Card */}
          <form onSubmit={onSubmit} className="card p-5 sm:p-6 space-y-4">
            <h2 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">
              Find an order
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Order Number">
                <Input
                  placeholder="e.g. GD260918-TLSKAN"
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value)}
                />
              </Field>
              <Field label="Delivery Phone">
                <Input
                  type="tel"
                  placeholder="080 0000 0000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </Field>
            </div>
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Button type="submit" className="btn-primary text-xs" loading={loading}>
                <Search className="h-4 w-4" /> Track order
              </Button>
              {phone.trim() && (
                <button
                  type="button"
                  onClick={() => loadHistory(phone)}
                  className="text-xs font-bold text-brand-600 hover:underline"
                >
                  Find all orders for this phone
                </button>
              )}
            </div>
          </form>

          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-bold text-red-700">
              {error}
            </div>
          )}

          {loading && !result && <Spinner label="Locating your order in Kano & BUK…" />}

          {/* Live Order Card */}
          {result && (
            <div className="card p-5 sm:p-6 space-y-6 bg-white">
              {/* Card Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Order</span>
                    <span className="text-base font-black text-slate-900">{result.orderNumber}</span>
                  </div>
                  {result.restaurant && (
                    <p className="mt-0.5 text-xs text-slate-500 font-medium">
                      From <span className="font-bold text-slate-800">{result.restaurant.name}</span>
                    </p>
                  )}
                </div>
                <StatusBadge status={result.status} />
              </div>

              {/* Visual Progress Stepper */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <Bike className="h-4 w-4 text-brand-600" />
                    Delivery Progress
                  </h3>
                  {!TERMINAL.includes(result.status) && (
                    <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                      Live Updating
                    </span>
                  )}
                </div>

                {/* Steps line */}
                <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                  {STEPS.map((s, idx) => {
                    const isDone = idx <= stepIndex;
                    const isCurrent = idx === stepIndex;
                    return (
                      <div key={s.key} className="relative flex items-start gap-3">
                        <span
                          className={`absolute -left-6 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-black transition-all ${
                            isCurrent
                              ? 'bg-brand-600 text-white ring-4 ring-brand-100 animate-bounce'
                              : isDone
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-200 text-slate-400'
                          }`}
                        >
                          {isDone ? '✓' : idx + 1}
                        </span>
                        <div className="min-w-0">
                          <p
                            className={`text-xs font-extrabold leading-tight ${
                              isCurrent
                                ? 'text-brand-600 text-sm'
                                : isDone
                                ? 'text-slate-900'
                                : 'text-slate-400'
                            }`}
                          >
                            {s.label}
                          </p>
                          {isCurrent && (
                            <p className="text-[11px] text-slate-500 mt-0.5 font-medium">
                              Estimated arrival: 25–40 minutes
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Delivery Address & Contact */}
              {delivery && (
                <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 space-y-1.5 text-xs">
                  <p className="font-extrabold text-slate-800 flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-brand-600" /> Destination
                  </p>
                  <p className="font-bold text-slate-700">
                    {delivery.name} · <span className="font-normal text-slate-500">{delivery.phone}</span>
                  </p>
                  <p className="text-slate-500">{delivery.street}, {delivery.city}, {delivery.state}</p>
                </div>
              )}

              {/* Delivery Receipt Confirmation */}
              {result.status === 'DELIVERED' && (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 space-y-2">
                  {!result.customerConfirmedAt ? (
                    <div>
                      <p className="text-xs font-extrabold text-emerald-900">Your food has been delivered!</p>
                      <p className="text-[11px] text-emerald-700 mt-0.5">
                        Please confirm that you've received your meal in good condition.
                      </p>
                      <Button
                        className="btn-primary mt-3 text-xs"
                        loading={confirming}
                        onClick={acceptDelivery}
                      >
                        <Check className="h-4 w-4" /> I received my order
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-800">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      <span>Delivery accepted & confirmed by customer. Thank you!</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Side: Order Summary & Past History (5 cols on desktop) */}
        <div className="space-y-6 lg:col-span-5">
          {/* Real-time Payment Tracker Card */}
          {result && (
            <PaymentTrackerCard
              payment={result.payment}
              paymentMethod={result.paymentMethod}
              total={result.total}
              orderNumber={result.orderNumber}
              onPayWithFlutterwave={() => setShowFlwModal(true)}
              isGuest={true}
            />
          )}

          {/* Active Order Items Summary */}
          {result && (
            <div className="card p-5 sm:p-6 space-y-4">
              <h3 className="text-sm font-extrabold text-slate-800 border-b border-slate-100 pb-2">
                Items in this order
              </h3>
              <div className="space-y-2.5">
                {(result.items ?? []).map((it) => (
                  <div key={it.id} className="flex items-center gap-3 text-xs">
                    {it.image ? (
                      <img
                        src={resolveImageUrl(it.image)}
                        alt=""
                        className="h-12 w-12 rounded-xl object-cover bg-slate-100"
                        onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                      />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600 font-bold">
                        🍽️
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-bold text-slate-800">{it.name}</p>
                      <p className="text-[11px] text-slate-400">{it.quantity} × {naira(it.price)}</p>
                    </div>
                    <span className="font-extrabold text-slate-900">
                      {naira(Number(it.price) * it.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Total Summary */}
              <div className="space-y-1.5 border-t border-slate-100 pt-3 text-xs">
                <div className="flex justify-between text-slate-500">
                  <span>Subtotal</span>
                  <span className="font-semibold text-slate-800">{naira(result.subtotal)}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Delivery Fee</span>
                  <span className="font-semibold text-slate-800">{naira(result.deliveryFee)}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Payment Method</span>
                  <span className="font-bold text-slate-700">{result.paymentMethod}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-200 text-sm font-black text-slate-900">
                  <span>Total Amount</span>
                  <span className="text-brand-600">{naira(result.total)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Past Orders with this Phone Number */}
          {phone.trim() && (
            <div className="card p-5 sm:p-6 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                  Orders for {phone.trim()}
                </h3>
                <span className="badge bg-slate-100 text-slate-700">{history.length}</span>
              </div>

              {historyLoading && <Spinner label="Loading previous orders…" />}

              {!historyLoading && history.length === 0 && (
                <p className="text-xs text-slate-400 py-3 text-center">
                  No other orders found for this number.
                </p>
              )}

              <div className="space-y-2 max-h-[360px] overflow-y-auto no-scrollbar">
                {history.map((o) => (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() => {
                      setOrderNumber(o.orderNumber);
                      fetchOrder(o.orderNumber, phone);
                    }}
                    className={`w-full rounded-2xl border p-3 text-left transition flex items-center justify-between gap-3 ${
                      result?.id === o.id
                        ? 'border-brand-500 bg-brand-50/60 ring-1 ring-brand-500'
                        : 'border-slate-100 bg-slate-50/50 hover:bg-slate-100/70 hover:border-slate-200'
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="truncate text-xs font-bold text-slate-800">
                        {o.restaurant?.name ?? 'Order'}
                      </p>
                      <p className="text-[11px] text-slate-400 font-mono">
                        {o.orderNumber} · {formatDate(o.placedAt)}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="block text-xs font-black text-brand-600">
                        {naira(o.total)}
                      </span>
                      <span className="inline-block scale-90 origin-right">
                        <StatusBadge status={o.status} />
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {showFlwModal && result && (
        <FlutterwaveModal
          isOpen={showFlwModal}
          orderId={result.id}
          orderNumber={result.orderNumber}
          amount={Number(result.total)}
          phone={phone.trim() || undefined}
          email={undefined}
          customerName={delivery?.name}
          onClose={() => setShowFlwModal(false)}
          onSuccess={() => {
            setShowFlwModal(false);
            fetchOrder(result.orderNumber, phone.trim());
          }}
        />
      )}
    </div>
  );
}