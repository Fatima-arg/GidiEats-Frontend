import { useCallback, useEffect, useState } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import {
  Bike,
  Check,
  CheckCircle2,
  Clock,
  Compass,
  FileText,
  HelpCircle,
  MapPin,
  Phone,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Utensils
} from 'lucide-react';
import { Button, Field, Input, Spinner, StatusBadge } from '../../components/ui';
import { Order } from '../../api/types';
import { formatDate, naira } from '../../lib/format';
import { parseDeliveryAddress } from '../../lib/order';
import { api, apiMessage, resolveImageUrl, unwrap } from '../../api/client';
import { PaymentTrackerCard } from '../../components/payment/PaymentTrackerCard';
import { FlutterwaveModal } from '../../components/payment/FlutterwaveModal';

const TERMINAL = ['DELIVERED', 'CANCELLED', 'REJECTED'];
const STEPS = [
  { key: 'PENDING', label: 'Order Placed', desc: 'Received & sent to kitchen' },
  { key: 'CONFIRMED', label: 'Confirmed', desc: 'Order verified & accepted' },
  { key: 'PREPARING', label: 'In Kitchen', desc: 'Fresh food being prepared' },
  { key: 'READY_FOR_PICKUP', label: 'Ready for Pickup', desc: 'Packed and waiting for rider' },
  { key: 'RIDER_ASSIGNED', label: 'Rider Assigned', desc: 'Rider on the way to restaurant' },
  { key: 'OUT_FOR_DELIVERY', label: 'On the Way', desc: 'Rider is en route to your address' },
  { key: 'DELIVERED', label: 'Delivered', desc: 'Successfully handed over' }
] as const;

export function TrackPage() {
  const { orderNumber: paramNumber } = useParams();
  const [search, setSearchParams] = useSearchParams();
  const queryOrderNumber = search.get('orderNumber') ?? '';

  const initialOrderNumber = (paramNumber || queryOrderNumber || '').trim();
  const [orderNumber, setOrderNumber] = useState(initialOrderNumber);
  const [result, setResult] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFlwModal, setShowFlwModal] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [showGuide, setShowGuide] = useState(true);

  // Fetch order using Order Number ONLY
  const fetchOrder = useCallback(async (no: string) => {
    const cleanNumber = no.trim().toUpperCase();
    if (!cleanNumber) {
      setError('Please enter a valid Order Number.');
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const res = await api.post('/orders/track', { orderNumber: cleanNumber });
      const order = unwrap<Order>(res as never);
      setResult(order);
      setLastRefreshed(new Date());

      // Remember recent tracked order numbers in localStorage for quick access
      try {
        const stored = JSON.parse(localStorage.getItem('gidieats.recentTracked') || '[]');
        const updated = Array.from(new Set([cleanNumber, ...stored])).slice(0, 5);
        localStorage.setItem('gidieats.recentTracked', JSON.stringify(updated));
      } catch {
        /* noop */
      }
    } catch (e) {
      setError(apiMessage(e));
      setResult(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-fetch if orderNumber provided in URL route or query param
  useEffect(() => {
    if (initialOrderNumber) {
      fetchOrder(initialOrderNumber);
    }
  }, [initialOrderNumber, fetchOrder]);

  // Live periodic heartbeat auto-refresh (every 15s) for active orders
  useEffect(() => {
    if (!result || TERMINAL.includes(result.status)) return;
    const timer = setInterval(() => {
      if (result.orderNumber) {
        fetchOrder(result.orderNumber);
      }
    }, 15000);
    return () => clearInterval(timer);
  }, [result, fetchOrder]);

  const acceptDelivery = async () => {
    if (!result) return;
    try {
      setConfirming(true);
      setError(null);
      const res = await api.post(`/orders/${result.id}/confirm-receipt`, {});
      const order = unwrap<Order>(res as never);
      setResult(order);
    } catch (e) {
      setError(apiMessage(e));
    } finally {
      setConfirming(false);
    }
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderNumber.trim()) {
      setError('Please enter your Order Number (e.g. GD261113-8A2F1C) to track your delivery.');
      return;
    }
    const clean = orderNumber.trim().toUpperCase();
    setSearchParams({ orderNumber: clean });
    fetchOrder(clean);
  };

  const delivery = parseDeliveryAddress(result);
  const stepKeys = STEPS.map((s) => s.key);
  const stepIndex = result ? stepKeys.indexOf(result.status as (typeof stepKeys)[number]) : -1;

  // Retrieve any recent tracked order numbers from localStorage
  const recentOrders: string[] = (() => {
    try {
      return JSON.parse(localStorage.getItem('gidieats.recentTracked') || '[]');
    } catch {
      return [];
    }
  })();

  const riderInfo = result?.delivery?.rider || (result as any)?.rider;

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-2 sm:px-4">
      {/* Title & Live Status Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900 sm:text-3xl flex items-center gap-2.5">
            <span className="flex h-3 w-3 rounded-full bg-emerald-500 animate-ping" />
            Live Order Tracking
          </h1>
          <p className="mt-1 text-xs text-slate-500 sm:text-sm">
            Track real-time kitchen preparation and rider delivery across Kano & BUK campus using your Order Number.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowGuide((prev) => !prev)}
          className="btn-secondary !py-1.5 text-xs inline-flex items-center gap-1.5 text-brand-700 font-semibold"
        >
          <HelpCircle className="h-4 w-4" />
          <span>{showGuide ? 'Hide Tracking Guide' : 'How Tracking Works'}</span>
        </button>
      </div>

      {/* Guide Banner */}
      {showGuide && (
        <div className="rounded-2xl border border-brand-200 bg-gradient-to-br from-brand-50/70 via-white to-amber-50/40 p-5 shadow-xs">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-600 text-white shadow-xs">
                <Compass className="h-4 w-4" />
              </div>
              <h2 className="font-extrabold text-slate-800 text-sm sm:text-base">
                How to Track Your GidiEats Order
              </h2>
            </div>
            <span className="text-[11px] font-bold text-brand-700 bg-brand-100/70 px-2 py-0.5 rounded-full">
              Guide & Instructions
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div className="p-3 bg-white/80 rounded-xl border border-brand-100/80 space-y-1">
              <p className="font-extrabold text-slate-900 flex items-center gap-1.5">
                <FileText className="h-4 w-4 text-brand-600 shrink-0" />
                1. Locate Order Number
              </p>
              <p className="text-slate-500 leading-relaxed text-[11px]">
                Your Order Number is displayed on your screen right after ordering, in your email/SMS receipt, or under <Link to="/orders" className="text-brand-600 font-bold underline">My Orders</Link>.
              </p>
              <p className="text-[11px] font-mono font-bold text-brand-700 pt-1">
                Format: GDYYMMDD-XXXXXX
              </p>
            </div>

            <div className="p-3 bg-white/80 rounded-xl border border-brand-100/80 space-y-1">
              <p className="font-extrabold text-slate-900 flex items-center gap-1.5">
                <Search className="h-4 w-4 text-brand-600 shrink-0" />
                2. Enter Number Only
              </p>
              <p className="text-slate-500 leading-relaxed text-[11px]">
                No phone number or password required! Simply paste or type your Order Number into the search field and tap <strong>"Track Order"</strong>.
              </p>
              <p className="text-[11px] text-emerald-600 font-semibold pt-1">
                ✓ Works for guest & account orders
              </p>
            </div>

            <div className="p-3 bg-white/80 rounded-xl border border-brand-100/80 space-y-1">
              <p className="font-extrabold text-slate-900 flex items-center gap-1.5">
                <Utensils className="h-4 w-4 text-brand-600 shrink-0" />
                3. Live Kitchen & Rider
              </p>
              <p className="text-slate-500 leading-relaxed text-[11px]">
                Watch your meal move from kitchen preparation to packaging, rider pickup, and campus transit with estimated arrival times.
              </p>
              <p className="text-[11px] text-slate-500 font-medium pt-1">
                BUK New Site · Old Site · Kano
              </p>
            </div>

            <div className="p-3 bg-white/80 rounded-xl border border-brand-100/80 space-y-1">
              <p className="font-extrabold text-slate-900 flex items-center gap-1.5">
                <RefreshCw className="h-4 w-4 text-brand-600 shrink-0" />
                4. Live Auto-Updates
              </p>
              <p className="text-slate-500 leading-relaxed text-[11px]">
                The live tracker refreshes automatically every 15 seconds. Once the rider is assigned, their contact details will appear here!
              </p>
              <p className="text-[11px] text-emerald-600 font-semibold pt-1">
                ● Live heartbeat active
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Grid: Search & Stepper on left, Summary & Rider on right */}
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        {/* Left Side: Order Search & Tracking Stepper (7 cols on desktop) */}
        <div className="space-y-6 lg:col-span-7">
          {/* Lookup Card - ONLY uses Order Number */}
          <form onSubmit={onSubmit} className="card p-5 sm:p-6 space-y-4 shadow-sm border border-slate-200">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Search className="h-4 w-4 text-brand-600" />
                Live Order Lookup
              </h2>
              <span className="text-[11px] text-slate-400 font-medium">
                Lookup by Order Number only
              </span>
            </div>

            <Field
              label="Order Number"
              hint="Enter your unique GidiEats Order ID to fetch live status (Format: GD followed by date and 6 digits/letters)"
            >
              <div className="relative">
                <Input
                  placeholder="e.g. GD261113-8A2F1C"
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value.toUpperCase())}
                  className="font-mono text-sm sm:text-base font-bold tracking-wider uppercase !pr-28"
                  autoFocus={!initialOrderNumber}
                />
                <Button
                  type="submit"
                  className="btn-primary absolute right-1.5 top-1/2 -translate-y-1/2 !py-1.5 !px-3 text-xs"
                  loading={loading}
                >
                  <Search className="h-3.5 w-3.5" />
                  <span>Track</span>
                </Button>
              </div>
            </Field>

            {/* Recent Orders quick chips */}
            {recentOrders.length > 0 && !result && (
              <div className="pt-1 flex flex-wrap items-center gap-1.5 text-xs">
                <span className="text-slate-400 font-medium">Recent orders:</span>
                {recentOrders.map((no) => (
                  <button
                    key={no}
                    type="button"
                    onClick={() => {
                      setOrderNumber(no);
                      setSearchParams({ orderNumber: no });
                      fetchOrder(no);
                    }}
                    className="font-mono text-[11px] font-bold text-brand-700 bg-brand-50 hover:bg-brand-100 px-2 py-0.5 rounded-lg border border-brand-200 transition"
                  >
                    {no}
                  </button>
                ))}
              </div>
            )}
          </form>

          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-bold text-red-700 flex items-start gap-2.5">
              <span className="text-base">⚠️</span>
              <div>
                <p>{error}</p>
                <p className="text-[11px] font-normal text-red-600 mt-0.5">
                  Check that your Order Number matches the confirmation format (e.g. <code>GD261113-8A2F1C</code>).
                </p>
              </div>
            </div>
          )}

          {loading && !result && <Spinner label="Locating your order in Kano & BUK…" />}

          {/* Live Order Card */}
          {result && (
            <div className="card p-5 sm:p-6 space-y-6 bg-white shadow-sm border border-slate-200">
              {/* Card Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  {result.restaurant?.logo && (
                    <img
                      src={resolveImageUrl(result.restaurant.logo)}
                      alt={result.restaurant.name}
                      className="h-12 w-12 rounded-xl object-cover border border-slate-200 shrink-0"
                      onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                    />
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Order</span>
                      <span className="text-base font-black text-slate-900 font-mono tracking-wide">
                        {result.orderNumber}
                      </span>
                    </div>
                    {result.restaurant && (
                      <p className="mt-0.5 text-xs text-slate-500 font-medium">
                        From <span className="font-bold text-slate-800">{result.restaurant.name}</span>
                        {result.restaurant.addressCity ? ` · ${result.restaurant.addressCity}` : ''}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <StatusBadge status={result.status} />
                  <span className="text-[10px] text-slate-400 flex items-center gap-1">
                    <Clock className="h-3 w-3" /> Placed {formatDate(result.placedAt)}
                  </span>
                </div>
              </div>

              {/* Visual Progress Stepper */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <Bike className="h-4 w-4 text-brand-600" />
                    Delivery Progress
                  </h3>
                  {!TERMINAL.includes(result.status) ? (
                    <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                      Live (Refreshed {lastRefreshed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })})
                    </span>
                  ) : (
                    <span className="text-xs font-semibold text-slate-400">Order Complete</span>
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
                          <p className="text-[11px] text-slate-400 mt-0.5 font-normal">
                            {s.desc}
                          </p>
                          {isCurrent && (
                            <p className="text-[11px] text-brand-700 mt-1 font-semibold flex items-center gap-1">
                              <Sparkles className="h-3 w-3" /> In progress right now
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Assigned Rider Card (if dispatched) */}
              {riderInfo && (
                <div className="rounded-2xl border border-brand-200 bg-brand-50/50 p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-extrabold text-brand-900 flex items-center gap-1.5">
                      <Bike className="h-4 w-4 text-brand-600" />
                      Assigned Campus Rider
                    </p>
                    <span className="text-[10px] font-bold text-brand-700 uppercase tracking-wider bg-white px-2 py-0.5 rounded-full border border-brand-200">
                      Dispatched
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3 pt-1">
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 text-sm">
                        {riderInfo.user ? `${riderInfo.user.firstName} ${riderInfo.user.lastName}` : 'GidiEats Delivery Rider'}
                      </p>
                      <p className="text-xs text-slate-500">
                        {riderInfo.vehicleType ? `${riderInfo.vehicleType}` : 'Motorcycle'} · License: {riderInfo.licensePlate || 'BUK-RIDER'}
                      </p>
                    </div>
                    {riderInfo.user?.phone && (
                      <a
                        href={`tel:${riderInfo.user.phone}`}
                        className="btn-primary !py-1.5 !px-3 text-xs inline-flex items-center gap-1 font-bold shrink-0"
                      >
                        <Phone className="h-3.5 w-3.5" /> Call Rider
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Delivery Address & Contact */}
              {delivery && (
                <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 space-y-1.5 text-xs">
                  <p className="font-extrabold text-slate-800 flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-brand-600" /> Delivery Destination
                  </p>
                  <p className="font-bold text-slate-700">
                    {delivery.name} {delivery.phone ? `· ${delivery.phone}` : ''}
                  </p>
                  <p className="text-slate-500">
                    {[delivery.street, delivery.city, delivery.state].filter(Boolean).join(', ')}
                  </p>
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
                      <span>Delivery accepted & confirmed by customer. Enjoy your meal!</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Side: Order Summary & Payment (5 cols on desktop) */}
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
            <div className="card p-5 sm:p-6 space-y-4 shadow-sm border border-slate-200">
              <h3 className="text-sm font-extrabold text-slate-800 border-b border-slate-100 pb-2">
                Items in this order
              </h3>
              <div className="space-y-2.5">
                {(result.items ?? []).map((it) => (
                  <div key={it.id} className="flex items-center gap-3 text-xs">
                    {it.image ? (
                      <img
                        src={resolveImageUrl(it.image)}
                        alt={it.name}
                        className="h-12 w-12 rounded-xl object-cover bg-slate-100 border border-slate-200 shrink-0"
                        onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                      />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600 font-bold shrink-0">
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

          {/* Quick Help Card on Right if No Order Loaded Yet */}
          {!result && (
            <div className="card p-5 space-y-3 bg-slate-50/60 border border-dashed border-slate-300">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-brand-600" />
                BUK & Kano Guaranteed Delivery
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                All deliveries are managed by verified campus and local riders. Real-time updates reflect kitchen cooking stages and GPS dispatch.
              </p>
              <div className="text-[11px] text-slate-400 space-y-1 pt-1 border-t border-slate-200">
                <p>• Need support? Call Fatima / Dispatch Admin: <strong>+234 800 000 0000</strong></p>
                <p>• Delivery zones: BUK New Campus, Old Campus, Zoo Road, Tarauni, Nasarawa.</p>
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
          phone={delivery?.phone || undefined}
          email={undefined}
          customerName={delivery?.name}
          onClose={() => setShowFlwModal(false)}
          onSuccess={() => {
            setShowFlwModal(false);
            fetchOrder(result.orderNumber);
          }}
        />
      )}
    </div>
  );
}
