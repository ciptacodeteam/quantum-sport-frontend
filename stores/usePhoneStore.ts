import { create } from 'zustand';

interface Phone {
  phone: string | null;
  requestId: string | null;

  setPhone: (phone: string | null) => void;
  setRequestId: (requestId: string | null) => void;
}

export const usePhoneStore = create<Phone>((set) => ({
  phone: null,
  requestId: null,
  setPhone: (phone: string | null) => set({ phone }),
  setRequestId: (requestId: string | null) => set({ requestId })
}));
