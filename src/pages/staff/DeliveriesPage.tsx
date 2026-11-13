import { useEffect, useState } from 'react';
import { api, unwrap } from '../../api/client';
import type { Delivery } from '../../api/types';
import { EmptyState, Spinner, StatusBadge } from '../../components/ui';
import { formatDate, naira, timeAgo } from '../../lib/format';
import { orderCustomerName } from '../../lib/order';

export function StaffDeliveries() {
  const [rows, setRows] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/deliveries', { params: { limit: 50 } })
      .then((res) => {
        const data = unwrap<Delivery[]>(res as never);
        setRows(Array.isArray(data) ? data : []);
      })
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1 className="page-title mb-4">Deliveries</h1>

      {loading && <Spinner label="Loading deliveries…" />}
      {!loading && rows.length === 0 && <EmptyState title="No deliveries yet" />}

      <div className="space-y-3">
        {rows.map((d) => (
          <div key={d.id} className="card p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-bold text-slate-800">
                  {d.order?.orderNumber} <span className="font-normal text-slate-400">· to {orderCustomerName(d.order) || 'Customer'}</span>
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {timeAgo(d.assignedAt)} · {d.order?.restaurant?.name}
                </p>
              </div>
              <div className="text-right">
                <StatusBadge status={d.status} />
                <p className="mt-0.5 text-sm font-bold text-slate-800">{naira(d.order?.total)}</p>
              </div>
            </div>
            {d.rider?.user && (
              <div className="mt-3 flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
                <span className="font-semibold text-slate-600">
                  {d.rider.user.firstName} {d.rider.user.lastName}
                </span>
                <span>·</span>
                <span>{d.rider.vehicleType ?? '—'}</span>
                <span>·</span>
                <span>{d.rider.user.phone}</span>
              </div>
            )}
            {d.deliveredAt && <p className="mt-2 text-xs text-slate-400">Delivered {formatDate(d.deliveredAt)}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}