import { create } from 'zustand';
import type { FoodItem, Restaurant } from '../api/types';

export interface CartLine {
  item: FoodItem;
  restaurant: Restaurant | null;
  qty: number;
}

interface CartState {
  lines: CartLine[];
  add: (item: FoodItem, restaurant: Restaurant | null) => void;
  increment: (foodItemId: number) => void;
  decrement: (foodItemId: number) => void;
  remove: (foodItemId: number) => void;
  clear: () => void;
  itemQty: (foodItemId: number) => number;
  totalItems: () => number;
}

function load(): CartLine[] {
  try {
    const raw = localStorage.getItem('gidieats.cart');
    return raw ? (JSON.parse(raw) as CartLine[]) : [];
  } catch {
    return [];
  }
}

export const useCart = create<CartState>((set, get) => ({
  lines: load(),
  add: (item, restaurant) =>
    set((s) => {
      const existing = s.lines.find((l) => l.item.id === item.id);
      const lines = existing
        ? s.lines.map((l) => (l.item.id === item.id ? { ...l, qty: l.qty + 1, restaurant } : l))
        : [...s.lines, { item, restaurant, qty: 1 }];
      localStorage.setItem('gidieats.cart', JSON.stringify(lines));
      return { lines };
    }),
  increment: (foodItemId) =>
    set((s) => {
      const lines = s.lines.map((l) => (l.item.id === foodItemId ? { ...l, qty: l.qty + 1 } : l));
      localStorage.setItem('gidieats.cart', JSON.stringify(lines));
      return { lines };
    }),
  decrement: (foodItemId) =>
    set((s) => {
      const lines = s.lines
        .map((l) => (l.item.id === foodItemId ? { ...l, qty: l.qty - 1 } : l))
        .filter((l) => l.qty > 0);
      localStorage.setItem('gidieats.cart', JSON.stringify(lines));
      return { lines };
    }),
  remove: (foodItemId) =>
    set((s) => {
      const lines = s.lines.filter((l) => l.item.id !== foodItemId);
      localStorage.setItem('gidieats.cart', JSON.stringify(lines));
      return { lines };
    }),
  clear: () => {
    localStorage.removeItem('gidieats.cart');
    set({ lines: [] });
  },
  itemQty: (foodItemId) => get().lines.find((l) => l.item.id === foodItemId)?.qty ?? 0,
  totalItems: () => get().lines.reduce((sum, l) => sum + l.qty, 0)
}));