'use client';

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { SelectedBallboy } from './useBookingStore';

type BallboyCart = {
  branchId: string | null;
  items: SelectedBallboy[];
  courtBranchId: string | null;
  courtItems: SelectedBallboy[];
  setCourtItems: (branchId: string, items: SelectedBallboy[]) => void;
  clearCourtItems: () => void;
  clearStandaloneItems: () => void;
  setItems: (branchId: string, items: SelectedBallboy[]) => void;
  removeItem: (slotId: string) => void;
  clear: () => void;
};

// Public ballboy choices stay separate from admin selections and from standalone orders.
export const useBallboyCartStore = create<BallboyCart>()(
  persist(
    (set) => ({
      courtBranchId: null,
      courtItems: [],
      setCourtItems: (courtBranchId, courtItems) => set({ courtBranchId, courtItems }),
      clearCourtItems: () => set({ courtBranchId: null, courtItems: [] }),
      clearStandaloneItems: () => set({ branchId: null, items: [] }),
      branchId: null,
      items: [],
      setItems: (branchId, items) => set({ branchId, items }),
      removeItem: (slotId) =>
        set((state) => ({ items: state.items.filter((item) => item.slotId !== slotId) })),
      clear: () => set({ branchId: null, items: [], courtBranchId: null, courtItems: [] })
    }),
    { name: 'black-padel-ballboy-cart', storage: createJSONStorage(() => localStorage) }
  )
);
