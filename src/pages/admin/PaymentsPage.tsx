import { useCallback, useEffect, useState } from 'react';
import {
  Building2,
  Bike,
  ShieldCheck,
  Search,
  RefreshCw,
  Copy,
  Check,
  TrendingUp,
  Receipt
} from 'lucide-react';
import { api, unwrap } from '../../api/client';
import type { Payment } from '../../api/types';
import { Button, EmptyState, Spinner } from '../../components/ui';
import { formatDate, naira } from '../../lib/format';

interface FinancialAuditMeta {
  totalGmv: number;
  totalRestaurantShare: number;
  totalRiderShare: number;
  totalPlatformShare: number;
  totalSuccessfulTransactions: number;
}

export function AdminPayments() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [meta, setMeta] = useState<{ total?: number; financialAudit?: FinancialAuditMeta } | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [methodFilter, setMethodFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [copiedRef, setCopiedRef] = useState<string | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const params: Record<string, unknown> = { limit: 50 };
      if (statusFilter !== 'ALL') params.status = statusFilter;
      if (methodFilter !== 'ALL') params.method = methodFilter;
      if (search.trim()) params.search = search.trim();

      const res = await api.get('/payments', { params });
      const raw = res.data;
      const data = unwrap<Payment[]>(res as never);
      setPayments(Array.isArray(data) ? data : []);
      if (raw?.meta) setMeta(raw.meta as { total?: number; financialAudit?: FinancialAuditMeta });
    } catch {
      setPayments([]);
      setMeta(null);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, methodFilter, search]);

  useEffect(() => {
    load();
  }, [load]);

  const copyRef = (ref: string) => {
    navigator.clipboard.writeText(ref);
    setCopiedRef(ref);
    setTimeout(() => setCopiedRef(null), 2000);
  };

  const audit = meta?.financialAudit;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="page-title">Payment Audit & Revenue Split</h1>
          <p className="mt-1 text-xs text-slate-500 sm:text-sm">
            Live gateway transaction audit trail and automated 3-way distribution (Restaurant, Rider, and Platform share).
          </p>
        </div>
        <Button className="btn-secondary text-xs !py-2" onClick={load} loading={loading}>
          <RefreshCw className="h-3.5 w-3.5" /> Refresh Audit Ledger
        </Button>
      </div>

      {/* 4-Way Financial Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total GMV */}
        <div className="card p-5 bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-md border-0">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">Total Volume (GMV)</span>
            <div className="h-8 w-8 rounded-xl bg-white/10 flex items-center justify-center text-white">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-black text-white tracking-tight">
            {naira(audit?.totalGmv ?? 0)}
          </p>
          <p className="mt-1 text-[11px] text-slate-400 font-medium">
            {audit?.totalSuccessfulTransactions ?? 0} settled transactions
          </p>
        </div>

        {/* Restaurant Share */}
        <div className="card p-5 bg-white border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Restaurant Payouts</span>
            <div className="h-8 w-8 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
              <Building2 className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-black text-slate-900 tracking-tight">
            {naira(audit?.totalRestaurantShare ?? 0)}
          </p>
          <p className="mt-1 text-[11px] text-slate-500 font-medium">
            Food item subtotal revenue
          </p>
        </div>

        {/* Rider Share */}
        <div className="card p-5 bg-white border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Rider Payouts</span>
            <div className="h-8 w-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Bike className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-black text-emerald-700 tracking-tight">
            {naira(audit?.totalRiderShare ?? 0)}
          </p>
          <p className="mt-1 text-[11px] text-slate-500 font-medium">
            Delivery trip fees credited on delivery
          </p>
        </div>

        {/* Platform Share */}
        <div className="card p-5 bg-white border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Platform Net Revenue</span>
            <div className="h-8 w-8 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
              <ShieldCheck className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-black text-brand-600 tracking-tight">
            {naira(audit?.totalPlatformShare ?? 0)}
          </p>
          <p className="mt-1 text-[11px] text-slate-500 font-medium">
            5% platform service fee margin
          </p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="card p-4 flex flex-wrap items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search payment reference, order number, or TxID…"
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2 text-xs">
          <span className="font-semibold text-slate-500">Status:</span>
          {['ALL', 'SUCCESS', 'PENDING'].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg font-bold transition ${
                statusFilter === st
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        {/* Method Filter */}
        <div className="flex items-center gap-2 text-xs">
          <span className="font-semibold text-slate-500">Gateway:</span>
          {['ALL', 'CARD', 'CASH'].map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMethodFilter(m)}
              className={`px-3 py-1.5 rounded-lg font-bold transition ${
                methodFilter === m
                  ? 'bg-brand-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {m === 'CARD' ? 'Flutterwave' : m === 'CASH' ? 'Cash on Delivery' : 'All'}
            </button>
          ))}
        </div>
      </div>

      {/* Payments Audit Table */}
      {loading && <Spinner label="Loading payment ledger…" />}

      {!loading && payments.length === 0 && (
        <EmptyState title="No transactions matched your filters" />
      )}

      {!loading && payments.length > 0 && (
        <div className="card overflow-hidden shadow-xs border border-slate-200">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Transaction / Ref</th>
                  <th className="py-3 px-3">Gateway</th>
                  <th className="py-3 px-3">Order / Customer</th>
                  <th className="py-3 px-3 text-right">Total Billed</th>
                  <th className="py-3 px-3 text-right">🏪 Restaurant</th>
                  <th className="py-3 px-3 text-right">🛵 Rider Payout</th>
                  <th className="py-3 px-3 text-right">🌐 Platform</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Audit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payments.map((p) => {
                  const split = p.auditSplit;
                  const isSuccess = p.status === 'SUCCESS';
                  const isCash = p.method === 'CASH';

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/70 transition">
                      {/* Ref & Date */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-slate-900 select-all">
                            {p.reference}
                          </span>
                          <button
                            type="button"
                            onClick={() => copyRef(p.reference || '')}
                            className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600"
                            title="Copy reference"
                          >
                            {copiedRef === p.reference ? (
                              <Check className="h-3 w-3 text-emerald-600" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </button>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {formatDate(p.paidAt || p.createdAt)}
                        </p>
                        {p.transactionId && (
                          <p className="text-[10px] font-mono text-slate-400">
                            TxID: {p.transactionId}
                          </p>
                        )}
                      </td>

                      {/* Gateway */}
                      <td className="py-3 px-3">
                        {!isCash ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-orange-100 text-orange-800">
                            <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />
                            {p.provider === 'FLUTTERWAVE' ? 'Flutterwave' : (p.provider || 'Flutterwave')}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-sky-100 text-sky-800">
                            Cash
                          </span>
                        )}
                      </td>

                      {/* Order & Customer */}
                      <td className="py-3 px-3">
                        <p className="font-bold text-slate-800 font-mono">
                          {p.order?.orderNumber ?? `#${p.orderId}`}
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {p.order?.customer?.user
                            ? `${p.order.customer.user.firstName} ${p.order.customer.user.lastName}`
                            : 'Guest Customer'}
                        </p>
                      </td>

                      {/* Total */}
                      <td className="py-3 px-3 text-right font-black text-slate-900 font-mono text-sm">
                        {naira(p.amount)}
                      </td>

                      {/* Restaurant Share */}
                      <td className="py-3 px-3 text-right">
                        <span className="font-mono font-bold text-slate-800">
                          {naira(split?.restaurant.amount ?? p.order?.subtotal ?? 0)}
                        </span>
                        <span
                          className={`block text-[9px] font-bold mt-0.5 ${
                            split?.restaurant.status === 'SETTLED'
                              ? 'text-emerald-600'
                              : split?.restaurant.status === 'IN_ESCROW'
                              ? 'text-amber-600'
                              : 'text-slate-400'
                          }`}
                        >
                          {split?.restaurant.status === 'SETTLED'
                            ? '✓ Settled'
                            : split?.restaurant.status === 'IN_ESCROW'
                            ? 'In Escrow'
                            : 'Pending'}
                        </span>
                      </td>

                      {/* Rider Share */}
                      <td className="py-3 px-3 text-right">
                        <span className="font-mono font-bold text-slate-800">
                          {naira(split?.rider.amount ?? p.order?.deliveryFee ?? 0)}
                        </span>
                        <span
                          className={`block text-[9px] font-bold mt-0.5 ${
                            split?.rider.status === 'CREDITED_ON_DELIVERY'
                              ? 'text-emerald-600'
                              : split?.rider.status === 'IN_TRANSIT'
                              ? 'text-sky-600'
                              : 'text-slate-400'
                          }`}
                        >
                          {split?.rider.status === 'CREDITED_ON_DELIVERY'
                            ? '✓ Credited'
                            : split?.rider.status === 'IN_TRANSIT'
                            ? 'In Transit'
                            : 'Unassigned'}
                        </span>
                      </td>

                      {/* Platform Share */}
                      <td className="py-3 px-3 text-right">
                        <span className="font-mono font-bold text-brand-600">
                          {naira(split?.platform.amount ?? p.order?.serviceFee ?? 0)}
                        </span>
                        <span className="block text-[9px] font-bold text-brand-700 mt-0.5">
                          {split?.platform.status === 'COLLECTED' ? '✓ Retained' : 'Pending'}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isSuccess
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {p.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => setSelectedPayment(p)}
                          className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-brand-600 transition"
                          title="View Audit Ledger"
                        >
                          <Receipt className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Audit Detail Modal */}
      {selectedPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-white/10 flex items-center justify-center text-white">
                    <Receipt className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base">Payment Audit Receipt</h3>
                    <p className="text-xs text-slate-400 font-mono">
                      Ref: {selectedPayment.reference}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedPayment(null)}
                  className="h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80"
                >
                  ✕
                </button>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800 flex justify-between items-end">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Total Collected</span>
                  <p className="text-2xl font-black text-white">{naira(selectedPayment.amount)}</p>
                </div>
                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                    selectedPayment.status === 'SUCCESS'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}
                >
                  {selectedPayment.status}
                </span>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
              {/* Order & Customer */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Order Number</span>
                  <span className="font-bold font-mono text-slate-800">
                    {selectedPayment.order?.orderNumber ?? `#${selectedPayment.orderId}`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Gateway Provider</span>
                  <span className="font-bold text-orange-600">
                    {selectedPayment.provider === 'FLUTTERWAVE' ? 'Flutterwave Payment Gateway' : (selectedPayment.provider || selectedPayment.method)}
                  </span>
                </div>
                {selectedPayment.transactionId && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Gateway Transaction ID</span>
                    <span className="font-mono text-slate-700">{selectedPayment.transactionId}</span>
                  </div>
                )}
                {selectedPayment.paidAt && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Verified Paid At</span>
                    <span className="text-slate-700">{formatDate(selectedPayment.paidAt)}</span>
                  </div>
                )}
              </div>

              {/* 3-Way Distribution Ledger */}
              <div>
                <h4 className="font-extrabold uppercase text-[11px] text-slate-500 tracking-wider mb-2">
                  Automated 3-Way Revenue Distribution
                </h4>

                <div className="space-y-2">
                  {/* Restaurant Share */}
                  <div className="p-3 rounded-xl bg-orange-50/60 border border-orange-200/80 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-900 block">
                        🏪 Restaurant Food Subtotal
                      </span>
                      <span className="text-[11px] text-slate-500">
                        {selectedPayment.auditSplit?.restaurant.name ?? selectedPayment.order?.restaurant?.name ?? 'Restaurant'}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-bold text-slate-900 text-sm block">
                        {naira(selectedPayment.auditSplit?.restaurant.amount ?? selectedPayment.order?.subtotal ?? 0)}
                      </span>
                      <span className="badge bg-orange-100 text-orange-800 text-[9px] font-bold">
                        {selectedPayment.auditSplit?.restaurant.status ?? 'SETTLED'}
                      </span>
                    </div>
                  </div>

                  {/* Rider Share */}
                  <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-200/80 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-900 block">
                        🛵 Rider Trip Delivery Payout
                      </span>
                      <span className="text-[11px] text-slate-500">
                        {selectedPayment.auditSplit?.rider.name ?? 'Assigned Rider'}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-bold text-emerald-800 text-sm block">
                        {naira(selectedPayment.auditSplit?.rider.amount ?? selectedPayment.order?.deliveryFee ?? 0)}
                      </span>
                      <span className="badge bg-emerald-100 text-emerald-800 text-[9px] font-bold">
                        {selectedPayment.auditSplit?.rider.status ?? 'CREDITED_ON_DELIVERY'}
                      </span>
                    </div>
                  </div>

                  {/* Platform Share */}
                  <div className="p-3 rounded-xl bg-brand-50/60 border border-brand-200/80 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-900 block">
                        🌐 Platform Commission & Fee
                      </span>
                      <span className="text-[11px] text-slate-500">
                        5% service fee margin
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-bold text-brand-700 text-sm block">
                        {naira(selectedPayment.auditSplit?.platform.amount ?? selectedPayment.order?.serviceFee ?? 0)}
                      </span>
                      <span className="badge bg-brand-100 text-brand-800 text-[9px] font-bold">
                        {selectedPayment.auditSplit?.platform.status ?? 'COLLECTED'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 text-right">
              <button
                type="button"
                onClick={() => setSelectedPayment(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl transition"
              >
                Close Audit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
