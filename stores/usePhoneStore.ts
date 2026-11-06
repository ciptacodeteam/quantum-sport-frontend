import { create } from 'zustand';

interface Phone {
  phone: string | null;
  requestId: string | null;
  resetToken: string | null;
  registrationToken: string | null;
  setRegistrationToken: (token: string | null) => void;
  registrationMode: 'register' | 'activate';
  setRegistrationMode: (mode: 'register' | 'activate') => void;

  setPhone: (phone: string | null) => void;
  setRequestId: (requestId: string | null) => void;
  setResetToken: (resetToken: string | null) => void;
}

export const usePhoneStore = create<Phone>((set) => ({
  registrationMode: 'register',
  setRegistrationMode: (registrationMode) => set({ registrationMode }),
  phone: null,
  requestId: null,
  resetToken: null,
  registrationToken: null,
  setRegistrationToken: (registrationToken) => set({ registrationToken }),
  setPhone: (phone: string | null) =>
    set({
      phone,
      resetToken: null,
      registrationToken: null,
      ...(phone ? {} : { registrationMode: 'register' as const })
    }),
  setRequestId: (requestId: string | null) =>
    set({ requestId, resetToken: null, registrationToken: null }),
  setResetToken: (resetToken: string | null) => set({ resetToken })
}));
