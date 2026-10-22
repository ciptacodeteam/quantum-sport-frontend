import { create } from 'zustand';

type AuthModalState = {
  isOpen: boolean;
  view: 'login' | 'register';
  setOpen: (open: boolean) => void;
  open: () => void;
  openRegister: () => void;
  close: () => void;
};

export const useAuthModalStore = create<AuthModalState>((set) => ({
  isOpen: false,
  view: 'login',
  setOpen: (open) => set(open ? { isOpen: true } : { isOpen: false, view: 'login' }),
  open: () => set({ isOpen: true, view: 'login' }),
  openRegister: () => set({ isOpen: true, view: 'register' }),
  close: () => set({ isOpen: false, view: 'login' })
}));

export default useAuthModalStore;
