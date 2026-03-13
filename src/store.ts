import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DriverState, Ride, Expense, Fueling, Maintenance, UserSettings, AuthUser, SyncStatus, WorkLog, FaturamentoLog } from './types';
import { supabase, isSupabaseConfigured } from './lib/supabase';

export const useDriverStore = create<DriverState>()(
  persist(
    (set, get) => ({
      user: null,
      syncStatus: 'offline',
      rides: [],
      workLogs: [],
      faturamentoLogs: [],
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
        activePlatforms: ['uber_car'],
        transportMode: 'car',
        dashboardMode: 'merged',
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
      addWorkLog: async (log) => {
        const id = crypto.randomUUID();
        const { user } = get();
        const newLog = { ...log, id, user_id: user?.id || '' } as WorkLog;
        set((state) => ({ workLogs: [...state.workLogs, newLog] }));
        
        if (user && isSupabaseConfigured) {
          set({ syncStatus: 'syncing' });
          const { error } = await supabase.from('work_logs').insert({
            id,
            user_id: user.id,
            platform_type: log.platform_type,
            date: log.date,
            gross_amount: log.gross_amount,
            passenger_cash_amount: log.passenger_cash_amount,
            tips_amount: log.tips_amount,
            bonus_amount: log.bonus_amount,
            hours_worked: log.hours_worked,
            km_driven: log.km_driven,
            deliveries_count: log.deliveries_count,
            rides_count: log.rides_count,
            packages_count: log.packages_count,
            routes_count: log.routes_count,
            vehicle_type: log.vehicle_type,
            extra_expenses: log.extra_expenses,
            shopee_km_bracket: log.shopee_km_bracket,
            notes: log.notes
          });
          set({ syncStatus: error ? 'offline' : 'synced' });
        }
      },
      addFaturamentoLog: async (log) => {
        const id = crypto.randomUUID();
        const { user } = get();
        const newLog = { ...log, id, user_id: user?.id || '' } as FaturamentoLog;
        set((state) => ({ faturamentoLogs: [...state.faturamentoLogs, newLog] }));
        
        if (user && isSupabaseConfigured) {
          set({ syncStatus: 'syncing' });
          const { error } = await supabase.from('faturamento_logs').insert({
            id,
            user_id: user.id,
            date: log.date,
            vehicle_mode: log.vehicle_mode,
            uber_amount: log.uber_amount,
            noventanove_amount: log.noventanove_amount,
            indriver_amount: log.indriver_amount,
            extra_amount: log.extra_amount,
            km_total: log.km_total,
            active_hours_total: log.active_hours_total,
            fuel_total: log.fuel_total,
            fuel_price: log.fuel_price,
            fuel_type: log.fuel_type,
            additional_expense: log.additional_expense,
            notes: log.notes
          });
          set({ syncStatus: error ? 'offline' : 'synced' });
        }
      },
      updateFaturamentoLog: async (id, log) => {
        set((state) => ({
          faturamentoLogs: state.faturamentoLogs.map((l) => 
            l.id === id ? { ...l, ...log } : l
          )
        }));
        
        const { user } = get();
        if (user && isSupabaseConfigured) {
          set({ syncStatus: 'syncing' });
          const { error } = await supabase
            .from('faturamento_logs')
            .update({
              date: log.date,
              vehicle_mode: log.vehicle_mode,
              uber_amount: log.uber_amount,
              noventanove_amount: log.noventanove_amount,
              indriver_amount: log.indriver_amount,
              extra_amount: log.extra_amount,
              km_total: log.km_total,
              active_hours_total: log.active_hours_total,
              fuel_total: log.fuel_total,
              fuel_price: log.fuel_price,
              fuel_type: log.fuel_type,
              additional_expense: log.additional_expense,
              notes: log.notes
            })
            .eq('id', id);
          set({ syncStatus: error ? 'offline' : 'synced' });
        }
      },
      deleteWorkLog: async (id) => {
        set((state) => ({ workLogs: state.workLogs.filter(l => l.id !== id) }));
        const { user } = get();
        if (user && isSupabaseConfigured) {
          set({ syncStatus: 'syncing' });
          const { error } = await supabase.from('work_logs').delete().eq('id', id);
          set({ syncStatus: error ? 'offline' : 'synced' });
        }
      },
      deleteFaturamentoLog: async (id) => {
        set((state) => ({ faturamentoLogs: state.faturamentoLogs.filter(l => l.id !== id) }));
        const { user } = get();
        if (user && isSupabaseConfigured) {
          set({ syncStatus: 'syncing' });
          const { error } = await supabase.from('faturamento_logs').delete().eq('id', id);
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
            fuel_price: newSettings.fuelPrice,
            active_platforms: newSettings.activePlatforms,
            transport_mode: newSettings.transportMode,
            dashboard_mode: newSettings.dashboardMode
          }).eq('id', user.id);
          set({ syncStatus: error ? 'offline' : 'synced' });
        }
      },
      updateTracking: (newTracking) => set((state) => ({
        tracking: { ...state.tracking, ...newTracking }
      })),
      importData: (data) => set((state) => {
        const mergeById = (local: any[], incoming: any[]) => {
          const map = new Map(local.map(item => [item.id, item]));
          incoming.forEach(item => map.set(item.id, item));
          return Array.from(map.values());
        };

        return {
          rides: data.rides ? mergeById(state.rides, data.rides) : state.rides,
          workLogs: data.workLogs ? mergeById(state.workLogs, data.workLogs) : state.workLogs,
          faturamentoLogs: data.faturamentoLogs ? mergeById(state.faturamentoLogs, data.faturamentoLogs) : state.faturamentoLogs,
          expenses: data.expenses ? mergeById(state.expenses, data.expenses) : state.expenses,
          fuelings: data.fuelings ? mergeById(state.fuelings, data.fuelings) : state.fuelings,
          maintenances: data.maintenances ? mergeById(state.maintenances, data.maintenances) : state.maintenances,
          settings: data.settings ? { ...state.settings, ...data.settings } : state.settings,
        };
      }),
      clearData: () => set({
        rides: [],
        workLogs: [],
        faturamentoLogs: [],
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
        workLogs: state.workLogs,
        faturamentoLogs: state.faturamentoLogs,
        expenses: state.expenses,
        fuelings: state.fuelings,
        maintenances: state.maintenances,
        settings: state.settings,
      }),
    }
  )
);
