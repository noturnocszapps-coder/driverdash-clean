import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DriverState, Ride, Expense, Fueling, Maintenance, UserSettings, AuthUser, SyncStatus, WorkLog, FaturamentoLog } from './types';
import { supabase, isSupabaseConfigured } from './lib/supabase';

export const useDriverStore = create<DriverState>()(
  persist(
    (set, get) => ({
      user: null,
      syncStatus: 'idle',
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
          console.log('[Store] Syncing new ride to Supabase...');
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
          if (error) console.error('[Store] Sync error (ride):', error);
          set({ syncStatus: error ? 'offline' : 'synced' });
          
          // Reset to idle after a short delay to show "synced" status
          setTimeout(() => {
            if (get().syncStatus === 'synced') set({ syncStatus: 'idle' });
          }, 3000);
        }
      },
      addWorkLog: async (log) => {
        const id = crypto.randomUUID();
        const { user } = get();
        const newLog = { ...log, id, user_id: user?.id || '' } as WorkLog;
        set((state) => ({ workLogs: [...state.workLogs, newLog] }));
        
        if (user && isSupabaseConfigured) {
          console.log('[Store] Syncing new work log to Supabase...');
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
          if (error) console.error('[Store] Sync error (work log):', error);
          set({ syncStatus: error ? 'offline' : 'synced' });
          setTimeout(() => {
            if (get().syncStatus === 'synced') set({ syncStatus: 'idle' });
          }, 3000);
        }
      },
      addFaturamentoLog: async (log) => {
        const id = crypto.randomUUID();
        const { user } = get();
        const newLog = { ...log, id, user_id: user?.id || '' } as FaturamentoLog;
        set((state) => ({ faturamentoLogs: [...state.faturamentoLogs, newLog] }));
        
        if (user && isSupabaseConfigured) {
          console.log('[Store] Syncing new faturamento log to Supabase...');
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
          if (error) console.error('[Store] Sync error (faturamento):', error);
          set({ syncStatus: error ? 'offline' : 'synced' });
          setTimeout(() => {
            if (get().syncStatus === 'synced') set({ syncStatus: 'idle' });
          }, 3000);
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
          console.log('[Store] Updating faturamento log in Supabase...');
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
          if (error) console.error('[Store] Sync error (update faturamento):', error);
          set({ syncStatus: error ? 'offline' : 'synced' });
          setTimeout(() => {
            if (get().syncStatus === 'synced') set({ syncStatus: 'idle' });
          }, 3000);
        }
      },
      deleteWorkLog: async (id) => {
        set((state) => ({ workLogs: state.workLogs.filter(l => l.id !== id) }));
        const { user } = get();
        if (user && isSupabaseConfigured) {
          console.log('[Store] Deleting work log from Supabase...');
          set({ syncStatus: 'syncing' });
          const { error } = await supabase.from('work_logs').delete().eq('id', id);
          if (error) console.error('[Store] Sync error (delete work log):', error);
          set({ syncStatus: error ? 'offline' : 'synced' });
          setTimeout(() => {
            if (get().syncStatus === 'synced') set({ syncStatus: 'idle' });
          }, 3000);
        }
      },
      deleteFaturamentoLog: async (id) => {
        set((state) => ({ faturamentoLogs: state.faturamentoLogs.filter(l => l.id !== id) }));
        const { user } = get();
        if (user && isSupabaseConfigured) {
          console.log('[Store] Deleting faturamento log from Supabase...');
          set({ syncStatus: 'syncing' });
          const { error } = await supabase.from('faturamento_logs').delete().eq('id', id);
          if (error) console.error('[Store] Sync error (delete faturamento):', error);
          set({ syncStatus: error ? 'offline' : 'synced' });
          setTimeout(() => {
            if (get().syncStatus === 'synced') set({ syncStatus: 'idle' });
          }, 3000);
        }
      },
      deleteRide: async (id) => {
        set((state) => ({ rides: state.rides.filter(r => r.id !== id) }));
        const { user } = get();
        if (user && isSupabaseConfigured) {
          console.log('[Store] Deleting ride from Supabase...');
          set({ syncStatus: 'syncing' });
          const { error } = await supabase.from('trips').delete().eq('id', id);
          if (error) console.error('[Store] Sync error (delete ride):', error);
          set({ syncStatus: error ? 'offline' : 'synced' });
          setTimeout(() => {
            if (get().syncStatus === 'synced') set({ syncStatus: 'idle' });
          }, 3000);
        }
      },
      addExpense: async (expense) => {
        const id = crypto.randomUUID();
        const newExpense = { ...expense, id };
        set((state) => ({ expenses: [...state.expenses, newExpense] }));
        const { user } = get();
        if (user && isSupabaseConfigured) {
          console.log('[Store] Syncing new expense to Supabase...');
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
          console.log('[Store] Syncing new fueling to Supabase...');
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
          console.log('[Store] Syncing new maintenance to Supabase...');
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
        const { user } = get();
        if (user && isSupabaseConfigured) {
          console.log('[Store] Updating settings in Supabase...');
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
          rides: data.rides ? mergeById(state.rides, data.rides) : state.rides,
          workLogs: data.workLogs ? mergeById(state.workLogs, data.workLogs) : state.workLogs,
          faturamentoLogs: data.faturamentoLogs ? mergeById(state.faturamentoLogs, data.faturamentoLogs) : state.faturamentoLogs,
          expenses: data.expenses ? mergeById(state.expenses, data.expenses) : state.expenses,
          fuelings: data.fuelings ? mergeById(state.fuelings, data.fuelings) : state.fuelings,
          maintenances: data.maintenances ? mergeById(state.maintenances, data.maintenances) : state.maintenances,
          settings: data.settings ? { ...state.settings, ...data.settings } : state.settings,
        };
      }),
      syncData: async () => {
        const { user, syncStatus, setSyncStatus, importData, rides, workLogs, faturamentoLogs, expenses, fuelings, maintenances, settings } = get();
        
        if (!user || !isSupabaseConfigured) return;
        if (syncStatus === 'syncing') return;

        console.log('[Store] Starting full sync with Supabase...');
        setSyncStatus('syncing');

        try {
          // 1. Push local data (Upsert)
          // We'll push everything to ensure cloud is up to date
          console.log('[Store] Pushing local data to Supabase...');
          
          // Trips
          if (rides.length > 0) {
            await supabase.from('trips').upsert(rides.map(r => ({
              id: r.id,
              user_id: user.id,
              date: r.date,
              app: r.app,
              gross: r.grossValue,
              tips: r.tips,
              bonus: r.bonus,
              hours_online: r.onlineHours,
              km_driven: r.kmDriven,
              passenger_paid_amount: r.passengerPaid
            })));
          }

          // Work Logs
          if (workLogs.length > 0) {
            await supabase.from('work_logs').upsert(workLogs.map(l => ({
              id: l.id,
              user_id: user.id,
              platform_type: l.platform_type,
              date: l.date,
              gross_amount: l.gross_amount,
              passenger_cash_amount: l.passenger_cash_amount,
              tips_amount: l.tips_amount,
              bonus_amount: l.bonus_amount,
              hours_worked: l.hours_worked,
              km_driven: l.km_driven,
              deliveries_count: l.deliveries_count,
              rides_count: l.rides_count,
              packages_count: l.packages_count,
              routes_count: l.routes_count,
              vehicle_type: l.vehicle_type,
              extra_expenses: l.extra_expenses,
              shopee_km_bracket: l.shopee_km_bracket,
              notes: l.notes
            })));
          }

          // Faturamento Logs
          if (faturamentoLogs.length > 0) {
            await supabase.from('faturamento_logs').upsert(faturamentoLogs.map(l => ({
              id: l.id,
              user_id: user.id,
              date: l.date,
              vehicle_mode: l.vehicle_mode,
              uber_amount: l.uber_amount,
              noventanove_amount: l.noventanove_amount,
              indriver_amount: l.indriver_amount,
              extra_amount: l.extra_amount,
              km_total: l.km_total,
              active_hours_total: l.active_hours_total,
              fuel_total: l.fuel_total,
              fuel_price: l.fuel_price,
              fuel_type: l.fuel_type,
              additional_expense: l.additional_expense,
              notes: l.notes
            })));
          }

          // Expenses
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

          // Fuel
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

          // Maintenance
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

          // Settings/Profile
          await supabase.from('profiles').upsert({
            id: user.id,
            name: settings.name,
            daily_goal: settings.dailyGoal,
            vehicle: settings.vehicle,
            km_per_liter: settings.kmPerLiter,
            fuel_price: settings.fuelPrice,
            active_platforms: settings.activePlatforms,
            transport_mode: settings.transportMode,
            dashboard_mode: settings.dashboardMode
          });

          // 2. Fetch latest data
          console.log('[Store] Fetching latest data from Supabase...');
          
          const [
            { data: profile },
            { data: dbWorkLogs },
            { data: dbTrips },
            { data: dbExpenses },
            { data: dbFuel },
            { data: dbMaintenance },
            { data: dbFaturamento }
          ] = await Promise.all([
            supabase.from('profiles').select('*').eq('id', user.id).single(),
            supabase.from('work_logs').select('*').eq('user_id', user.id),
            supabase.from('trips').select('*').eq('user_id', user.id),
            supabase.from('expenses').select('*').eq('user_id', user.id),
            supabase.from('fuel_logs').select('*').eq('user_id', user.id),
            supabase.from('maintenance_logs').select('*').eq('user_id', user.id),
            supabase.from('faturamento_logs').select('*').eq('user_id', user.id)
          ]);

          const importedData: any = {};

          if (profile) {
            importedData.settings = {
              name: profile.name,
              dailyGoal: profile.daily_goal,
              vehicle: profile.car_model || profile.vehicle || 'Veículo',
              kmPerLiter: profile.km_per_liter,
              fuelPrice: profile.fuel_price,
              activePlatforms: profile.active_platforms || ['uber_car'],
              transportMode: profile.transport_mode || 'car',
              dashboardMode: profile.dashboard_mode || 'merged'
            };
          }

          if (dbWorkLogs) {
            importedData.workLogs = dbWorkLogs.map(l => ({
              id: l.id,
              user_id: l.user_id,
              platform_type: l.platform_type,
              date: l.date,
              gross_amount: Number(l.gross_amount),
              passenger_cash_amount: Number(l.passenger_cash_amount),
              tips_amount: Number(l.tips_amount),
              bonus_amount: Number(l.bonus_amount),
              hours_worked: Number(l.hours_worked),
              km_driven: Number(l.km_driven),
              deliveries_count: l.deliveries_count ? Number(l.deliveries_count) : undefined,
              rides_count: l.rides_count ? Number(l.rides_count) : undefined,
              packages_count: l.packages_count ? Number(l.packages_count) : undefined,
              routes_count: l.routes_count ? Number(l.routes_count) : undefined,
              notes: l.notes || ''
            }));
          }

          if (dbTrips) {
            importedData.rides = dbTrips.map(t => ({
              id: t.id,
              date: t.date,
              app: t.app,
              grossValue: Number(t.gross),
              tips: Number(t.tips),
              bonus: Number(t.bonus),
              onlineHours: Number(t.hours_online),
              kmDriven: Number(t.km_driven),
              passengerPaid: t.passenger_paid_amount ? Number(t.passenger_paid_amount) : undefined
            }));
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

          if (dbFaturamento) {
            importedData.faturamentoLogs = dbFaturamento.map(l => ({
              id: l.id,
              user_id: l.user_id,
              date: l.date,
              vehicle_mode: l.vehicle_mode,
              uber_amount: Number(l.uber_amount),
              noventanove_amount: Number(l.noventanove_amount),
              indriver_amount: Number(l.indriver_amount),
              extra_amount: Number(l.extra_amount),
              km_total: Number(l.km_total),
              active_hours_total: Number(l.active_hours_total),
              fuel_total: Number(l.fuel_total),
              fuel_price: Number(l.fuel_price),
              fuel_type: l.fuel_type,
              additional_expense: Number(l.additional_expense),
              notes: l.notes || ''
            }));
          }

          importData(importedData);
          console.log('[Store] Full sync completed successfully');
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
