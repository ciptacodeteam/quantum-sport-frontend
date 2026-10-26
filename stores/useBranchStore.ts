'use client';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { Branch } from '@/types/branch';

type BranchState = {
  branch: Branch | null;
  adminBranchId: string | null;
  selectorOpen: boolean;
  openSelector: () => void;
  closeSelector: () => void;
  setBranch: (branch: Branch) => void;
  setAdminBranchId: (id: string | null) => void;
};
export const useBranchStore = create<BranchState>()(
  persist(
    (set) => ({
      branch: null,
      adminBranchId: null,
      selectorOpen: false,
      openSelector: () => set({ selectorOpen: true }),
      closeSelector: () => set({ selectorOpen: false }),
      setBranch: (branch) => set({ branch, selectorOpen: false }),
      setAdminBranchId: (adminBranchId) => set({ adminBranchId })
    }),
    {
      name: 'black-padel-branches',
      storage: createJSONStorage(() => localStorage),
      partialize: ({ branch, adminBranchId }) => ({ branch, adminBranchId })
    }
  )
);
