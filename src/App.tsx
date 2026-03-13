import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { LandingPage } from './LandingPage';
import { Dashboard } from './pages/Dashboard';
import { GoalProjection } from './pages/GoalProjection';
import { FuelConsumption } from './pages/FuelConsumption';
import { Simulator } from './pages/Simulator';
import { Comparison } from './pages/Comparison';
import { Rides } from './pages/Rides';
import { Expenses } from './pages/Expenses';
import { FuelingPage } from './pages/Fueling';
import { MaintenancePage } from './pages/Maintenance';
import { Reports } from './pages/Reports';
import { Settings } from './pages/Settings';
import { Tracking } from './pages/Tracking';
import { VehicleCosts } from './pages/VehicleCosts';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { ForgotPassword } from './pages/ForgotPassword';
import { Sidebar, BottomNav } from './components/Navigation';
import { QuickRideButton } from './components/QuickRideButton';
import { SyncIndicator } from './components/SyncIndicator';
import { SyncManager } from './components/SyncManager';
import { supabase, isSupabaseConfigured } from './lib/supabase';
import { useDriverStore } from './store';

const RequireAuth = ({ children }: { children: React.ReactNode }) => {
  const { user } = useDriverStore();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const Layout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const isLanding = location.pathname === '/';
  const isAuth = ['/login', '/register', '/forgot-password'].includes(location.pathname);

  if (isLanding || isAuth) return <>{children}</>;

  return (
    <div className="flex min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      <Sidebar />
      <main className="flex-1 px-4 py-6 md:px-8 max-w-5xl mx-auto w-full">
        <div className="flex justify-end mb-4 md:hidden">
          <SyncIndicator />
        </div>
        {children}
      </main>
      <QuickRideButton />
      <BottomNav />
    </div>
  );
};

export default function App() {
  const { setUser, setSyncStatus } = useDriverStore();

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setUser(null);
      setSyncStatus('offline');
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email!,
          name: session.user.user_metadata.name,
        });
        setSyncStatus('online');
      } else {
        setUser(null);
        setSyncStatus('offline');
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email!,
          name: session.user.user_metadata.name,
        });
        setSyncStatus('online');
      } else {
        setUser(null);
        setSyncStatus('offline');
      }
    });

    return () => subscription.unsubscribe();
  }, [setUser, setSyncStatus]);

  return (
    <Router>
      <SyncManager />
      <Layout>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          <Route
            path="/dashboard"
            element={
              <RequireAuth>
                <Dashboard />
              </RequireAuth>
            }
          />
          <Route
            path="/projection"
            element={
              <RequireAuth>
                <GoalProjection />
              </RequireAuth>
            }
          />
          <Route
            path="/consumption"
            element={
              <RequireAuth>
                <FuelConsumption />
              </RequireAuth>
            }
          />
          <Route
            path="/simulator"
            element={
              <RequireAuth>
                <Simulator />
              </RequireAuth>
            }
          />
          <Route
            path="/comparison"
            element={
              <RequireAuth>
                <Comparison />
              </RequireAuth>
            }
          />
          <Route
            path="/rides"
            element={
              <RequireAuth>
                <Rides />
              </RequireAuth>
            }
          />
          <Route
            path="/expenses"
            element={
              <RequireAuth>
                <Expenses />
              </RequireAuth>
            }
          />
          <Route
            path="/fuel"
            element={
              <RequireAuth>
                <FuelingPage />
              </RequireAuth>
            }
          />
          <Route
            path="/maintenance"
            element={
              <RequireAuth>
                <MaintenancePage />
              </RequireAuth>
            }
          />
          <Route
            path="/reports"
            element={
              <RequireAuth>
                <Reports />
              </RequireAuth>
            }
          />
          <Route
            path="/tracking"
            element={
              <RequireAuth>
                <Tracking />
              </RequireAuth>
            }
          />
          <Route
            path="/vehicle-costs"
            element={
              <RequireAuth>
                <VehicleCosts />
              </RequireAuth>
            }
          />
          <Route
            path="/settings"
            element={
              <RequireAuth>
                <Settings />
              </RequireAuth>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </Router>
  );
}