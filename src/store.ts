import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DriverState, UserSettings, AuthUser, SyncStatus, Cycle, Expense, Fueling, Maintenance } from './types';
import { supabase, isSupabaseConfigured } from './lib/supabase';

export const useDriverStore = create<DriverState>()(
  persist(
    (set, get) => ({
      user: null,
      syncStatus: 'idle',
      rides: [],
      workLogs: [],
      faturamentoLogs: [],
      cycles: [],
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
        fixedCosts: {
          vehicleType: 'owned',
        },
        vehicleProfiles: [],
        currentVehicleProfileId: undefined,
      },
      tracking: {
        isActive: false,
        distance: 0,
        avgSpeed: 0,
        duration: 0,
      },
      setUser: (user) => set({ user }),
      setSyncStatus: (syncStatus) => set({ syncStatus }),
      
      startCycle: () => {
        const { user, cycles } = get();
        const openCycle = cycles.find(c => c.status === 'open');
        if (openCycle) return openCycle.id;

        const id = crypto.randomUUID();
        const newCycle = {
          id,
          user_id: user?.id || '',
          start_time: new Date().toISOString(),
          uber_amount: 0,
          noventanove_amount: 0,
          indriver_amount: 0,
          extra_amount: 0,
          total_amount: 0,
          status: 'open' as const,
        };

        set((state) => ({ cycles: [...state.cycles, newCycle] }));

        if (user && isSupabaseConfigured) {
          set({ syncStatus: 'syncing' });
          supabase.from('cycles').insert(newCycle).then(({ error }) => {
            if (error) console.error('[Store] Sync error (start cycle):', error);
            set({ syncStatus: error ? 'offline' : 'synced' });
            setTimeout(() => {
              if (get().syncStatus === 'synced') set({ syncStatus: 'idle' });
            }, 3000);
          });
        }

        return id;
      },

      closeCycle: async (id) => {
        const { user } = get();
        const endTime = new Date().toISOString();
        
        set((state) => ({
          cycles: state.cycles.map(c => 
            c.id === id ? { ...c, status: 'closed', end_time: endTime } : c
          )
        }));

        if (user && isSupabaseConfigured) {
          set({ syncStatus: 'syncing' });
          const { error } = await supabase
            .from('cycles')
            .update({ status: 'closed', end_time: endTime })
            .eq('id', id);
          if (error) console.error('[Store] Sync error (close cycle):', error);
          set({ syncStatus: error ? 'offline' : 'synced' });
          setTimeout(() => {
            if (get().syncStatus === 'synced') set({ syncStatus: 'idle' });
          }, 3000);
        }
      },

      updateCycle: async (id, data) => {
        const { user } = get();
        set((state) => ({
          cycles: state.cycles.map(c => {
            if (c.id === id) {
              const updated = { ...c, ...data };
              updated.total_amount = (updated.uber_amount || 0) + (updated.noventanove_amount || 0) + (updated.indriver_amount || 0) + (updated.extra_amount || 0);
              updated.total_expenses = (updated.fuel_expense || 0) + (updated.food_expense || 0) + (updated.other_expense || 0);
              return updated;
            }
            return c;
          })
        }));

        if (user && isSupabaseConfigured) {
          const cycle = get().cycles.find(c => c.id === id);
          if (!cycle) return;
          
          set({ syncStatus: 'syncing' });
          const { error } = await supabase
            .from('cycles')
            .update({
              uber_amount: cycle.uber_amount,
              noventanove_amount: cycle.noventanove_amount,
              indriver_amount: cycle.indriver_amount,
              extra_amount: cycle.extra_amount,
              total_amount: cycle.total_amount,
              fuel_expense: cycle.fuel_expense,
              food_expense: cycle.food_expense,
              other_expense: cycle.other_expense,
              total_expenses: cycle.total_expenses,
              end_time: cycle.end_time,
              status: cycle.status
            })
            .eq('id', id);
          if (error) console.error('[Store] Sync error (update cycle):', error);
          set({ syncStatus: error ? 'offline' : 'synced' });
          setTimeout(() => {
            if (get().syncStatus === 'synced') set({ syncStatus: 'idle' });
          }, 3000);
        }
      },

      addCycleAmount: (id, platform, amount) => {
        const { cycles, updateCycle } = get();
        const cycle = cycles.find(c => c.id === id);
        if (!cycle) return;

        const field = `${platform}_amount` as const;
        const currentAmount = (cycle[field] as number) || 0;
        updateCycle(id, { [field]: currentAmount + amount });
      },

      checkAndCloseCycles: () => {
        const { cycles, closeCycle } = get();
        const now = new Date().getTime();
        const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

        cycles.forEach(c => {
          if (c.status === 'open') {
            const startTime = new Date(c.start_time).getTime();
            if (now - startTime >= TWENTY_FOUR_HOURS) {
              closeCycle(c.id);
            }
          }
        });
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
          if (error) console.error('[Store] Sync error (expense):', error);
          set({ syncStatus: error ? 'offline' : 'synced' });
          setTimeout(() => {
            if (get().syncStatus === 'synced') set({ syncStatus: 'idle' });
          }, 3000);
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
          if (error) console.error('[Store] Sync error (fueling):', error);
          set({ syncStatus: error ? 'offline' : 'synced' });
          setTimeout(() => {
            if (get().syncStatus === 'synced') set({ syncStatus: 'idle' });
          }, 3000);
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
          if (error) console.error('[Store] Sync error (maintenance):', error);
          set({ syncStatus: error ? 'offline' : 'synced' });
          setTimeout(() => {
            if (get().syncStatus === 'synced') set({ syncStatus: 'idle' });
          }, 3000);
        }
      },

      updateSettings: async (newSettings) => {
        set((state) => ({ settings: { ...state.settings, ...newSettings } }));
        const { user, settings } = get();
        if (user && isSupabaseConfigured) {
          set({ syncStatus: 'syncing' });
          const { error } = await supabase.from('profiles').update({
            name: settings.name,
            daily_goal: settings.dailyGoal,
            vehicle: settings.vehicle,
            km_per_liter: settings.kmPerLiter,
            fuel_price: settings.fuelPrice,
            active_platforms: settings.activePlatforms,
            transport_mode: settings.transportMode,
            dashboard_mode: settings.dashboardMode,
            fixed_costs: settings.fixedCosts,
            current_vehicle_profile_id: settings.currentVehicleProfileId,
            vehicle_profiles: settings.vehicleProfiles
          }).eq('id', user.id);
          if (error) console.error('[Store] Sync error (settings):', error);
          set({ syncStatus: error ? 'offline' : 'synced' });
          setTimeout(() => {
            if (get().syncStatus === 'synced') set({ syncStatus: 'idle' });
          }, 3000);
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
          expenses: data.expenses ? mergeById(state.expenses, data.expenses) : state.expenses,
          fuelings: data.fuelings ? mergeById(state.fuelings, data.fuelings) : state.fuelings,
          maintenances: data.maintenances ? mergeById(state.maintenances, data.maintenances) : state.maintenances,
          cycles: data.cycles ? mergeById(state.cycles, data.cycles) : state.cycles,
          settings: data.settings ? { ...state.settings, ...data.settings } : state.settings,
        };
      }),

      syncData: async () => {
        const { user, syncStatus, setSyncStatus, importData, expenses, fuelings, maintenances, settings, cycles } = get();
        
        if (!user || !isSupabaseConfigured) return;
        if (syncStatus === 'syncing') return;

        setSyncStatus('syncing');

        try {
          // 1. Push local data (Upsert)
          if (expenses.length > 0) {
            await supabase.from('expenses').upsert(expenses.map(e => ({
              id: e.id,
              user_id: user.id,
              date: e.date,
              category: e.category,
              value: e.value,
              description: e.description
            })));
          }

          if (fuelings.length > 0) {
            await supabase.from('fuel_logs').upsert(fuelings.map(f => ({
              id: f.id,
              user_id: user.id,
              date: f.date,
              liters: f.liters,
              cost: f.value,
              odometer: f.odometer
            })));
          }

          if (maintenances.length > 0) {
            await supabase.from('maintenance_logs').upsert(maintenances.map(m => ({
              id: m.id,
              user_id: user.id,
              date: m.date,
              type: m.type,
              cost: m.value,
              odometer: m.currentKm,
              next_change_km: m.nextChangeKm
            })));
          }

          if (cycles.length > 0) {
            await supabase.from('cycles').upsert(cycles.map(c => ({
              id: c.id,
              user_id: user.id,
              start_time: c.start_time,
              end_time: c.end_time,
              uber_amount: c.uber_amount,
              noventanove_amount: c.noventanove_amount,
              indriver_amount: c.indriver_amount,
              extra_amount: c.extra_amount,
              total_amount: c.total_amount,
              fuel_expense: c.fuel_expense,
              food_expense: c.food_expense,
              other_expense: c.other_expense,
              total_expenses: c.total_expenses,
              status: c.status
            })));
          }

          await supabase.from('profiles').upsert({
            id: user.id,
            name: settings.name,
            daily_goal: settings.dailyGoal,
            vehicle: settings.vehicle,
            km_per_liter: settings.kmPerLiter,
            fuel_price: settings.fuelPrice,
            active_platforms: settings.activePlatforms,
            transport_mode: settings.transportMode,
            dashboard_mode: settings.dashboardMode,
            fixed_costs: settings.fixedCosts,
            current_vehicle_profile_id: settings.currentVehicleProfileId,
            vehicle_profiles: settings.vehicleProfiles
          });

          // 2. Fetch latest data
          const [
            { data: profile },
            { data: dbExpenses },
            { data: dbFuel },
            { data: dbMaintenance },
            { data: dbCycles }
          ] = await Promise.all([
            supabase.from('profiles').select('*').eq('id', user.id).single(),
            supabase.from('expenses').select('*').eq('user_id', user.id),
            supabase.from('fuel_logs').select('*').eq('user_id', user.id),
            supabase.from('maintenance_logs').select('*').eq('user_id', user.id),
            supabase.from('cycles').select('*').eq('user_id', user.id)
          ]);

          const importedData: any = {};

          if (profile) {
            importedData.settings = {
              name: profile.name,
              dailyGoal: profile.daily_goal,
              vehicle: profile.vehicle || 'Veículo',
              kmPerLiter: profile.km_per_liter,
              fuelPrice: profile.fuel_price,
              activePlatforms: profile.active_platforms || ['uber_car'],
              transportMode: profile.transport_mode || 'car',
              dashboardMode: profile.dashboard_mode || 'merged',
              fixedCosts: profile.fixed_costs,
              currentVehicleProfileId: profile.current_vehicle_profile_id,
              vehicleProfiles: profile.vehicle_profiles
            };
          }

          if (dbExpenses) {
            importedData.expenses = dbExpenses.map(e => ({
              id: e.id,
              date: e.date,
              category: e.category,
              value: Number(e.value),
              description: e.description || ''
            }));
          }

          if (dbFuel) {
            importedData.fuelings = dbFuel.map(f => ({
              id: f.id,
              date: f.date,
              liters: Number(f.liters),
              value: Number(f.cost),
              odometer: Number(f.odometer)
            }));
          }

          if (dbMaintenance) {
            importedData.maintenances = dbMaintenance.map(m => ({
              id: m.id,
              date: m.date,
              type: m.type,
              value: Number(m.cost),
              currentKm: Number(m.odometer),
              nextChangeKm: Number(m.next_change_km)
            }));
          }

          if (dbCycles) {
            importedData.cycles = dbCycles.map(c => ({
              id: c.id,
              user_id: c.user_id,
              start_time: c.start_time,
              end_time: c.end_time,
              uber_amount: Number(c.uber_amount),
              noventanove_amount: Number(c.noventanove_amount),
              indriver_amount: Number(c.indriver_amount),
              extra_amount: Number(c.extra_amount),
              total_amount: Number(c.total_amount),
              fuel_expense: Number(c.fuel_expense || 0),
              food_expense: Number(c.food_expense || 0),
              other_expense: Number(c.other_expense || 0),
              total_expenses: Number(c.total_expenses || 0),
              status: c.status
            }));
          }

          importData(importedData);
          setSyncStatus('synced');
          setTimeout(() => {
            if (get().syncStatus === 'synced') setSyncStatus('idle');
          }, 3000);

        } catch (err) {
          console.error('[Store] Full sync error:', err);
          setSyncStatus('offline');
        }
      },
      clearData: () => set({
        cycles: [],
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
      clearCloudData: async () => {
        const { user } = get();
        if (!user || !isSupabaseConfigured) return { success: true };
        
        set({ syncStatus: 'syncing' });
        try {
          const { error } = await supabase.rpc('clear_all_user_operational_data');
          if (error) throw error;
          
          set({ syncStatus: 'synced' });
          setTimeout(() => {
            if (get().syncStatus === 'synced') set({ syncStatus: 'idle' });
          }, 3000);
          
          return { success: true };
        } catch (error) {
          console.error('[Store] Error clearing cloud data:', error);
          set({ syncStatus: 'offline' });
          return { success: false, error };
        }
      },
    }),
    {
      name: 'driver-dash-storage',
      partialize: (state) => ({
        cycles: state.cycles,
        expenses: state.expenses,
        fuelings: state.fuelings,
        maintenances: state.maintenances,
        settings: state.settings,
      }),
    }
  )
);
