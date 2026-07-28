import type { UserProfile } from '@/types/model';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface Auth {
  isAuth: boolean;
  user: UserProfile | null;
  /** In-memory only; access JWT is stored in httpOnly cookies (not localStorage). */
  token: string | null;
  loading: boolean;
  setLoading: (loading: boolean) => void;
  setToken: (token: string | null) => void;
  setUser: (user: UserProfile | null) => void;
  setAuth: (auth: boolean) => void;
  logout: () => void;
  login: (token: string | null, user: UserProfile | null) => void;
}

function clearLegacyTokenStorage() {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem('token');
  } catch {
    // ignore
  }
}

const useAuthStore = create<Auth>()(
  persist(
    (set) => ({
      isAuth: false,
      user: null,
      token: null,
      loading: false,
      setLoading: (loading) => set({ loading }),
      setToken: (token) => {
        clearLegacyTokenStorage();
        set({ token, isAuth: !!token });
      },
      setUser: (user) => set({ user }),
      setAuth: (isAuth) => set({ isAuth }),
      logout: () => {
        clearLegacyTokenStorage();
        set({ isAuth: false, user: null, token: null });
      },
      login: (token, user) => {
        clearLegacyTokenStorage();
        set({ isAuth: true, token: token ?? null, user });
      }
    }),
    {
      name: '_auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        isAuth: state.isAuth,
        user: state.user
      }),
      onRehydrateStorage: () => () => {
        clearLegacyTokenStorage();
      }
    }
  )
);

export default useAuthStore;
