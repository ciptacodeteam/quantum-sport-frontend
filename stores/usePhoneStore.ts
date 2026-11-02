import { create } from 'zustand';

interface Phone {
  phone: string | null;
  requestId: string | null;
  resetToken: string | null;

  setPhone: (phone: string | null) => void;
  setRequestId: (requestId: string | null) => void;
  setResetToken: (resetToken: string | null) => void;
}

export const usePhoneStore = create<Phone>((set) => ({
  phone: null,
  requestId: null,
  resetToken: null,
  setPhone: (phone: string | null) => set({ phone, resetToken: null }),
  setRequestId: (requestId: string | null) => set({ requestId, resetToken: null }),
  setResetToken: (resetToken: string | null) => set({ resetToken })
}));
