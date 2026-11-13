import { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, Bike, MapPin, Phone, Star, Banknote, Store, Clock, ArrowRight } from 'lucide-react';
import { api, apiMessage, unwrap } from '../../api/client';
import type { DashboardPayload, Delivery, Order } from '../../api/types';
import { Button, EmptyState, Spinner, StatusBadge } from '../../components/ui';
import { naira } from '../../lib/format';
import { orderCustomerName, orderCustomerPhone } from '../../lib/order';

const ACTIONS: Record<string, string> = {
  ASSIGNED: 'ACCEPTED',
  ACCEPTED: 'PICKED_UP',
  PICKED_UP: 'OUT_FOR_DELIVERY',
  OUT_FOR_DELIVERY: 'DELIVERED'
};

export function RiderDashboard() {
  const [data, setData] = useState<DashboardPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<number | null>(null);
  const [claiming, setClaiming] = useState<number | null>(null);
  const [toggling, setToggling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [completed, setCompleted] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await api.get('/dashboard');
      setData(unwrap(res as never) as DashboardPayload);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const advance = async (d: Delivery, next: string) => {
    try {
      setBusy(d.id);
      setError(null);
      const res = await api.put(`/deliveries/${d.id}/status`, { status: next });
      const updated = unwrap<Delivery>(res as never);
      if (next === 'DELIVERED') {
        const fee = d.order?.deliveryFee ? ` · ${naira(d.order.deliveryFee)} automatically credited to your earnings!` : ' · Payout credited to your earnings!';
        setCompleted(`Order ${updated.order?.orderNumber ?? d.orderId} delivered${fee}`);
      }
      await load();
    } catch (e) {
      setError(apiMessage(e));
    } finally {
      setBusy(null);
    }
  };

  const claimOrder = async (orderId: number) => {
    try {
      setClaiming(orderId);
      setError(null);
      await api.post(`/orders/${orderId}/claim-delivery`);
      setCompleted(`Delivery for order #${orderId} accepted! You are now assigned to deliver this order.`);
      await load();
    } catch (e) {
      setError(apiMessage(e));
    } finally {
      setClaiming(null);
    }
  };

  const toggleAvailability = async () => {
    const rider = data?.rider as { availabilityStatus?: string } | undefined;
    const current = rider?.availabilityStatus;
    try {
      setToggling(true);
      setError(null);
      const next = current === 'AVAILABLE' ? 'UNAVAILABLE' : (current === 'UNAVAILABLE' ? 'AVAILABLE' : 'UNAVAILABLE');
      await api.put('/users/me/availability', { availabilityStatus: next });
      await load();
    } catch (e) {
      setError(apiMessage(e));
    } finally {
      setToggling(false);
    }
  };

  if (loading) return <Spinner label="Loading dashboard…" />;
  if (!data) return <p className="text-sm text-slate-500">Unable to load dashboard.</p>;

  const c = data.counts ?? {};
  const rider = data.rider as {
    availabilityStatus?: string;
    rating?: number;
    totalDeliveries?: number;
    vehicleType?: string;
    restaurant?: { id: number; name: string; phone?: string; addressCity?: string };
    restaurantId?: number | null;
  } | undefined;
  const isAvailable = rider?.availabilityStatus === 'AVAILABLE';
  const active = data.activeDeliveries ?? [];
  const linkedRestaurant = data.linkedRestaurant || rider?.restaurant;
  const restaurantOrders = (data.restaurantOrders ?? []) as Order[];
  const availablePickupOrders = (data.availablePickupOrders ?? []) as Order[];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="page-title">Rider Dashboard</h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Manage your assignments, track live earnings, and accept incoming campus deliveries.
          </p>
        </div>
        <Button className={isAvailable ? 'btn-secondary' : 'btn-primary'} loading={toggling} onClick={toggleAvailability}>
          {isAvailable ? 'Go offline' : 'Go online'}
        </Button>
      </div>

      {/* Linked Restaurant / Fleet Status Banner */}
      {linkedRestaurant ? (
        <div className="rounded-2xl bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 p-4 text-white shadow-md border border-emerald-500/20 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-400/30">
              <Store className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-black tracking-tight">{linkedRestaurant.name}</span>
                <span className="rounded-md bg-emerald-500/20 px-2 py-0.5 text-[10px] font-extrabold text-emerald-300 border border-emerald-500/30">
                  ★ Dedicated In-House Rider
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                You are linked to {linkedRestaurant.name}. All orders placed here reflect in your incoming queue with automated payouts upon delivery.
              </p>
            </div>
          </div>
          <div className="text-left sm:text-right">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Pickup Base</span>
            <p className="text-xs font-semibold text-white">{linkedRestaurant.addressCity ?? 'BUK New Site'}</p>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-950 p-4 text-white shadow-md border border-indigo-500/20 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-400/30">
              <Bike className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-black tracking-tight">Independent Platform Rider</span>
                <span className="rounded-md bg-indigo-500/20 px-2 py-0.5 text-[10px] font-extrabold text-indigo-300 border border-indigo-500/30">
                  🌐 Freelance / All Spots
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Eligible to claim available deliveries across all 10 Kano & BUK campus restaurants whenever orders are ready.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
        <div className="card p-4 bg-emerald-50/70 border-emerald-200/90 shadow-2xs">
          <p className="text-xs text-emerald-700 font-extrabold uppercase tracking-wide flex items-center gap-1">
            <Banknote className="h-3.5 w-3.5" /> Total Payout
          </p>
          <p className="mt-1 text-2xl font-black text-emerald-950">{naira(c.totalEarnings ?? 0)}</p>
        </div>
        <div className="card p-4 bg-emerald-50/40 border-emerald-100 shadow-2xs">
          <p className="text-xs text-emerald-700 font-extrabold uppercase tracking-wide">Today's Payout</p>
          <p className="mt-1 text-2xl font-black text-slate-800">{naira(c.todayEarnings ?? 0)}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-slate-400 uppercase tracking-wide font-bold">Active Trips</p>
          <p className="mt-1 text-2xl font-extrabold text-slate-800">{c.activeCount ?? 0}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-slate-400 uppercase tracking-wide font-bold">Assigned</p>
          <p className="mt-1 text-2xl font-extrabold text-slate-800">{c.assigned ?? 0}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-slate-400 uppercase tracking-wide font-bold">Completed</p>
          <p className="mt-1 text-2xl font-extrabold text-slate-800">{c.completed ?? 0}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-slate-400 uppercase tracking-wide font-bold">Past 7 Days</p>
          <p className="mt-1 text-2xl font-extrabold text-slate-800">{c.deliveredLast7 ?? 0}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 text-xs font-semibold text-slate-600 bg-white p-3 rounded-xl border border-slate-200/80">
        <span className="flex items-center gap-1.5">
          <Bike className="h-4 w-4 text-brand-600" /> {rider?.vehicleType ?? 'Motorcycle'}
        </span>
        <span className="text-slate-300">·</span>
        {typeof rider?.rating === 'number' && (
          <>
            <span className="flex items-center gap-1.5">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" /> {rider.rating.toFixed(1)} Rating
            </span>
            <span className="text-slate-300">·</span>
          </>
        )}
        <span className="flex items-center gap-1.5">
          Status: {isAvailable ? <StatusBadge status="AVAILABLE" /> : <StatusBadge status="UNAVAILABLE" />}
        </span>
      </div>

      {error && <div className="rounded-xl bg-red-50 p-3 text-xs font-bold text-red-700 border border-red-200">{error}</div>}
      {completed && (
        <div className="flex items-center justify-between rounded-xl bg-emerald-50 p-3 text-xs font-bold text-emerald-800 border border-emerald-200">
          <span>✓ {completed}</span>
          <button className="text-emerald-700 hover:text-emerald-900" onClick={() => setCompleted(null)}>
            ✕
          </button>
        </div>
      )}

      {/* SECTION: Active Deliveries */}
      <div className="space-y-3">
        <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
          <Bike className="h-5 w-5 text-brand-600" /> Active Deliveries In Progress
        </h2>
        {active.length === 0 && (
          <EmptyState title="No active deliveries in progress">
            <p className="mt-1 text-xs text-slate-500">
              {linkedRestaurant
                ? 'Check the incoming restaurant queue below to accept and deliver meals.'
                : 'Check available pickup orders across Kano below to accept deliveries.'}
            </p>
          </EmptyState>
        )}

        {active.map((d) => (
          <div key={d.id} className="card p-4 sm:p-5 border-brand-200 bg-white shadow-soft space-y-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-extrabold text-slate-900 text-sm">{d.order?.orderNumber ?? `Order #${d.orderId}`}</p>
                  <StatusBadge status={d.status} />
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <span className="font-bold text-slate-800">{naira(d.order?.total)}</span>
                  <span>·</span>
                  <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-medium text-slate-700">
                    {d.order?.paymentMethod === 'CARD' ? '💳 Flutterwave Paid' : '💵 Cash on Delivery'}
                  </span>
                </div>
                <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-extrabold border border-emerald-200">
                  <Banknote className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Your Payout: {naira(d.order?.deliveryFee ?? 0)}</span>
                  <span className="text-emerald-600/80 font-normal">· Credited upon delivery</span>
                </div>
              </div>

              <Button
                className="btn-primary text-xs"
                loading={busy === d.id}
                onClick={() => {
                  const next = ACTIONS[d.status];
                  if (next) advance(d, next);
                }}
              >
                <CheckCircle2 className="h-4 w-4" />
                {d.status === 'OUT_FOR_DELIVERY' ? 'Mark Delivered & Credit Payout' : `Advance to ${ACTIONS[d.status]?.replace(/_/g, ' ').toLowerCase() ?? 'done'}`}
              </Button>
            </div>

            <div className="grid gap-2 sm:grid-cols-2 pt-1 text-xs">
              <div className="rounded-xl bg-slate-50 p-2.5 border border-slate-100">
                <p className="font-bold text-slate-500 flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-brand-600" /> Pickup · {d.order?.restaurant?.name}
                </p>
                <p className="text-slate-800 font-semibold mt-1">{d.order?.restaurant?.phone || 'No phone'}</p>
              </div>
              <div className="rounded-xl bg-brand-50/60 p-2.5 border border-brand-100">
                <p className="font-bold text-brand-700 flex items-center gap-1">
                  <Phone className="h-3.5 w-3.5 text-brand-600" /> Customer · {orderCustomerName(d.order) || 'Student Guest'}
                </p>
                {orderCustomerPhone(d.order) && (
                  <p className="text-brand-900 font-semibold mt-1">{orderCustomerPhone(d.order)}</p>
                )}
              </div>
            </div>

            {d.order?.specialInstructions && (
              <p className="rounded-lg bg-amber-50 p-2 text-xs text-amber-800 font-medium">
                Note: {d.order.specialInstructions}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* SECTION: Incoming Restaurant Queue (Dedicated Riders) */}
      {linkedRestaurant && restaurantOrders.length > 0 && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Store className="h-5 w-5 text-emerald-600" /> Incoming Orders from {linkedRestaurant.name}
            </h2>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              {restaurantOrders.length} active in kitchen
            </span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {restaurantOrders.map((ord) => {
              const isReady = ord.status === 'READY_FOR_PICKUP';
              const canClaim = ['READY_FOR_PICKUP', 'PREPARING', 'CONFIRMED'].includes(ord.status);
              return (
                <div key={ord.id} className="card p-4 space-y-2.5 bg-white border-slate-200/90 shadow-2xs hover:border-emerald-300 transition">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-slate-900">{ord.orderNumber}</span>
                    <StatusBadge status={ord.status} />
                  </div>

                  <div className="text-xs text-slate-600 space-y-1">
                    <p className="flex items-center justify-between">
                      <span className="text-slate-400">Total / Payment:</span>
                      <span className="font-bold text-slate-800">
                        {naira(ord.total)} · {ord.paymentMethod === 'CARD' ? '✓ Paid' : 'Cash'}
                      </span>
                    </p>
                    <p className="flex items-center justify-between">
                      <span className="text-emerald-700 font-bold">Your Delivery Payout:</span>
                      <span className="font-extrabold text-emerald-800">{naira(ord.deliveryFee)}</span>
                    </p>
                    <p className="text-[11px] text-slate-500 truncate pt-1">
                      Deliver to: {ord.deliveryAddress ? JSON.parse(ord.deliveryAddress)?.street || 'BUK Hostel' : 'BUK Campus'}
                    </p>
                  </div>

                  {canClaim && (
                    <Button
                      className={`w-full text-xs font-bold ${isReady ? 'btn-primary' : 'btn-secondary'}`}
                      loading={claiming === ord.id}
                      onClick={() => claimOrder(ord.id)}
                    >
                      <ArrowRight className="h-3.5 w-3.5" />
                      {isReady ? 'Accept & Pick Up Now' : 'Claim Delivery for when Ready'}
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SECTION: Available Platform Pickups (For freelance riders or ready orders) */}
      {availablePickupOrders.length > 0 && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Clock className="h-5 w-5 text-brand-600" /> Orders Ready for Pickup Across Campus
            </h2>
            <span className="text-xs font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded-full border border-brand-200">
              {availablePickupOrders.length} ready
            </span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {availablePickupOrders.map((ord) => (
              <div key={ord.id} className="card p-4 space-y-2.5 bg-white border-brand-200 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-extrabold text-sm text-slate-900">{ord.orderNumber}</span>
                    <p className="text-xs font-semibold text-brand-600">{ord.restaurant?.name}</p>
                  </div>
                  <span className="rounded-md bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                    Ready for Pickup
                  </span>
                </div>

                <div className="text-xs text-slate-600 space-y-1">
                  <p className="flex items-center justify-between">
                    <span className="text-slate-400">Total Amount:</span>
                    <span className="font-bold text-slate-800">{naira(ord.total)}</span>
                  </p>
                  <p className="flex items-center justify-between">
                    <span className="text-emerald-700 font-bold">Delivery Fee Payout:</span>
                    <span className="font-extrabold text-emerald-800">{naira(ord.deliveryFee)}</span>
                  </p>
                </div>

                <Button
                  className="btn-primary w-full text-xs font-bold"
                  loading={claiming === ord.id}
                  onClick={() => claimOrder(ord.id)}
                >
                  <CheckCircle2 className="h-3.5 w-3.5" /> Accept Delivery
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}