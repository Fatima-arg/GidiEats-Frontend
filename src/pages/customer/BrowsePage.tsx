import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Clock, Flame, MapPin, Search, Sparkles, Star, Utensils, X } from 'lucide-react';
import clsx from 'clsx';
import { api, unwrap } from '../../api/client';
import type { Restaurant } from '../../api/types';
import { EmptyState, Spinner } from '../../components/ui';
import { naira } from '../../lib/format';

const CATEGORIES = [
  { id: 'all', label: 'All Treats', icon: '🍽️' },
  { id: 'nigerian', label: 'Local Dishes', icon: '🍲' },
  { id: 'grills', label: 'Grills & Suya', icon: '🥩' },
  { id: 'pizza', label: 'Pizza & Pasta', icon: '🍕' },
  { id: 'burgers', label: 'Burgers & Fries', icon: '🍔' },
  { id: 'smoothies', label: 'Drinks & Sweets', icon: '🥤' }
];

export function BrowsePage() {
  const [params] = useSearchParams();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(params.get('q') ?? '');
  const [activeCategory, setActiveCategory] = useState('all');
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (params.get('focus') === 'search') {
      searchRef.current?.focus();
    }
  }, [params]);

  useEffect(() => {
    let active = true;
    const timer = setTimeout(async () => {
      try {
        const res = await api.get('/restaurants', { params: search ? { search } : {} });
        const data = unwrap<Restaurant[]>(res as never);
        if (active) setRestaurants(Array.isArray(data) ? data : []);
      } catch {
        if (active) setRestaurants([]);
      } finally {
        if (active) setLoading(false);
      }
    }, 200);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [search]);

  const filteredRestaurants = useMemo(() => {
    if (activeCategory === 'all') return restaurants;
    return restaurants.filter((r) => {
      const cuisine = (r.cuisineType || '').toLowerCase();
      if (activeCategory === 'nigerian') return cuisine.includes('nigerian') || cuisine.includes('local');
      if (activeCategory === 'grills') return cuisine.includes('grill') || cuisine.includes('suya');
      if (activeCategory === 'pizza') return cuisine.includes('pizza') || cuisine.includes('italian');
      if (activeCategory === 'burgers') return cuisine.includes('burger') || cuisine.includes('fast');
      if (activeCategory === 'smoothies') return cuisine.includes('smoothie') || cuisine.includes('drink');
      return true;
    });
  }, [restaurants, activeCategory]);

  return (
    <div className="space-y-6">
      {/* Hero Banner Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-brand-950 to-slate-900 px-6 py-8 text-white shadow-xl sm:px-10 sm:py-12">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-amber-300 backdrop-blur-md">
            <Flame className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
            <span>BUK Campus & Kano Food Treats</span>
          </div>

          <h1 className="text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">
            Craving something delicious?
          </h1>

          <p className="text-sm text-slate-300 sm:text-base">
            From Pecancity Nigerian specialties & B-B Treats golden yam to Frenchies artisan pizza & TAYBAH Arab grills — freshly prepared near BUK New Site and across Kano, delivered in 20–35 minutes.
          </p>

          {/* Integrated Search Bar inside Hero */}
          <div className="pt-2">
            <div className="relative flex items-center rounded-2xl bg-white p-1.5 shadow-2xl">
              <Search className="pointer-events-none absolute left-4 h-5 w-5 text-slate-400" />
              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search restaurants, jollof, burgers, shawarma..."
                className="w-full rounded-xl bg-transparent py-2.5 pl-11 pr-10 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-4 p-1 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* Badges */}
          <div className="flex flex-wrap items-center gap-3 pt-1 text-xs font-semibold text-slate-300">
            <span className="flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-amber-400" /> 25–40 min express delivery
            </span>
            <span>·</span>
            <span className="flex items-center gap-1.5">
              <Utensils className="h-3.5 w-3.5 text-amber-400" /> Verified authentic kitchens
            </span>
            <span>·</span>
            <span>Card or Cash on delivery</span>
          </div>
        </div>

        {/* Ambient background decoration */}
        <div className="pointer-events-none absolute -bottom-12 -right-12 h-64 w-64 rounded-full bg-brand-600/20 blur-3xl sm:h-96 sm:w-96" />
        <div className="pointer-events-none absolute -top-12 right-1/4 h-48 w-48 rounded-full bg-amber-500/15 blur-2xl" />
      </div>

      {/* Category Quick Filter Chips */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
            Browse by category
          </h2>
          {activeCategory !== 'all' && (
            <button
              onClick={() => setActiveCategory('all')}
              className="text-xs font-bold text-brand-600 hover:underline"
            >
              Reset filter
            </button>
          )}
        </div>
        <div className="no-scrollbar -mx-4 flex gap-2.5 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
          {CATEGORIES.map((cat) => {
            const active = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className={clsx(
                  'flex shrink-0 items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-bold transition-all shadow-2xs',
                  active
                    ? 'bg-brand-600 text-white shadow-md shadow-brand-600/20 scale-[1.02]'
                    : 'bg-white text-slate-700 border border-slate-200/90 hover:bg-slate-50 hover:border-slate-300'
                )}
              >
                <span className="text-base">{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Restaurants Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-slate-900 sm:text-2xl">
              {search ? `Search results for "${search}"` : 'Popular spots near you'}
            </h2>
            <p className="text-xs font-medium text-slate-500">
              {filteredRestaurants.length} restaurant{filteredRestaurants.length === 1 ? '' : 's'} accepting orders right now
            </p>
          </div>
        </div>

        {loading && <Spinner label="Finding the best food spots in Kano & BUK…" />}

        {!loading && filteredRestaurants.length === 0 && (
          <EmptyState title="No restaurants match your selection">
            <p className="mt-1 text-xs text-slate-500">
              Try searching for something else or clearing your filters.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setActiveCategory('all');
              }}
              className="btn-secondary mt-4"
            >
              View all restaurants
            </button>
          </EmptyState>
        )}

        {/* Restaurant Cards Responsive Grid */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredRestaurants.map((r) => (
            <Link
              key={r.id}
              to={`/restaurants/${r.id}`}
              className="card-hover group flex flex-col overflow-hidden bg-white"
            >
              {/* Cover Banner */}
              <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-100">
                {r.logo || r.coverImage ? (
                  <img
                    src={r.coverImage || r.logo || undefined}
                    alt={r.name}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-tr from-brand-600 to-amber-500 text-3xl font-black text-white/90">
                    {r.name[0]}
                  </div>
                )}

                {/* Rating Badge */}
                {typeof r.rating === 'number' && (
                  <div className="absolute right-3 top-3 flex items-center gap-1 rounded-xl bg-white/95 px-2 py-1 text-xs font-extrabold text-slate-900 shadow-sm backdrop-blur-xs">
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    <span>{r.rating.toFixed(1)}</span>
                    {r.ratingCount ? (
                      <span className="text-[10px] font-normal text-slate-400">({r.ratingCount})</span>
                    ) : null}
                  </div>
                )}

                {/* Delivery Time Pill */}
                <div className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-lg bg-slate-900/80 px-2.5 py-1 text-xs font-bold text-white shadow-sm backdrop-blur-xs">
                  <Clock className="h-3 w-3 text-amber-400" />
                  <span>{r.deliveryTimeMin ?? 30} mins</span>
                </div>
              </div>

              {/* Body */}
              <div className="flex flex-1 flex-col p-4">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="truncate text-base font-extrabold text-slate-900 group-hover:text-brand-600 transition-colors">
                    {r.name}
                  </h3>
                </div>

                <p className="mt-1 flex items-center gap-1 truncate text-xs font-medium text-slate-500">
                  <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                  <span>{r.addressCity}, {r.addressState}</span>
                  {r.cuisineType ? <span>· {r.cuisineType}</span> : null}
                </p>

                <div className="mt-auto pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="font-extrabold text-brand-600">
                    {naira(r.deliveryFee)} delivery
                  </span>
                  <span className="font-semibold text-slate-400">
                    Min order: ₦1,500
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
