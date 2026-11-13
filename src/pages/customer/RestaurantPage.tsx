import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Clock, MapPin, Minus, Plus, ShoppingBag, Star, Trash2, Utensils, UtensilsCrossed } from 'lucide-react';
import { api, resolveImageUrl, unwrap } from '../../api/client';
import type { Category, Restaurant } from '../../api/types';
import { EmptyState, Spinner } from '../../components/ui';
import { useCart } from '../../store/cart';
import { naira } from '../../lib/format';

export function RestaurantPage() {
  const { id } = useParams();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const { lines, add, increment, decrement, remove, clear, itemQty, totalItems } = useCart();

  const cartRestaurant = lines[0]?.restaurant ?? null;
  const isDifferentRestaurantInCart = cartRestaurant && restaurant && cartRestaurant.id !== restaurant.id;

  const subtotal = useMemo(
    () => lines.reduce((sum, l) => sum + Number(l.item.price) * l.qty, 0),
    [lines]
  );
  const deliveryFee = Number(restaurant?.deliveryFee ?? cartRestaurant?.deliveryFee ?? 0);
  const serviceFee = Math.round(subtotal * 0.05 * 100) / 100;
  const grandTotal = subtotal + (lines.length > 0 ? deliveryFee + serviceFee : 0);

  useEffect(() => {
    let active = true;
    api
      .get(`/restaurants/${id}/menu`)
      .then((res) => {
        const data = unwrap<{ restaurant: Restaurant; categories: Category[] }>(res as never);
        if (active) {
          setRestaurant(data.restaurant);
          setCategories(data.categories);
        }
      })
      .catch(() => undefined)
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [id]);

  if (loading) return <Spinner label="Loading menu & delicious treats…" />;
  if (!restaurant) return <EmptyState title="Restaurant not found" />;

  const cover = restaurant.coverImage || restaurant.logo;

  const handleAddItem = (item: (typeof categories)[0]['foodItems'][0]) => {
    if (isDifferentRestaurantInCart) {
      if (window.confirm(`Your basket already has items from ${cartRestaurant.name}. Clear your basket and start an order from ${restaurant.name}?`)) {
        clear();
        add(item, restaurant);
      }
      return;
    }
    add(item, restaurant);
  };

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-brand-600 transition"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Restaurants
      </Link>

      {/* Restaurant Header Banner Card */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-soft">
        <div className="relative h-44 w-full bg-slate-900 sm:h-56 lg:h-64 overflow-hidden">
          {cover ? (
            <img src={resolveImageUrl(cover)} alt={restaurant.name} className="h-full w-full object-cover opacity-90" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-tr from-brand-700 to-amber-600 text-5xl font-black text-white/40">
              {restaurant.name[0]}
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />

          {/* Overlaid Badges */}
          <div className="absolute top-4 right-4 flex items-center gap-2">
            {typeof restaurant.rating === 'number' && (
              <span className="flex items-center gap-1 rounded-xl bg-white/95 px-3 py-1.5 text-xs font-extrabold text-slate-900 shadow-md backdrop-blur-xs">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                {restaurant.rating.toFixed(1)}
                {restaurant.ratingCount ? (
                  <span className="text-slate-400 font-semibold text-[11px]">({restaurant.ratingCount})</span>
                ) : null}
              </span>
            )}
          </div>
        </div>

        {/* Info Content */}
        <div className="relative -mt-10 px-5 pb-6 sm:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="flex items-end gap-4">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border-4 border-white bg-white shadow-md overflow-hidden sm:h-24 sm:w-24">
                {restaurant.logo ? (
                  <img src={resolveImageUrl(restaurant.logo)} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-brand-600 text-2xl font-black text-white">
                    {restaurant.name[0]}
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
                  {restaurant.name}
                </h1>
                <p className="mt-0.5 flex items-center gap-1 text-xs font-medium text-slate-500">
                  <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  <span>{restaurant.addressStreet}, {restaurant.addressCity}, {restaurant.addressState}</span>
                </p>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="flex flex-wrap items-center gap-2 pt-2 sm:pt-0">
              <span className="flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700">
                <Clock className="h-3.5 w-3.5 text-brand-600" />
                {restaurant.deliveryTimeMin ?? 30} mins
              </span>
              <span className="rounded-xl bg-brand-50 px-3 py-1.5 text-xs font-extrabold text-brand-700">
                {naira(restaurant.deliveryFee)} Delivery
              </span>
              {restaurant.cuisineType && (
                <span className="rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600">
                  {restaurant.cuisineType}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Category Bar */}
      {categories.length > 0 && (
        <div className="sticky top-16 z-20 -mx-4 border-y border-slate-200/80 bg-white/95 px-4 py-2.5 backdrop-blur-md sm:mx-0 sm:rounded-2xl sm:border">
          <div className="no-scrollbar flex items-center gap-2 overflow-x-auto">
            {categories.map((cat) => (
              <a
                key={cat.id}
                href={`#cat-${cat.id}`}
                className="shrink-0 rounded-xl px-3.5 py-1.5 text-xs font-bold text-slate-700 transition hover:bg-brand-50 hover:text-brand-700 active:scale-95"
              >
                {cat.name} ({cat.foodItems.length})
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Main Grid: Menu Dishes (Left) + Sticky Basket Sidebar (Right on desktop) */}
      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,1fr)_360px] xl:grid-cols-[minmax(0,1fr)_380px]">
        {/* Menu Sections */}
        <div className="space-y-8">
          {categories.length === 0 && (
            <EmptyState title="No menu available yet">
              Check back soon or explore other restaurants in Kano & BUK.
            </EmptyState>
          )}

          {categories.map((cat) => (
            <section key={cat.id} id={`cat-${cat.id}`} className="scroll-mt-32 space-y-3">
              <div className="flex items-center gap-2 border-b border-slate-200/80 pb-2">
                <h2 className="text-lg font-black text-slate-900 sm:text-xl">{cat.name}</h2>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-500">
                  {cat.foodItems.length}
                </span>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {cat.foodItems.map((item) => {
                  const qty = itemQty(item.id);
                  return (
                    <div
                      key={item.id}
                      className="card-hover group flex flex-col justify-between overflow-hidden bg-white p-4"
                    >
                      <div className="flex gap-3">
                        <div className="min-w-0 flex-1">
                          <h3 className="text-sm font-extrabold text-slate-900 group-hover:text-brand-600 transition-colors">
                            {item.name}
                          </h3>
                          <p className="mt-1 font-black text-brand-600 text-sm">
                            {naira(item.price)}
                          </p>
                          {item.description && (
                            <p className="mt-1 line-clamp-2 text-xs text-slate-400">
                              {item.description}
                            </p>
                          )}
                        </div>

                        {/* Dish Image */}
                        {item.image ? (
                          <img
                            src={resolveImageUrl(item.image)}
                            alt=""
                            className="h-20 w-20 shrink-0 rounded-2xl object-cover bg-slate-100 shadow-2xs"
                          />
                        ) : (
                          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 shadow-2xs">
                            <UtensilsCrossed className="h-6 w-6" />
                          </div>
                        )}
                      </div>

                      {/* Footer: Prep time & Add Button */}
                      <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-100">
                        <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {item.preparationTimeMin ?? '20'} mins
                        </span>

                        {item.isAvailable ? (
                          qty > 0 ? (
                            <div className="flex items-center gap-1.5 rounded-xl bg-brand-50 p-1 border border-brand-200">
                              <button
                                type="button"
                                onClick={() => decrement(item.id)}
                                className="flex h-6 w-6 items-center justify-center rounded-lg bg-white text-slate-700 shadow-2xs hover:bg-slate-100 active:scale-95"
                              >
                                <Minus className="h-3 w-3" />
                              </button>
                              <span className="w-5 text-center text-xs font-black text-brand-900">
                                {qty}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleAddItem(item)}
                                className="flex h-6 w-6 items-center justify-center rounded-lg bg-brand-600 text-white shadow-2xs hover:bg-brand-700 active:scale-95"
                              >
                                <Plus className="h-3 w-3" />
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleAddItem(item)}
                              className="inline-flex items-center gap-1 rounded-xl bg-brand-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-brand-700 active:scale-95 transition"
                            >
                              <Plus className="h-3.5 w-3.5" />
                              <span>Add</span>
                            </button>
                          )
                        ) : (
                          <span className="text-xs font-semibold text-slate-300">Sold out</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>

        {/* Sticky Desktop Basket Sidebar */}
        <aside className="sticky top-24 hidden lg:block rounded-3xl border border-slate-200/80 bg-white p-5 shadow-soft">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-brand-600" />
              <h3 className="font-black text-slate-900">Your Basket</h3>
            </div>
            {lines.length > 0 && (
              <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-bold text-brand-700">
                {totalItems()} item{totalItems() === 1 ? '' : 's'}
              </span>
            )}
          </div>

          {/* Different restaurant warning */}
          {isDifferentRestaurantInCart && (
            <div className="mt-3 rounded-2xl bg-amber-50 p-3 text-xs text-amber-800 border border-amber-200">
              <p className="font-bold">Basket from {cartRestaurant?.name}</p>
              <p className="mt-0.5 text-amber-700">
                You can only order from one restaurant at a time.
              </p>
              <button
                type="button"
                onClick={clear}
                className="mt-2 text-xs font-bold text-red-600 hover:underline"
              >
                Clear basket & order here
              </button>
            </div>
          )}

          {/* Lines */}
          <div className="my-4 max-h-[360px] space-y-3 overflow-y-auto no-scrollbar">
            {lines.length === 0 ? (
              <div className="py-10 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 text-slate-400 mb-2">
                  <Utensils className="h-6 w-6 stroke-[1.5]" />
                </div>
                <p className="text-xs font-bold text-slate-700">Your basket is empty</p>
                <p className="mt-1 text-[11px] text-slate-400">
                  Select delicious items from the menu to build your order.
                </p>
              </div>
            ) : (
              lines.map((l) => (
                <div
                  key={l.item.id}
                  className="flex items-center justify-between gap-2 rounded-xl border border-slate-100 p-2 hover:border-slate-200 transition"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-bold text-slate-800">{l.item.name}</p>
                    <p className="text-[11px] font-extrabold text-brand-600">
                      {naira(Number(l.item.price) * l.qty)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 rounded-lg bg-slate-50 p-0.5 border border-slate-200/60">
                    <button
                      type="button"
                      onClick={() => decrement(l.item.id)}
                      className="flex h-5 w-5 items-center justify-center rounded text-slate-600 hover:bg-white"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="w-4 text-center text-xs font-bold text-slate-800">{l.qty}</span>
                    <button
                      type="button"
                      onClick={() => increment(l.item.id)}
                      className="flex h-5 w-5 items-center justify-center rounded text-slate-600 hover:bg-white"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => remove(l.item.id)}
                    className="p-1 text-slate-300 hover:text-red-500 rounded"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Pricing calculations & checkout */}
          {lines.length > 0 && (
            <div className="space-y-2 border-t border-slate-100 pt-3 text-xs">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal</span>
                <span className="font-bold text-slate-800">{naira(subtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Delivery Fee</span>
                <span className="font-bold text-slate-800">{naira(deliveryFee)}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Service Fee (5%)</span>
                <span className="font-bold text-slate-800">{naira(serviceFee)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-dashed border-slate-200 text-sm font-black text-slate-900">
                <span>Total</span>
                <span className="text-brand-600">{naira(grandTotal)}</span>
              </div>

              <div className="pt-3">
                <Link
                  to="/checkout"
                  className="btn-primary w-full py-3 text-sm flex items-center justify-center gap-2 shadow-md shadow-brand-500/20"
                >
                  <span>Checkout · {naira(grandTotal)}</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
