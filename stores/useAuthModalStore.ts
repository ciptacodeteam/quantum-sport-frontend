import { create } from 'zustand';

type AuthModalState = {
  isOpen: boolean;
  setOpen: (open: boolean) => void;
  open: () => void;
  close: () => void;
};

export const useAuthModalStore = create<AuthModalState>((set) => ({
  isOpen: false,
  setOpen: (open) => set({ isOpen: open }),
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false })
}));

export default useAuthModalStore;
