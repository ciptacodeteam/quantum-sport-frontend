import { create } from 'zustand';

type AuthRedirectState = {
  redirectPath: string | null;
  setRedirectPath: (path: string | null) => void;
  consumeRedirectPath: () => string | null;
};

const useAuthRedirectStore = create<AuthRedirectState>((set, get) => ({
  redirectPath: null,
  setRedirectPath: (path) => set({ redirectPath: path }),
  consumeRedirectPath: () => {
    const path = get().redirectPath;
    set({ redirectPath: null });
    return path;
  }
}));

export default useAuthRedirectStore;
