import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DriverState, Ride, Expense, Fueling, Maintenance, UserSettings, AuthUser, SyncStatus } from './types';
import { supabase, isSupabaseConfigured } from './lib/supabase';

export const useDriverStore = create<DriverState>()(
  persist(
    (set, get) => ({
      user: null,
      syncStatus: 'offline',
      rides: [],
      expenses: [],
      fuelings: [],
      maintenances: [],
      settings: {
        dailyGoal: 250,
        name: 'Motorista',
        vehicle: 'Veículo Padrão',
        avgRideValue: 15,
        avgRideKm: 5,
        kmPerLiter: 10,
        fuelPrice: 5.80,
      },
      tracking: {
        isActive: false,
        distance: 0,
        avgSpeed: 0,
        duration: 0,
      },
      setUser: (user) => set({ user }),
      setSyncStatus: (syncStatus) => set({ syncStatus }),
      addRide: async (ride) => {
        const id = crypto.randomUUID();
        const newRide = { ...ride, id };
        set((state) => ({ rides: [...state.rides, newRide] }));
        
        const { user } = get();
        if (user && isSupabaseConfigured) {
          set({ syncStatus: 'syncing' });
          const { error } = await supabase.from('trips').insert({
            id,
            user_id: user.id,
            date: ride.date,
            app: ride.app,
            gross: ride.grossValue,
            tips: ride.tips,
            bonus: ride.bonus,
            hours_online: ride.onlineHours,
            km_driven: ride.kmDriven,
            passenger_paid_amount: ride.passengerPaid
          });
          set({ syncStatus: error ? 'offline' : 'synced' });
        }
      },
      deleteRide: async (id) => {
        set((state) => ({ rides: state.rides.filter(r => r.id !== id) }));
        const { user } = get();
        if (user && isSupabaseConfigured) {
          set({ syncStatus: 'syncing' });
          const { error } = await supabase.from('trips').delete().eq('id', id);
          set({ syncStatus: error ? 'offline' : 'synced' });
        }
      },
      addExpense: async (expense) => {
        const id = crypto.randomUUID();
        const newExpense = { ...expense, id };
        set((state) => ({ expenses: [...state.expenses, newExpense] }));
        const { user } = get();
        if (user && isSupabaseConfigured) {
          set({ syncStatus: 'syncing' });
          const { error } = await supabase.from('expenses').insert({
            id,
            user_id: user.id,
            date: expense.date,
            category: expense.category,
            value: expense.value,
            description: expense.description
          });
          set({ syncStatus: error ? 'offline' : 'synced' });
        }
      },
      addFueling: async (fueling) => {
        const id = crypto.randomUUID();
        const newFueling = { ...fueling, id };
        set((state) => ({ fuelings: [...state.fuelings, newFueling] }));
        const { user } = get();
        if (user && isSupabaseConfigured) {
          set({ syncStatus: 'syncing' });
          const { error } = await supabase.from('fuel_logs').insert({
            id,
            user_id: user.id,
            date: fueling.date,
            liters: fueling.liters,
            cost: fueling.value,
            odometer: fueling.odometer
          });
          set({ syncStatus: error ? 'offline' : 'synced' });
        }
      },
      addMaintenance: async (maintenance) => {
        const id = crypto.randomUUID();
        const newMaintenance = { ...maintenance, id };
        set((state) => ({ maintenances: [...state.maintenances, newMaintenance] }));
        const { user } = get();
        if (user && isSupabaseConfigured) {
          set({ syncStatus: 'syncing' });
          const { error } = await supabase.from('maintenance_logs').insert({
            id,
            user_id: user.id,
            date: maintenance.date,
            type: maintenance.type,
            cost: maintenance.value,
            odometer: maintenance.currentKm,
            next_change_km: maintenance.nextChangeKm
          });
          set({ syncStatus: error ? 'offline' : 'synced' });
        }
      },
      updateSettings: async (newSettings) => {
        set((state) => ({ settings: { ...state.settings, ...newSettings } }));
        const { user } = get();
        if (user && isSupabaseConfigured) {
          set({ syncStatus: 'syncing' });
          const { error } = await supabase.from('profiles').update({
            name: newSettings.name,
            daily_goal: newSettings.dailyGoal,
            vehicle: newSettings.vehicle,
            km_per_liter: newSettings.kmPerLiter,
            fuel_price: newSettings.fuelPrice
          }).eq('id', user.id);
          set({ syncStatus: error ? 'offline' : 'synced' });
        }
      },
      updateTracking: (newTracking) => set((state) => ({
        tracking: { ...state.tracking, ...newTracking }
      })),
      importData: (data) => set((state) => ({
        rides: data.rides ? [...state.rides, ...data.rides] : state.rides,
        expenses: data.expenses ? [...state.expenses, ...data.expenses] : state.expenses,
        fuelings: data.fuelings ? [...state.fuelings, ...data.fuelings] : state.fuelings,
        maintenances: data.maintenances ? [...state.maintenances, ...data.maintenances] : state.maintenances,
        settings: data.settings ? { ...state.settings, ...data.settings } : state.settings,
      })),
      clearData: () => set({
        rides: [],
        expenses: [],
        fuelings: [],
        maintenances: [],
        tracking: {
          isActive: false,
          distance: 0,
          avgSpeed: 0,
          duration: 0,
        },
      }),
    }),
    {
      name: 'driver-dash-storage',
      partialize: (state) => ({
        rides: state.rides,
        expenses: state.expenses,
        fuelings: state.fuelings,
        maintenances: state.maintenances,
        settings: state.settings,
      }),
    }
  )
);
