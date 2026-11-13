import { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, Phone } from 'lucide-react';
import { api, apiMessage, unwrap } from '../../api/client';
import type { Delivery } from '../../api/types';
import { Button, EmptyState, Spinner, StatusBadge } from '../../components/ui';
import { formatDate, naira, timeAgo } from '../../lib/format';
import { orderCustomerName, orderCustomerPhone } from '../../lib/order';

const ACTIONS: Record<string, string> = {
  ASSIGNED: 'ACCEPTED',
  ACCEPTED: 'PICKED_UP',
  PICKED_UP: 'OUT_FOR_DELIVERY',
  OUT_FOR_DELIVERY: 'DELIVERED'
};

export function RiderDeliveries() {
  const [rows, setRows] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await api.get('/deliveries', { params: { limit: 50 } });
      const data = unwrap<Delivery[]>(res as never);
      setRows(Array.isArray(data) ? data : []);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const advance = async (d: Delivery) => {
    const next = ACTIONS[d.status];
    if (!next) return;
    try {
      setBusy(d.id);
      setError(null);
      await api.put(`/deliveries/${d.id}/status`, { status: next });
      await load();
    } catch (e) {
      setError(apiMessage(e));
    } finally {
      setBusy(null);
    }
  };

  return (
    <div>
      <h1 className="page-title mb-4">My deliveries</h1>

      {error && <div className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
      {loading && <Spinner label="Loading deliveries…" />}
      {!loading && rows.length === 0 && <EmptyState title="No deliveries assigned to you yet" />}

      <div className="space-y-3">
        {rows.map((d) => (
          <div key={d.id} className="card p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-bold text-slate-800">{d.order?.orderNumber ?? `Order #${d.orderId}`}</p>
                  <StatusBadge status={d.status} />
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  {timeAgo(d.assignedAt)} · {d.order?.restaurant?.name ?? '—'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-slate-800">{naira(d.order?.total)}</p>
                <p className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md inline-block mt-0.5 border border-emerald-200/60">
                  Your Payout: {naira(d.order?.deliveryFee ?? 0)}
                </p>
              </div>
            </div>

            {(orderCustomerName(d.order) || orderCustomerPhone(d.order)) && (
              <p className="mt-2 rounded-lg bg-brand-50 px-3 py-2 text-xs text-brand-700 flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5" />
                {orderCustomerName(d.order) || 'Customer'} · {orderCustomerPhone(d.order)}
              </p>
            )}

            <div className="mt-3 flex items-center justify-between">
              <span className="text-xs text-slate-400">{formatDate(d.deliveredAt ?? d.assignedAt)}</span>
              {ACTIONS[d.status] && (
                <Button className="btn-primary" loading={busy === d.id} onClick={() => advance(d)}>
                  <CheckCircle2 className="h-4 w-4" />
                  {d.status === 'OUT_FOR_DELIVERY' ? 'Confirm delivery' : `Mark as ${ACTIONS[d.status].replace(/_/g, ' ').toLowerCase()}`}
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}