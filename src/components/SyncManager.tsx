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
              fuelPrice: profile.fuel_price
            }
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

        setSyncStatus('synced');
      } catch (err) {
        console.error('Error fetching data from Supabase:', err);
        setSyncStatus('offline');
      }
    };

    fetchData();
  }, [user]);

  return null;
};
