import { useState } from 'react';
import {
  CheckCircle2,
  Clock,
  CreditCard,
  Copy,
  Check,
  Banknote,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import type { Payment } from '../../api/types';
import { naira, formatDate } from '../../lib/format';

export interface PaymentTrackerCardProps {
  payment?: Payment | null;
  paymentMethod: string;
  total: number | string;
  orderNumber: string;
  onPayWithFlutterwave?: () => void;
  isGuest?: boolean;
}

export function PaymentTrackerCard({
  payment,
  paymentMethod,
  total,
  orderNumber,
  onPayWithFlutterwave
}: PaymentTrackerCardProps) {
  const [copied, setCopied] = useState(false);

  const isSuccess = payment?.status === 'SUCCESS';
  const isCash = paymentMethod === 'CASH';
  const isPending = !isCash && !isSuccess;

  const copyReference = (ref: string) => {
    navigator.clipboard.writeText(ref);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const providerName = payment?.provider === 'FLUTTERWAVE' ? 'Flutterwave' : (payment?.provider || 'Flutterwave');
  const reference = payment?.reference || `FLW-${orderNumber}`;

  return (
    <div className="card p-5 sm:p-6 space-y-4 border border-slate-200/90 shadow-xs">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-xl ${
              isSuccess
                ? 'bg-emerald-50 text-emerald-600'
                : isCash
                ? 'bg-sky-50 text-sky-600'
                : 'bg-amber-50 text-amber-600'
            }`}
          >
            {isSuccess ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : isCash ? (
              <Banknote className="h-4 w-4" />
            ) : (
              <CreditCard className="h-4 w-4" />
            )}
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-slate-900">Payment Status</h3>
            <p className="text-[11px] text-slate-400">Real-time payment gateway tracking</p>
          </div>
        </div>

        {/* Status Pill */}
        {isSuccess ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse" />
            Paid & Verified
          </span>
        ) : isCash ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-sky-100 text-sky-800">
            Pay on Delivery
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
            <Clock className="h-3 w-3 text-amber-600" />
            Awaiting Payment
          </span>
        )}
      </div>

      {/* Gateway & Details Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-100">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Gateway</span>
          <div className="mt-1 flex items-center gap-2">
            {!isCash ? (
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-slate-900">{providerName}</span>
                <span className="text-[10px] font-semibold bg-orange-100 text-orange-800 px-1.5 py-0.2 rounded">
                  Live Gateway
                </span>
              </div>
            ) : (
              <span className="font-bold text-slate-900">Cash on Delivery</span>
            )}
          </div>
        </div>

        <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-100">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Amount</span>
          <p className="mt-1 font-mono font-bold text-slate-900 text-sm">{naira(total)}</p>
        </div>

        {!isCash && (
          <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-100 sm:col-span-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Transaction Reference
              </span>
              <button
                type="button"
                onClick={() => copyReference(reference)}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-600 hover:text-brand-700"
              >
                {copied ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <p className="mt-1 font-mono text-xs text-slate-700 select-all font-semibold break-all">{reference}</p>

            {payment?.transactionId && (
              <p className="mt-1 text-[11px] font-mono text-slate-400">
                TxID: <span className="text-slate-600">{payment.transactionId}</span>
              </p>
            )}

            {payment?.paidAt && (
              <p className="mt-1 text-[11px] text-emerald-700 font-medium">
                Confirmed on {formatDate(payment.paidAt)}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Action for Pending Online Payments */}
      {isPending && onPayWithFlutterwave && (
        <div className="pt-2">
          <div className="mb-3 p-3 bg-amber-50/80 border border-amber-200/80 rounded-xl text-xs text-amber-900 flex items-start gap-2">
            <Sparkles className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Complete your payment to confirm your order</p>
              <p className="text-amber-700 text-[11px] mt-0.5">
                Pay instantly with Card, Bank Transfer, or USSD via Flutterwave.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onPayWithFlutterwave}
            className="w-full py-3 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-bold text-sm rounded-xl shadow-md transition flex items-center justify-center gap-2"
          >
            <CreditCard className="h-4 w-4" />
            <span>Pay {naira(total)} with Flutterwave</span>
          </button>
        </div>
      )}

      {/* Secure footer mark */}
      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
        <span className="flex items-center gap-1 text-slate-500">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
          PCI-DSS Level 1 Encrypted
        </span>
        {!isCash && <span className="font-medium text-slate-400">Powered by Flutterwave</span>}
      </div>
    </div>
  );
}
