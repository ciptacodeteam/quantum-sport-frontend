import { create } from 'zustand';
type RegisterStore = {
  name: string;
  phone: string;
  password: string;
  registerData: Partial<RegisterStore> | null;
  setRegisterData: (data: Partial<RegisterStore>) => void;
  setName: (name: string) => void;
  setPhone: (phone: string) => void;
  setPassword: (password: string) => void;
  clear: () => void;
};

export const useRegisterStore = create<RegisterStore>((set) => ({
  name: '',
  phone: '',
  password: '',
  registerData: null,
  setRegisterData: (data: Partial<RegisterStore>) => set({ ...data, registerData: data }),
  setName: (name: string) => set({ name }),
  setPhone: (phone: string) => set({ phone }),
  setPassword: (password: string) => set({ password }),
  clear: () =>
    set({
      name: '',
      phone: '',
      password: '',
      registerData: null
    })
}));
