import { create } from 'zustand';
import type { User } from '../api/types';
import { loadAuth, clearAuth, saveAuth, type StoredAuth } from './storage';

interface AuthState {
  token: string | null;
  user: User | null;
  bootstrapped: boolean;
  setAuth: (auth: StoredAuth) => void;
  setUser: (user: User) => void;
  logout: () => void;
}

const stored = loadAuth();

export const useAuth = create<AuthState>((set) => ({
  token: stored?.token ?? null,
  user: stored?.user ?? null,
  bootstrapped: !!stored,
  setAuth: (auth) => {
    saveAuth(auth);
    set({ token: auth.token, user: auth.user, bootstrapped: true });
  },
  setUser: (user) => set({ user }),
  logout: () => {
    clearAuth();
    set({ token: null, user: null, bootstrapped: true });
  }
}));