'use client';

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export interface BookingItem {
  slotId: string;
  courtId: string;
  courtName: string;
  timeSlot: string;
  price: number;
  date: string;
  endTime: string;
}

export interface Coach {
  id: string;
  name: string;
  image: string;
  experience: string;
  specialization: string[];
  pricePerHour: number;
  rating: number;
  availability: {
    date: string;
    timeSlots: string[];
  }[];
}

export interface Ballboy {
  id: string;
  name: string;
  image: string;
  experience: string;
  pricePerHour: number;
  rating: number;
  availability: {
    date: string;
    timeSlots: string[];
  }[];
}

export interface InventoryItem {
  id: string;
  name: string;
  image: string;
  description: string;
  pricePerHour: number;
  category: 'racket' | 'balls' | 'shoes' | 'accessories';
  quantity: number;
  availability: {
    date: string;
    timeSlots: string[];
    availableQuantity: number;
  }[];
}

export interface SelectedCoach {
  coachId: string;
  coachName: string;
  timeSlot: string;
  price: number;
  date: string;
  slotId?: string;
  coachTypeId?: string | null;
  startAt?: string;
  endAt?: string;
}

export interface SelectedBallboy {
  ballboyId: string;
  ballboyName: string;
  timeSlot: string;
  price: number;
  date: string;
  slotId?: string;
  startAt?: string;
  endAt?: string;
}

export interface SelectedInventory {
  inventoryId: string;
  inventoryName: string;
  timeSlot?: string;
  price: number;
  quantity: number;
  date?: string;
}

interface BookingState {
  // Court bookings
  bookingItems: BookingItem[];
  selectedDate: Date;
  selectedCustomerId: string;

  // Add-ons
  selectedCoaches: SelectedCoach[];
  selectedBallboys: SelectedBallboy[];
  selectedInventories: SelectedInventory[];

  // Totals
  courtTotal: number;
  coachTotal: number;
  inventoryTotal: number;

  // Cart Sheet
  isCartOpen: boolean;

  // Actions
  setBookingItems: (items: BookingItem[]) => void;
  removeBookingItem: (courtId: string, timeSlot: string, date: string) => void;
  setSelectedDate: (date: Date) => void;
  setSelectedCustomerId: (customerId: string) => void;
  addCoach: (coach: SelectedCoach) => void;
  removeCoach: (coachId: string, timeSlot: string, slotId?: string) => void;
  addBallboy: (ballboy: SelectedBallboy) => void;
  removeBallboy: (ballboyId: string, timeSlot: string, slotId?: string) => void;
  addInventory: (inventory: SelectedInventory) => void;
  removeInventory: (inventoryId: string, timeSlot?: string) => void;
  updateInventoryQuantity: (inventoryId: string, timeSlot: string, quantity: number) => void;
  clearAll: () => void;
  getTotalAmount: () => number;
  getTotalWithTax: () => number;
  getTax: () => number;
  setCartOpen: (open: boolean) => void;
}

export const useBookingStore = create<BookingState>()(
  persist(
    (set, get) => ({
      bookingItems: [],
      selectedDate: new Date(),
      selectedCustomerId: '',
      selectedCoaches: [],
      selectedBallboys: [],
      selectedInventories: [],
      courtTotal: 0,
      coachTotal: 0,
      inventoryTotal: 0,
      isCartOpen: false,

      // Actions
      setBookingItems: (items) => {
        const courtTotal = items.reduce((sum, item) => sum + item.price, 0);
        set({ bookingItems: items, courtTotal });
      },

      removeBookingItem: (courtId, timeSlot, date) => {
        const state = get();
        const newItems = state.bookingItems.filter(
          (item) => !(item.courtId === courtId && item.timeSlot === timeSlot && item.date === date)
        );
        const courtTotal = newItems.reduce((sum, item) => sum + item.price, 0);
        set({ bookingItems: newItems, courtTotal });
      },

      setSelectedDate: (date) => set({ selectedDate: date }),

      setSelectedCustomerId: (customerId) => set({ selectedCustomerId: customerId }),

      addCoach: (coach) => {
        const state = get();
        const exists = state.selectedCoaches.find((c) => {
          if (coach.slotId) {
            return c.slotId === coach.slotId;
          }

          return (
            c.coachId === coach.coachId && c.timeSlot === coach.timeSlot && c.date === coach.date
          );
        });

        if (!exists) {
          const newCoaches = [...state.selectedCoaches, coach];
          const coachTotal = newCoaches.reduce((sum, c) => sum + c.price, 0);
          set({ selectedCoaches: newCoaches, coachTotal });
        }
      },

      removeCoach: (coachId, timeSlot, slotId) => {
        const state = get();
        const newCoaches = state.selectedCoaches.filter((c) => {
          if (slotId) {
            return c.slotId !== slotId;
          }

          return !(c.coachId === coachId && c.timeSlot === timeSlot);
        });
        const coachTotal = newCoaches.reduce((sum, c) => sum + c.price, 0);
        set({ selectedCoaches: newCoaches, coachTotal });
      },

      addBallboy: (ballboy) => {
        const state = get();
        const exists = state.selectedBallboys.find((b) => {
          if (ballboy.slotId) {
            return b.slotId === ballboy.slotId;
          }

          return (
            b.ballboyId === ballboy.ballboyId &&
            b.timeSlot === ballboy.timeSlot &&
            b.date === ballboy.date
          );
        });

        if (!exists) {
          const newBallboys = [...state.selectedBallboys, ballboy];
          const coachTotal = newBallboys.reduce((sum, b) => sum + b.price, 0);
          set({ selectedBallboys: newBallboys, coachTotal });
        }
      },

      removeBallboy: (ballboyId, timeSlot, slotId) => {
        const state = get();
        const newBallboys = state.selectedBallboys.filter((b) => {
          if (slotId) {
            return b.slotId !== slotId;
          }

          return !(b.ballboyId === ballboyId && b.timeSlot === timeSlot);
        });
        const coachTotal = newBallboys.reduce((sum, b) => sum + b.price, 0);
        set({ selectedBallboys: newBallboys, coachTotal });
      },

      addInventory: (inventory) => {
        const state = get();
        const keyTimeSlot = inventory.timeSlot ?? 'default';
        const existingIndex = state.selectedInventories.findIndex(
          (i) =>
            i.inventoryId === inventory.inventoryId && (i.timeSlot ?? 'default') === keyTimeSlot
        );

        let newInventories;
        if (existingIndex >= 0) {
          newInventories = [...state.selectedInventories];
          newInventories[existingIndex] = {
            ...newInventories[existingIndex],
            ...inventory,
            timeSlot: keyTimeSlot
          };
        } else {
          newInventories = [
            ...state.selectedInventories,
            {
              ...inventory,
              timeSlot: keyTimeSlot
            }
          ];
        }

        const inventoryTotal = newInventories.reduce((sum, i) => sum + i.price, 0);
        set({ selectedInventories: newInventories, inventoryTotal });
      },

      removeInventory: (inventoryId, timeSlot = 'default') => {
        const state = get();
        const newInventories = state.selectedInventories.filter(
          (i) => !(i.inventoryId === inventoryId && (i.timeSlot ?? 'default') === timeSlot)
        );
        const inventoryTotal = newInventories.reduce((sum, i) => sum + i.price, 0);
        set({ selectedInventories: newInventories, inventoryTotal });
      },

      updateInventoryQuantity: (inventoryId, timeSlot = 'default', quantity) => {
        const state = get();
        const newInventories = state.selectedInventories.map((i) => {
          if (
            i.inventoryId === inventoryId &&
            (i.timeSlot ?? 'default') === (timeSlot ?? 'default')
          ) {
            const unitPrice = i.quantity > 0 ? i.price / i.quantity : 0;
            return { ...i, quantity, price: unitPrice * quantity };
          }
          return i;
        });
        const inventoryTotal = newInventories.reduce((sum, i) => sum + i.price, 0);
        set({ selectedInventories: newInventories, inventoryTotal });
      },

      clearAll: () => set({
        bookingItems: [],
        selectedCoaches: [],
        selectedInventories: [],
        selectedCustomerId: '',
        courtTotal: 0,
        coachTotal: 0,
        inventoryTotal: 0,
      }),

      getTotalAmount: () => {
        const state = get();
        return state.courtTotal + state.coachTotal + state.inventoryTotal;
      },

      getTotalWithTax: () => {
        const state = get();
        const total = state.courtTotal + state.coachTotal + state.inventoryTotal;
        return total * 1.1; // 10% tax
      },

      getTax: () => {
        const state = get();
        const total = state.courtTotal + state.coachTotal + state.inventoryTotal;
        return total * 0.1; // 10% tax
      },

      setCartOpen: (open) => set({ isCartOpen: open })
    }),
    {
      name: 'booking-storage',
      storage: typeof window !== 'undefined' ? createJSONStorage(() => sessionStorage) : undefined,
      partialize: (state) => ({
        bookingItems: state.bookingItems,
        selectedDate: state.selectedDate,
        selectedCustomerId: state.selectedCustomerId,
        selectedCoaches: state.selectedCoaches,
        selectedInventories: state.selectedInventories,
        courtTotal: state.courtTotal,
        coachTotal: state.coachTotal,
        inventoryTotal: state.inventoryTotal
      })
    }
  )
);
