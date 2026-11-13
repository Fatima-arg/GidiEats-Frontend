import { Link } from 'react-router-dom';
import { ArrowRight, Minus, Plus, ShoppingBag, Trash2, Utensils, X } from 'lucide-react';
import { resolveImageUrl } from '../api/client';
import { useCart } from '../store/cart';
import { naira } from '../lib/format';

export function CartDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { lines, increment, decrement, remove, clear, totalItems } = useCart();
  const restaurant = lines[0]?.restaurant ?? null;
  const subtotal = lines.reduce((sum, l) => sum + Number(l.item.price) * l.qty, 0);
  const deliveryFee = Number(restaurant?.deliveryFee ?? 0);
  const serviceFee = Math.round(subtotal * 0.05 * 100) / 100;
  const total = subtotal + (lines.length > 0 ? deliveryFee + serviceFee : 0);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity"
        aria-label="Close cart"
        onClick={onClose}
      />
      <aside className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-white shadow-2xl transition-transform">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
              <ShoppingBag className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900">Your Basket</h3>
              {restaurant && (
                <p className="text-xs font-medium text-slate-500 truncate max-w-[200px]">
                  From {restaurant.name}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {lines.length > 0 && (
              <button
                type="button"
                onClick={clear}
                className="text-xs font-semibold text-slate-400 hover:text-red-600 px-2 py-1"
              >
                Clear
              </button>
            )}
            <button
              type="button"
              className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              onClick={onClose}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Items List */}
        <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
          {lines.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-400 mb-3">
                <ShoppingBag className="h-8 w-8 stroke-[1.5]" />
              </div>
              <h4 className="font-bold text-slate-800">Your basket is empty</h4>
              <p className="mt-1 max-w-xs text-xs text-slate-400">
                Explore delicious meals from top restaurants in Kano and near BUK New Site and add them to your order.
              </p>
            </div>
          ) : (
            lines.map((l) => (
              <div
                key={l.item.id}
                className="flex items-center gap-3 rounded-2xl border border-slate-100 p-2.5 hover:border-slate-200 transition"
              >
                {l.item.image ? (
                  <img
                    src={resolveImageUrl(l.item.image)}
                    alt=""
                    className="h-16 w-16 shrink-0 rounded-xl object-cover bg-slate-100"
                    onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                  />
                ) : (
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                    <Utensils className="h-6 w-6" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-slate-800">{l.item.name}</p>
                  <p className="text-xs font-semibold text-brand-600 mt-0.5">
                    {naira(Number(l.item.price) * l.qty)}
                  </p>
                  <p className="text-[11px] text-slate-400">{naira(l.item.price)} each</p>
                </div>
                <div className="flex items-center gap-1 rounded-xl bg-slate-50 p-1 border border-slate-200/60">
                  <button
                    type="button"
                    className="flex h-6 w-6 items-center justify-center rounded-lg text-slate-600 hover:bg-white hover:shadow-xs active:scale-95"
                    onClick={() => decrement(l.item.id)}
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <span className="w-5 text-center text-xs font-bold text-slate-800">{l.qty}</span>
                  <button
                    type="button"
                    className="flex h-6 w-6 items-center justify-center rounded-lg text-slate-600 hover:bg-white hover:shadow-xs active:scale-95"
                    onClick={() => increment(l.item.id)}
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
                <button
                  type="button"
                  className="p-1.5 text-slate-300 hover:text-red-500 rounded-lg"
                  onClick={() => remove(l.item.id)}
                  title="Remove item"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer Summary */}
        {lines.length > 0 && (
          <div className="border-t border-slate-100 bg-slate-50/50 px-5 py-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] space-y-3">
            <div className="space-y-1.5 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Subtotal ({totalItems()} items)</span>
                <span className="font-semibold text-slate-800">{naira(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Estimated Delivery</span>
                <span className="font-semibold text-slate-800">{naira(deliveryFee)}</span>
              </div>
              <div className="flex justify-between">
                <span>Service Fee (5%)</span>
                <span className="font-semibold text-slate-800">{naira(serviceFee)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-200/80 text-sm font-extrabold text-slate-900">
                <span>Total Amount</span>
                <span className="text-brand-600">{naira(total)}</span>
              </div>
            </div>

            <Link
              to="/checkout"
              onClick={onClose}
              className="btn-primary w-full py-3 text-sm flex items-center justify-center gap-2 shadow-md shadow-brand-500/20"
            >
              <span>Go to Checkout</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}
      </aside>
    </div>
  );
}

export function CartBar({ onOpen }: { onOpen: () => void }) {
  const { lines, totalItems } = useCart();
  const subtotal = lines.reduce((sum, l) => sum + Number(l.item.price) * l.qty, 0);
  if (!lines.length) return null;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 z-25 px-4 md:hidden transition-all duration-300"
      style={{ bottom: 'calc(4.2rem + env(safe-area-inset-bottom))' }}
    >
      <button
        type="button"
        onClick={onOpen}
        className="pointer-events-auto mx-auto flex w-full max-w-md items-center justify-between rounded-2xl bg-gradient-to-r from-brand-600 to-amber-600 px-4 py-3 text-white shadow-xl shadow-brand-600/30 active:scale-[0.99] transition"
      >
        <div className="flex items-center gap-2.5">
          <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-white/20 px-1.5 text-xs font-black backdrop-blur-xs">
            {totalItems()}
          </span>
          <span className="text-sm font-bold">View Basket</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-extrabold">{naira(subtotal)}</span>
          <ArrowRight className="h-4 w-4" />
        </div>
      </button>
    </div>
  );
}
