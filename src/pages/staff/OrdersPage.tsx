import { useCallback, useEffect, useState } from 'react';
import { Bike, Check, Eye, X } from 'lucide-react';
import clsx from 'clsx';
import { api, apiMessage, unwrap } from '../../api/client';
import type { Order, Rider } from '../../api/types';
import { Badge, Button, EmptyState, Spinner, StatusBadge } from '../../components/ui';
import { formatDate, naira, timeAgo } from '../../lib/format';
import { orderCustomerName, orderCustomerPhone } from '../../lib/order';

const TAB_COUNT = ['PENDING', 'CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP', 'RIDER_ASSIGNED', 'OUT_FOR_DELIVERY', 'DELIVERED'];

const TAB_LABEL: Record<string, string> = {
  PENDING: 'Pending',
  CONFIRMED: 'Confirmed',
  PREPARING: 'Preparing',
  READY_FOR_PICKUP: 'Ready · assign rider',
  RIDER_ASSIGNED: 'With rider',
  OUT_FOR_DELIVERY: 'Out for delivery',
  DELIVERED: 'Delivered'
};

const NEXT: Record<string, string> = {
  PENDING: 'CONFIRMED',
  CONFIRMED: 'PREPARING',
  PREPARING: 'READY_FOR_PICKUP'
};

const NEXT_LABEL: Record<string, string> = {
  CONFIRMED: 'Confirm order',
  PREPARING: 'Start preparing',
  READY_FOR_PICKUP: 'Mark ready'
};

interface RiderOption {
  id: number;
  restaurantId?: number | null;
  restaurant?: { id: number; name: string };
  user: { id: number; firstName: string; lastName: string; phone: string };
  vehicleType?: string;
}

export function StaffOrders() {
  const [tab, setTab] = useState('PENDING');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<Order | null>(null);
  const [assigning, setAssigning] = useState<Order | null>(null);
  const [riders, setRiders] = useState<RiderOption[]>([]);
  const [busy, setBusy] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/orders', { params: { status: tab, limit: 50 } });
      const list = unwrap<Order[]>(res as never) as Order[];
      setOrders(Array.isArray(list) ? list : []);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    load();
  }, [load]);

  const loadRiders = async () => {
    try {
      const res = await api.get('/users/riders/available');
      const data = unwrap<Rider[]>(res as never);
      setRiders(Array.isArray(data) ? (data as unknown as RiderOption[]) : []);
    } catch {
      setRiders([]);
    }
  };

  const setStatus = async (order: Order, status: string) => {
    try {
      setBusy(order.id);
      setError(null);
      await api.put(`/orders/${order.id}/status`, { status });
      if (order.id === detail?.id) loadDetail(detail.id);
      if (status === 'READY_FOR_PICKUP') {
        setAssigning(order);
        loadRiders();
      } else {
        await load();
      }
    } catch (e) {
      setError(apiMessage(e));
    } finally {
      setBusy(null);
    }
  };

  const rejectOrder = async (order: Order) => {
    try {
      setBusy(order.id);
      setError(null);
      await api.put(`/orders/${order.id}/status`, { status: 'REJECTED', reason: 'Rejected by restaurant' });
      await load();
    } catch (e) {
      setError(apiMessage(e));
    } finally {
      setBusy(null);
    }
  };

  const assignRider = async (riderId: number) => {
    if (!assigning) return;
    try {
      setBusy(-1);
      setError(null);
      await api.post(`/orders/${assigning.id}/assign-rider`, { riderId });
      if (assigning.id === detail?.id) loadDetail(assigning.id);
      setAssigning(null);
      await load();
    } catch (e) {
      setError(apiMessage(e));
    } finally {
      setBusy(null);
    }
  };

  const loadDetail = async (id: number) => {
    const res = await api.get(`/orders/${id}`);
    setDetail(unwrap(res as never) as Order);
  };

  const counters: Record<string, number> = {};
  for (const s of TAB_COUNT) counters[s] = orders.filter((o) => o.status === s).length;

  return (
    <div>
      <h1 className="page-title mb-4">Orders</h1>

      <div className="mb-4 flex gap-1.5 flex-wrap">
        {TAB_COUNT.map((s) => (
          <button
            key={s}
            onClick={() => setTab(s)}
            className={clsx(
              'rounded-full px-3 py-1.5 text-xs font-semibold transition',
              tab === s ? 'bg-brand-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:border-brand-300'
            )}
          >
            {TAB_LABEL[s]}
            {counters[s] > 0 && (
              <span className={clsx('ml-1.5 badge', tab === s ? 'bg-white/20 text-white' : 'bg-brand-50 text-brand-700')}>
                {counters[s]}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs text-amber-900">
        <strong>Handing an order to delivery:</strong> open the <strong>Ready · assign rider</strong> tab and click{' '}
        <strong>Assign rider</strong> on an order. Orders in the <strong>With rider</strong> tab are already with a rider.
      </div>

      {error && <div className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

      {loading && <Spinner label="Loading orders…" />}
      {!loading && orders.length === 0 && (
        <EmptyState title={tab === 'READY_FOR_PICKUP' ? 'No orders waiting for a rider' : `No ${TAB_LABEL[tab].toLowerCase()} orders`} />
      )}

      <div className="space-y-3">
        {orders.map((o) => {
          const isCash = o.paymentMethod === 'CASH';
          const isPaid = o.payment?.status === 'SUCCESS';
          const canAdvance = isCash || isPaid;

          return (
            <div key={o.id} className="card p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold text-slate-800">
                      {o.orderNumber} <span className="font-normal text-slate-400">· {orderCustomerName(o) || 'Customer'}</span>
                    </p>
                    {isPaid ? (
                      <span className="badge bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                        ✓ Paid ({o.payment?.provider === 'FLUTTERWAVE' ? 'Flutterwave' : (o.payment?.provider || 'Online')})
                      </span>
                    ) : isCash ? (
                      <span className="badge bg-sky-100 text-sky-800 text-[10px] font-bold">
                        Cash on Delivery
                      </span>
                    ) : (
                      <span className="badge bg-amber-100 text-amber-800 text-[10px] font-bold animate-pulse">
                        ⚠ Awaiting Payment
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {timeAgo(o.placedAt)} · {o.paymentMethod} · {formatDate(o.placedAt)}
                  </p>
                  {o.rider?.user && !['READY_FOR_PICKUP'].includes(o.status) && (
                    <p className="text-xs text-slate-500 mt-1">
                      <Bike className="inline h-3.5 w-3.5 -mt-0.5 mr-1 text-brand-600" />
                      {o.rider.user.firstName} {o.rider.user.lastName}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <StatusBadge status={o.status} />
                  <p className="mt-0.5 text-sm font-bold text-slate-800">{naira(o.total)}</p>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-1.5 text-xs text-slate-500">
                {(o.items ?? []).map((it) => (
                  <span key={it.id} className="rounded-full bg-slate-100 px-2 py-0.5">
                    {it.quantity}× {it.name}
                  </span>
                ))}
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                {o.status === 'READY_FOR_PICKUP' && (
                  <p className="w-full text-xs font-semibold text-amber-600">
                    Ready — assign a rider below to hand this order over for delivery.
                  </p>
                )}
                <Button className="btn-secondary text-xs !py-1.5" onClick={() => loadDetail(o.id)}>
                  <Eye className="h-4 w-4" /> View
                </Button>
                {NEXT[o.status] && (
                  canAdvance ? (
                    <Button
                      className="btn-primary text-xs !py-1.5"
                      loading={busy === o.id}
                      onClick={() => setStatus(o, NEXT[o.status])}
                    >
                      <Check className="h-4 w-4" /> {NEXT_LABEL[o.status] ?? `Move to ${NEXT[o.status].replace(/_/g, ' ')}`}
                    </Button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-amber-800 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200">
                        🔒 Awaiting Flutterwave Payment to Confirm
                      </span>
                      <Button className="btn-secondary text-xs !py-1.5" onClick={() => load()}>
                        Recheck Payment
                      </Button>
                    </div>
                  )
                )}
                {o.status === 'READY_FOR_PICKUP' && (
                  <Button className="btn-secondary text-xs !py-1.5" onClick={() => { setAssigning(o); loadRiders(); }}>
                    <Bike className="h-4 w-4" /> Assign rider
                  </Button>
                )}
                {['PENDING', 'CONFIRMED'].includes(o.status) && (
                  <Button className="btn-danger text-xs !py-1.5" loading={busy === o.id} onClick={() => rejectOrder(o)}>
                    <X className="h-4 w-4" /> Reject
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {detail && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40" onClick={() => setDetail(null)} />
          <div className="relative w-full max-w-lg rounded-2xl bg-white p-5 shadow-2xl">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-slate-800">{detail.orderNumber}</h2>
              <button className="p-1 text-slate-400 hover:text-slate-600" onClick={() => setDetail(null)}>
                ✕
              </button>
            </div>
            {(orderCustomerName(detail) || orderCustomerPhone(detail)) && (
              <p className="mb-2 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
                Customer: <span className="font-semibold">{orderCustomerName(detail) || '—'}</span>
                {orderCustomerPhone(detail) && <span> · {orderCustomerPhone(detail)}</span>}
              </p>
            )}
            {detail.payment && (
              <div className="mb-3 rounded-lg bg-slate-50 px-3 py-2 text-xs flex items-center justify-between">
                <div>
                  <span className="text-slate-400 font-medium">Payment:</span>{' '}
                  <span className="font-bold text-slate-800">
                    {detail.payment.provider === 'FLUTTERWAVE' ? 'Flutterwave' : (detail.payment.provider || detail.paymentMethod)}
                  </span>
                  {detail.payment.reference && (
                    <span className="text-[10px] text-slate-400 block font-mono">Ref: {detail.payment.reference}</span>
                  )}
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  detail.payment.status === 'SUCCESS' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  {detail.payment.status}
                </span>
              </div>
            )}
            <div className="space-y-2 text-sm">
              {(detail.items ?? []).map((it) => (
                <div key={it.id} className="flex justify-between">
                  <span className="text-slate-600">{it.quantity}× {it.name}</span>
                  <span className="font-medium text-slate-700">{naira(Number(it.price) * it.quantity)}</span>
                </div>
              ))}
              <hr />
              <div className="flex justify-between text-slate-700 font-semibold bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
                <span>Restaurant Earnings (Food Subtotal)</span>
                <span className="text-emerald-800 font-bold">{naira(detail.subtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-500 text-xs px-1">
                <span>Rider Delivery Payout</span>
                <span className="font-medium text-slate-700">{naira(detail.deliveryFee)}</span>
              </div>
              <div className="flex justify-between text-slate-500 text-xs px-1">
                <span>Platform Service Fee</span>
                <span className="font-medium text-slate-700">{naira(detail.serviceFee)}</span>
              </div>
              <div className="flex justify-between font-extrabold text-slate-900 border-t border-slate-200 pt-2 px-1">
                <span>Total Customer Paid</span>
                <span className="text-brand-600">{naira(detail.total)}</span>
              </div>
              {detail.specialInstructions && (
                <p className="rounded-lg bg-amber-50 p-2 text-amber-800">“{detail.specialInstructions}”</p>
              )}
              {detail.status === 'READY_FOR_PICKUP' && (
                <Button className="btn-primary w-full" onClick={() => { setDetail(null); setAssigning(detail); loadRiders(); }}>
                  <Bike className="h-4 w-4" /> Assign rider
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {assigning && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40" onClick={() => setAssigning(null)} />
          <div className="relative w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-slate-800">Assign a rider</h2>
              <button className="p-1 text-slate-400 hover:text-slate-600" onClick={() => setAssigning(null)}>
                ✕
              </button>
            </div>
            {riders.length === 0 && <EmptyState title="No available riders right now" />}
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {riders.map((rd) => {
                const isDedicated = Boolean(rd.restaurantId);
                return (
                  <button
                    key={rd.id}
                    onClick={() => assignRider(rd.id)}
                    disabled={busy === -1}
                    className={`flex w-full items-center justify-between rounded-xl border p-3 text-left transition ${
                      isDedicated
                        ? 'border-emerald-300 bg-emerald-50/40 hover:bg-emerald-50'
                        : 'border-slate-200 hover:border-brand-400 hover:bg-brand-50'
                    } disabled:opacity-50`}
                  >
                    <span>
                      <span className="flex items-center gap-1.5 text-sm font-semibold text-slate-800">
                        {rd.user.firstName} {rd.user.lastName}
                        {isDedicated ? (
                          <span className="rounded bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-1.5 py-0.5">
                            ★ In-House Dedicated Rider
                          </span>
                        ) : (
                          <span className="rounded bg-slate-100 text-slate-600 text-[10px] font-medium px-1.5 py-0.5">
                            Freelance Rider
                          </span>
                        )}
                      </span>
                      <span className="block text-xs text-slate-500 mt-0.5">
                        {rd.vehicleType ?? 'Bike'} · {rd.user.phone}
                      </span>
                    </span>
                    <Badge tone="green">Assign</Badge>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}