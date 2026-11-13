import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Check, Star, XCircle } from 'lucide-react';
import { api, apiMessage, unwrap } from '../../api/client';
import type { Order } from '../../api/types';
import { Button, EmptyState, Spinner, StatusBadge } from '../../components/ui';
import { formatDate, naira, titleCase } from '../../lib/format';
import { PaymentTrackerCard } from '../../components/payment/PaymentTrackerCard';
import { FlutterwaveModal } from '../../components/payment/FlutterwaveModal';

const FLOW = ['PENDING', 'CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP', 'RIDER_ASSIGNED', 'PICKED_UP', 'OUT_FOR_DELIVERY', 'DELIVERED'];

function StarSelect({ value, onChange, label }: { value: number; onChange: (v: number) => void; label: string }) {
  return (
    <div className="flex items-center gap-1">
      <span className="mr-2 text-sm font-semibold text-slate-600">{label}</span>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          className="p-0.5"
          aria-label={`${label} ${n} of 5`}
        >
          <Star
            className={`h-5 w-5 ${n <= value ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`}
          />
        </button>
      ))}
    </div>
  );
}

export function OrderDetailPage() {
  const { id } = useParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [rating, setRating] = useState(0);
  const [deliveryRating, setDeliveryRating] = useState(0);
  const [comment, setComment] = useState('');
  const [ratingBusy, setRatingBusy] = useState(false);
  const [showFlwModal, setShowFlwModal] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await api.get(`/orders/${id}`);
      setOrder(unwrap<Order>(res as never));
    } catch (e) {
      setError(apiMessage(e));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
    const t = setInterval(load, 15000);
    return () => clearInterval(t);
  }, [load]);

  const cancelOrder = async () => {
    try {
      setCancelling(true);
      const res = await api.post(`/orders/${id}/cancel`, {});
      setOrder(unwrap<Order>(res as never));
    } catch (e) {
      setError(apiMessage(e));
    } finally {
      setCancelling(false);
    }
  };

  const acceptDelivery = async () => {
    try {
      setConfirming(true);
      setError(null);
      const res = await api.post(`/orders/${id}/confirm-receipt`, {});
      setOrder(unwrap<Order>(res as never));
    } catch (e) {
      setError(apiMessage(e));
    } finally {
      setConfirming(false);
    }
  };

  const submitRating = async () => {
    if (rating === 0) {
      setError('Please rate your order with at least one star.');
      return;
    }
    try {
      setRatingBusy(true);
      setError(null);
      const res = await api.post(`/orders/${id}/rating`, {
        rating,
        deliveryRating: deliveryRating || undefined,
        comment: comment.trim() || undefined
      });
      setOrder(unwrap<Order>(res as never));
    } catch (e) {
      setError(apiMessage(e));
    } finally {
      setRatingBusy(false);
    }
  };

  if (loading) return <Spinner label="Loading order…" />;
  if (error && !order) return <EmptyState title={error} />;
  if (!order) return <EmptyState title="Order not found" />;

  const flowIndex = FLOW.indexOf(order.status);
  const isCardPending = order.paymentMethod === 'CARD' && order.payment?.status !== 'SUCCESS';
  const canCancel = ['PENDING', 'CONFIRMED'].includes(order.status);

  return (
    <div className="space-y-6">
      <Link
        to="/app/orders"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-brand-600 transition"
      >
        <ArrowLeft className="h-4 w-4" /> Back to My Orders
      </Link>

      {/* Main Order Status Header */}
      <div className="card p-5 sm:p-6 bg-white space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Order</span>
              <h1 className="text-xl font-black text-slate-900 sm:text-2xl">{order.orderNumber}</h1>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              {order.restaurant?.name} · Placed {formatDate(order.placedAt)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={order.status} />
            {canCancel && (
              <Button className="btn-danger text-xs py-1.5" loading={cancelling} onClick={cancelOrder}>
                <XCircle className="h-4 w-4" /> Cancel Order
              </Button>
            )}
          </div>
        </div>

        {isCardPending && (
          <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4 text-xs text-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="font-extrabold text-sm">Payment required</p>
              <p className="text-amber-700 mt-0.5">
                Please complete your payment of {naira(order.total)} via Flutterwave to confirm this order.
              </p>
            </div>
            <Button
              className="btn-primary text-xs py-2 px-3 shrink-0"
              onClick={() => setShowFlwModal(true)}
            >
              Pay with Flutterwave
            </Button>
          </div>
        )}

        {order.status === 'DELIVERED' && (
          <div>
            {!order.customerConfirmedAt ? (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4">
                <p className="text-sm font-extrabold text-emerald-900">Your order has arrived!</p>
                <p className="mt-0.5 text-xs text-emerald-700">
                  Did you receive your meal safely? Confirm receipt below to close out the delivery.
                </p>
                <Button className="btn-primary mt-3 text-xs" loading={confirming} onClick={acceptDelivery}>
                  <Check className="h-4 w-4" /> Confirm & Accept Delivery
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2 rounded-2xl bg-emerald-50 border border-emerald-200/80 px-4 py-3 text-xs font-bold text-emerald-800">
                <Check className="h-4 w-4 text-emerald-600" />
                <span>Delivery confirmed and accepted. Enjoy your meal!</span>
              </div>
            )}
          </div>
        )}

        {/* Stepper Progress Bar */}
        {flowIndex >= 0 && (
          <div className="space-y-3 pt-2">
            <div className="flex items-center">
              {FLOW.map((step, i) => (
                <div key={step} className="flex flex-1 items-center">
                  <div
                    className={`h-3 w-3 rounded-full shrink-0 transition-all ${
                      i <= flowIndex ? 'bg-brand-600 ring-4 ring-brand-100' : 'bg-slate-200'
                    }`}
                  />
                  {i < FLOW.length - 1 && (
                    <div className={`h-1 w-full ${i < flowIndex ? 'bg-brand-600' : 'bg-slate-200'}`} />
                  )}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-1 pt-1">
              {FLOW.map((step, i) => (
                <span
                  key={step}
                  className={`text-center text-[10px] font-bold ${
                    i <= flowIndex ? 'text-brand-700' : 'text-slate-300'
                  }`}
                >
                  {titleCase(step).replace('For ', '')}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Rating Module */}
      {order.status === 'DELIVERED' && order.customerConfirmedAt && (
        <section className="card p-5 sm:p-6">
          <h2 className="font-extrabold text-slate-900 mb-3 flex items-center gap-2 text-sm uppercase tracking-wider">
            <Star className="h-4 w-4 fill-amber-400 text-amber-400" /> Rate your meal & delivery
          </h2>
          {order.rating ? (
            <div className="space-y-2 text-xs">
              <p className="flex items-center gap-2 text-slate-700 font-semibold">
                <span>Food quality:</span>
                <span className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Star key={n} className={`h-3.5 w-3.5 ${n <= (order.rating?.rating ?? 0) ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} />
                  ))}
                </span>
              </p>
              {order.rating.deliveryRating != null && (
                <p className="flex items-center gap-2 text-slate-700 font-semibold">
                  <span>Rider service:</span>
                  <span className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Star key={n} className={`h-3.5 w-3.5 ${n <= order.rating!.deliveryRating! ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} />
                    ))}
                  </span>
                </p>
              )}
              {order.rating.comment && (
                <p className="text-slate-500 italic mt-1 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  "{order.rating.comment}"
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                <StarSelect label="Food Rating" value={rating} onChange={setRating} />
                <StarSelect label="Rider Rating" value={deliveryRating} onChange={setDeliveryRating} />
              </div>
              <div>
                <label className="label" htmlFor="rating-comment">
                  Write a review (optional)
                </label>
                <textarea
                  id="rating-comment"
                  className="input min-h-[70px]"
                  placeholder="Tell us what you loved or how we can improve…"
                  value={comment}
                  maxLength={500}
                  onChange={(e) => setComment(e.target.value)}
                />
              </div>
              {error && <div className="rounded-xl bg-red-50 p-3 text-xs font-bold text-red-700">{error}</div>}
              <Button className="btn-primary text-xs" loading={ratingBusy} onClick={submitRating}>
                Submit review
              </Button>
            </div>
          )}
        </section>
      )}

      {/* 2-Column Split Details on Big Screens */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Ordered Dishes */}
        <section className="card p-5 sm:p-6 space-y-4">
          <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-2">
            Items ordered
          </h2>
          <div className="space-y-3">
            {(order.items ?? []).map((it) => (
              <div key={it.id} className="flex justify-between items-center text-xs">
                <div>
                  <p className="font-extrabold text-slate-800">{it.quantity} × {it.name}</p>
                  <p className="text-[11px] text-slate-400">{naira(it.price)} each</p>
                </div>
                <span className="font-bold text-slate-900">{naira(it.subtotal)}</span>
              </div>
            ))}
          </div>

          <div className="space-y-1.5 border-t border-slate-100 pt-3 text-xs text-slate-500">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="font-semibold text-slate-800">{naira(order.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>Delivery Fee</span>
              <span className="font-semibold text-slate-800">{naira(order.deliveryFee)}</span>
            </div>
            <div className="flex justify-between">
              <span>Service Fee (5%)</span>
              <span className="font-semibold text-slate-800">{naira(order.serviceFee)}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-slate-200 text-sm font-black text-slate-900">
              <span>Total Amount</span>
              <span className="text-brand-600">{naira(order.total)}</span>
            </div>
            <p className="text-[11px] text-slate-400 pt-1">
              Payment Method: <span className="font-bold text-slate-600">{order.paymentMethod}</span>
            </p>
          </div>
        </section>

        {/* Delivery, Payment & Timeline */}
        <div className="space-y-6">
          <PaymentTrackerCard
            payment={order.payment}
            paymentMethod={order.paymentMethod}
            total={order.total}
            orderNumber={order.orderNumber}
            onPayWithFlutterwave={() => setShowFlwModal(true)}
            isGuest={false}
          />

          <section className="card p-5 sm:p-6 space-y-2">
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-2">
              Delivery Information
            </h2>
            {order.rider?.user ? (
              <div className="text-xs text-slate-700 pt-1">
                <p className="font-bold">
                  Assigned Rider: <span className="text-brand-700">{order.rider.user.firstName} {order.rider.user.lastName}</span>
                </p>
                <p className="text-slate-400 mt-0.5">
                  Vehicle: {order.rider.vehicleType ?? 'Motorcycle'} · Rating: {order.rider.rating ?? '5.0'} ★
                </p>
              </div>
            ) : (
              <p className="text-xs text-slate-400 pt-1">
                A rider will be assigned as soon as the kitchen prepares your meal.
              </p>
            )}
          </section>

          <section className="card p-5 sm:p-6 space-y-3">
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-2">
              Timeline History
            </h2>
            <div className="space-y-3">
              {(order.statusHistory ?? []).map((h, idx) => (
                <div key={idx} className="flex gap-3 text-xs">
                  <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-brand-500 ring-2 ring-brand-100" />
                  <div>
                    <p className="font-bold text-slate-800">
                      {titleCase(h.toStatus)}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {formatDate(h.createdAt)}
                      {h.note ? <span className="text-slate-500"> · {h.note}</span> : null}
                    </p>
                  </div>
                </div>
              ))}
              {(order.statusHistory ?? []).length === 0 && (
                <p className="text-xs text-slate-400">Order placed. No further updates yet.</p>
              )}
            </div>
          </section>
        </div>
      </div>

      {showFlwModal && order && (
        <FlutterwaveModal
          isOpen={showFlwModal}
          orderId={order.id}
          orderNumber={order.orderNumber}
          amount={Number(order.total)}
          phone={
            order.deliveryAddress
              ? (() => {
                  try {
                    return JSON.parse(order.deliveryAddress).phone;
                  } catch {
                    return undefined;
                  }
                })()
              : undefined
          }
          customerName={
            order.deliveryAddress
              ? (() => {
                  try {
                    return JSON.parse(order.deliveryAddress).name;
                  } catch {
                    return undefined;
                  }
                })()
              : undefined
          }
          onClose={() => setShowFlwModal(false)}
          onSuccess={() => {
            setShowFlwModal(false);
            load();
          }}
        />
      )}
    </div>
  );
}