'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface BookingItem {
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
}

export interface SelectedInventory {
  inventoryId: string;
  inventoryName: string;
  timeSlot: string;
  price: number;
  quantity: number;
  date: string;
}

interface BookingState {
  // Court bookings
  bookingItems: BookingItem[];
  selectedDate: Date;
  
  // Add-ons
  selectedCoaches: SelectedCoach[];
  selectedInventories: SelectedInventory[];
  
  // Totals
  courtTotal: number;
  coachTotal: number;
  inventoryTotal: number;
  
  // Actions
  setBookingItems: (items: BookingItem[]) => void;
  setSelectedDate: (date: Date) => void;
  addCoach: (coach: SelectedCoach) => void;
  removeCoach: (coachId: string, timeSlot: string) => void;
  addInventory: (inventory: SelectedInventory) => void;
  removeInventory: (inventoryId: string, timeSlot: string) => void;
  updateInventoryQuantity: (inventoryId: string, timeSlot: string, quantity: number) => void;
  clearAll: () => void;
  getTotalAmount: () => number;
  getTotalWithTax: () => number;
  getTax: () => number;
}

export const useBookingStore = create<BookingState>()(
  persist(
    (set, get) => ({
      bookingItems: [],
      selectedDate: new Date(),
      selectedCoaches: [],
      selectedInventories: [],
      courtTotal: 0,
      coachTotal: 0,
      inventoryTotal: 0,

      // Actions
      setBookingItems: (items) => {
        const courtTotal = items.reduce((sum, item) => sum + item.price, 0);
        set({ bookingItems: items, courtTotal });
      },

      setSelectedDate: (date) => set({ selectedDate: date }),

      addCoach: (coach) => {
        const state = get();
        const exists = state.selectedCoaches.find(
          c => c.coachId === coach.coachId && c.timeSlot === coach.timeSlot
        );
        
        if (!exists) {
          const newCoaches = [...state.selectedCoaches, coach];
          const coachTotal = newCoaches.reduce((sum, c) => sum + c.price, 0);
          set({ selectedCoaches: newCoaches, coachTotal });
        }
      },

      removeCoach: (coachId, timeSlot) => {
        const state = get();
        const newCoaches = state.selectedCoaches.filter(
          c => !(c.coachId === coachId && c.timeSlot === timeSlot)
        );
        const coachTotal = newCoaches.reduce((sum, c) => sum + c.price, 0);
        set({ selectedCoaches: newCoaches, coachTotal });
      },

      addInventory: (inventory) => {
        const state = get();
        const existingIndex = state.selectedInventories.findIndex(
          i => i.inventoryId === inventory.inventoryId && i.timeSlot === inventory.timeSlot
        );
        
        let newInventories;
        if (existingIndex >= 0) {
          // Update existing inventory
          newInventories = [...state.selectedInventories];
          newInventories[existingIndex] = {
            ...newInventories[existingIndex],
            quantity: inventory.quantity,
            price: inventory.price
          };
        } else {
          // Add new inventory
          newInventories = [...state.selectedInventories, inventory];
        }
        
        const inventoryTotal = newInventories.reduce((sum, i) => sum + i.price, 0);
        set({ selectedInventories: newInventories, inventoryTotal });
      },

      removeInventory: (inventoryId, timeSlot) => {
        const state = get();
        const newInventories = state.selectedInventories.filter(
          i => !(i.inventoryId === inventoryId && i.timeSlot === timeSlot)
        );
        const inventoryTotal = newInventories.reduce((sum, i) => sum + i.price, 0);
        set({ selectedInventories: newInventories, inventoryTotal });
      },

      updateInventoryQuantity: (inventoryId, timeSlot, quantity) => {
        const state = get();
        const newInventories = state.selectedInventories.map(i => {
          if (i.inventoryId === inventoryId && i.timeSlot === timeSlot) {
            return { ...i, quantity, price: (i.price / i.quantity) * quantity };
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
    }),
    {
      name: 'booking-storage',
      partialize: (state) => ({
        bookingItems: state.bookingItems,
        selectedDate: state.selectedDate,
        selectedCoaches: state.selectedCoaches,
        selectedInventories: state.selectedInventories,
        courtTotal: state.courtTotal,
        coachTotal: state.coachTotal,
        inventoryTotal: state.inventoryTotal,
      }),
    }
  )
);