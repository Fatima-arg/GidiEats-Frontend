import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronRight, Clock } from 'lucide-react';
import { api, resolveImageUrl, unwrap } from '../../api/client';
import type { Order } from '../../api/types';
import { EmptyState, Spinner, StatusBadge } from '../../components/ui';
import { formatDate, naira } from '../../lib/format';

const STATUS_ORDER: Record<string, number> = {
  PENDING: 1,
  CONFIRMED: 2,
  PREPARING: 3,
  READY_FOR_PICKUP: 4,
  RIDER_ASSIGNED: 5,
  PICKED_UP: 6,
  OUT_FOR_DELIVERY: 7,
  DELIVERED: 8,
  CANCELLED: 0,
  REJECTED: 0
};

export function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ACTIVE');

  useEffect(() => {
    let active = true;
    api
      .get('/orders', { params: { limit: 50 } })
      .then((res) => {
        const data = unwrap<Order[]>(res as never);
        if (active) setOrders(Array.isArray(data) ? data : []);
      })
      .catch(() => active && setOrders([]))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  const visible = orders
    .filter((o) =>
      filter === 'ACTIVE'
        ? STATUS_ORDER[o.status] > 0
        : filter === 'FINISHED'
          ? ['DELIVERED', 'CANCELLED', 'REJECTED'].includes(o.status)
          : true
    )
    .sort((a, b) => (STATUS_ORDER[a.status] || 0) - (STATUS_ORDER[b.status] || 0));

  return (
    <div className="space-y-6">
      {/* Page Title & Filter Chips */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 sm:text-3xl">My Orders</h1>
          <p className="mt-1 text-xs text-slate-500 sm:text-sm">
            Track active deliveries and review your past food orders.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {['ACTIVE', 'FINISHED', 'ALL'].map((f) => {
            const active = filter === f;
            return (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`rounded-2xl px-4 py-2 text-xs font-extrabold transition-all ${
                  active
                    ? 'bg-brand-600 text-white shadow-sm shadow-brand-500/20'
                    : 'bg-white text-slate-600 border border-slate-200/90 hover:bg-slate-50'
                }`}
              >
                {f === 'ACTIVE' ? 'Active Orders' : f === 'FINISHED' ? 'Completed' : 'All Orders'}
              </button>
            );
          })}
        </div>
      </div>

      {loading && <Spinner label="Loading your food orders…" />}

      {!loading && visible.length === 0 && (
        <EmptyState title="No orders found">
          <p className="mt-1 text-xs text-slate-500">
            {filter === 'ACTIVE'
              ? 'You have no active orders in flight right now.'
              : 'You haven’t completed any orders yet.'}
          </p>
          <Link to="/" className="btn-primary mt-4 inline-flex items-center gap-2 text-xs">
            <span>Explore Restaurants</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </EmptyState>
      )}

      {/* Responsive Orders Grid (2 columns on tablet/desktop, 1 on mobile) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {visible.map((o) => (
          <Link
            key={o.id}
            to={`/app/orders/${o.id}`}
            className="card-hover group flex flex-col justify-between p-5 bg-white"
          >
            <div>
              {/* Header: Restaurant & Status */}
              <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700 font-black">
                    {o.restaurant?.logo ? (
                      <img
                        src={resolveImageUrl(o.restaurant.logo)}
                        alt=""
                        className="h-full w-full rounded-xl object-cover"
                        onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                      />
                    ) : (
                      o.restaurant?.name?.[0] ?? 'G'
                    )}
                  </div>
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-extrabold text-slate-900 group-hover:text-brand-600 transition-colors">
                      {o.restaurant?.name ?? 'Restaurant Order'}
                    </h3>
                    <p className="text-[11px] font-mono text-slate-400 mt-0.5">
                      #{o.orderNumber}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1">
                  <StatusBadge status={o.status} />
                  {o.payment?.status === 'SUCCESS' ? (
                    <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                      Paid · {o.payment.provider === 'FLUTTERWAVE' ? 'Flutterwave' : (o.payment.provider || 'Flutterwave')}
                    </span>
                  ) : o.paymentMethod === 'CARD' ? (
                    <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
                      Payment Pending
                    </span>
                  ) : (
                    <span className="text-[10px] font-semibold text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded">
                      Cash on Delivery
                    </span>
                  )}
                </div>
              </div>

              {/* Items summary */}
              <div className="py-3 text-xs text-slate-600 space-y-1">
                {(o.items ?? []).slice(0, 2).map((it) => (
                  <p key={it.id} className="truncate text-slate-700">
                    <span className="font-bold text-brand-700">{it.quantity}×</span> {it.name}
                  </p>
                ))}
                {(o.items?.length ?? 0) > 2 && (
                  <p className="text-[11px] font-medium text-slate-400">
                    +{o.items!.length - 2} more item{o.items!.length - 2 === 1 ? '' : 's'}
                  </p>
                )}
              </div>
            </div>

            {/* Footer: Date, Total, and Arrow */}
            <div className="mt-2 flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
              <span className="text-slate-400 flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {formatDate(o.placedAt)}
              </span>
              <div className="flex items-center gap-2">
                <span className="font-black text-slate-900 text-sm">{naira(o.total)}</span>
                <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-brand-600 transition-colors" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}