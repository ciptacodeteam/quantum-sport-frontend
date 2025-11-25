import type { UserProfile } from '@/types/model';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface Auth {
  isAuth: boolean;
  user: UserProfile | null;
  token: string | null;
  loading: boolean;
  setLoading: (loading: boolean) => void;
  setToken: (token: string | null) => void;
  setUser: (user: UserProfile | null) => void;
  setAuth: (auth: boolean) => void;
  logout: () => void;
  login: (token: string, user: UserProfile | null) => void;
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
        if (typeof window !== 'undefined') {
          if (token) {
            window.localStorage.setItem('token', token);
          } else {
            window.localStorage.removeItem('token');
          }
        }
        set({ token, isAuth: !!token });
      },
      setUser: (user) => set({ user }),
      setAuth: (isAuth) => set({ isAuth }),
      logout: () => {
        if (typeof window !== 'undefined') {
          window.localStorage.removeItem('token');
        }
        set({ isAuth: false, user: null, token: null });
      },
      login: (token, user) => {
        set({ isAuth: true, token, user });
      }
    }),
    {
      name: '_auth',
      storage: createJSONStorage(() => localStorage)
    }
  )
);

export default useAuthStore;
