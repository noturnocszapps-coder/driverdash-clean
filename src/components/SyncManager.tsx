import React, { useEffect } from 'react';
import { useDriverStore } from '../store';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export const SyncManager = () => {
  const { user, importData, setSyncStatus } = useDriverStore();

  useEffect(() => {
    if (!user || !isSupabaseConfigured) return;

    const fetchData = async () => {
      setSyncStatus('syncing');
      try {
        // Fetch Profile/Settings
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profile) {
          importData({
            settings: {
              name: profile.name,
              dailyGoal: profile.daily_goal,
              vehicle: profile.car_model || profile.vehicle || 'Veículo',
              kmPerLiter: profile.km_per_liter,
              fuelPrice: profile.fuel_price,
              activePlatforms: profile.active_platforms || ['uber_car'],
              transportMode: profile.transport_mode || 'car',
              dashboardMode: profile.dashboard_mode || 'merged'
            }
          });
        }

        // Fetch Work Logs
        const { data: workLogs } = await supabase
          .from('work_logs')
          .select('*')
          .eq('user_id', user.id);

        if (workLogs) {
          importData({
            workLogs: workLogs.map(l => ({
              id: l.id,
              user_id: l.user_id,
              platform_type: l.platform_type as any,
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
            }))
          });
        }

        // Fetch Trips
        const { data: trips } = await supabase
          .from('trips')
          .select('*')
          .eq('user_id', user.id);

        if (trips) {
          importData({
            rides: trips.map(t => ({
              id: t.id,
              date: t.date,
              app: t.app as any,
              grossValue: Number(t.gross),
              tips: Number(t.tips),
              bonus: Number(t.bonus),
              onlineHours: Number(t.hours_online),
              kmDriven: Number(t.km_driven),
              passengerPaid: t.passenger_paid_amount ? Number(t.passenger_paid_amount) : undefined
            }))
          });
        }

        // Fetch Expenses
        const { data: expenses } = await supabase
          .from('expenses')
          .select('*')
          .eq('user_id', user.id);

        if (expenses) {
          importData({
            expenses: expenses.map(e => ({
              id: e.id,
              date: e.date,
              category: e.category as any,
              value: Number(e.value),
              description: e.description || ''
            }))
          });
        }

        // Fetch Fuel
        const { data: fuel } = await supabase
          .from('fuel_logs')
          .select('*')
          .eq('user_id', user.id);

        if (fuel) {
          importData({
            fuelings: fuel.map(f => ({
              id: f.id,
              date: f.date,
              liters: Number(f.liters),
              value: Number(f.cost),
              odometer: Number(f.odometer)
            }))
          });
        }

        // Fetch Maintenance
        const { data: maintenance } = await supabase
          .from('maintenance_logs')
          .select('*')
          .eq('user_id', user.id);

        if (maintenance) {
          importData({
            maintenances: maintenance.map(m => ({
              id: m.id,
              date: m.date,
              type: m.type,
              value: Number(m.cost),
              currentKm: Number(m.odometer),
              nextChangeKm: Number(m.next_change_km)
            }))
          });
        }

        // Fetch Faturamento Logs
        const { data: faturamento } = await supabase
          .from('faturamento_logs')
          .select('*')
          .eq('user_id', user.id);

        if (faturamento) {
          console.log(`[SyncManager] Fetched ${faturamento.length} faturamento logs from Supabase`);
          importData({
            faturamentoLogs: faturamento.map(l => ({
              id: l.id,
              user_id: l.user_id,
              date: l.date,
              vehicle_mode: l.vehicle_mode as any,
              uber_amount: Number(l.uber_amount),
              noventanove_amount: Number(l.noventanove_amount),
              indriver_amount: Number(l.indriver_amount),
              extra_amount: Number(l.extra_amount),
              km_total: Number(l.km_total),
              active_hours_total: Number(l.active_hours_total),
              fuel_total: Number(l.fuel_total),
              fuel_price: Number(l.fuel_price),
              fuel_type: l.fuel_type as any,
              additional_expense: Number(l.additional_expense),
              notes: l.notes || ''
            }))
          });
        }

        console.log('[SyncManager] Sync completed successfully');
        setSyncStatus('synced');
      } catch (err) {
        console.error('[SyncManager] Error fetching data from Supabase:', err);
        setSyncStatus('offline');
      }
    };

    fetchData();
  }, [user]);

  return null;
};
