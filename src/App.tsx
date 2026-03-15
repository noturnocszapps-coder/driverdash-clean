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
import { WorkLogs } from './pages/WorkLogs';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { ForgotPassword } from './pages/ForgotPassword';
import { Faturamento } from './pages/Faturamento';
import { Sidebar, BottomNav } from './components/Navigation';
import { QuickRideButton } from './components/QuickRideButton';
import { SyncIndicator } from './components/SyncIndicator';
import { SyncManager } from './components/SyncManager';
import { Footer } from './components/Footer';
import { supabase, isSupabaseConfigured } from './lib/supabase';
import { useDriverStore } from './store';

const Layout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const isLanding = location.pathname === '/';
  const isAuth = ['/login', '/register', '/forgot-password'].includes(location.pathname);

  if (isLanding || isAuth) return (
    <>
      {children}
      {isLanding && <Footer />}
    </>
  );

  return (
    <div className="flex flex-col min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 px-4 py-6 md:px-8 max-w-5xl mx-auto w-full">
          <div className="flex justify-end mb-4 md:hidden">
            <SyncIndicator />
          </div>
          {children}
        </main>
      </div>
      <QuickRideButton />
      <BottomNav />
      <Footer />
    </div>
  );
};

import { ProtectedRoute } from './components/ProtectedRoute';

export default function App() {
  const { setUser, setSyncStatus } = useDriverStore();

  useEffect(() => {
    if (!isSupabaseConfigured) return;

    // Check active sessions and sets the user
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error('[App] Auth session error:', error.message);
        if (error.message.includes('Refresh Token Not Found') || error.message.includes('refresh_token_not_found')) {
          supabase.auth.signOut();
          setUser(null);
        }
        return;
      }

      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email!,
          name: session.user.user_metadata.name,
        });
        setSyncStatus('online');
      }
    });

    // Listen for changes on auth state (logged in, signed out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('[App] Auth event:', event);
      
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
  }, []);

  return (
    <Router>
      <SyncManager />
      <Layout>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          
          {/* Protected Routes */}
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/faturamento" element={<ProtectedRoute><Faturamento /></ProtectedRoute>} />
          <Route path="/projection" element={<ProtectedRoute><GoalProjection /></ProtectedRoute>} />
          <Route path="/consumption" element={<ProtectedRoute><FuelConsumption /></ProtectedRoute>} />
          <Route path="/simulator" element={<ProtectedRoute><Simulator /></ProtectedRoute>} />
          <Route path="/comparison" element={<ProtectedRoute><Comparison /></ProtectedRoute>} />
          <Route path="/rides" element={<ProtectedRoute><Rides /></ProtectedRoute>} />
          <Route path="/expenses" element={<ProtectedRoute><Expenses /></ProtectedRoute>} />
          <Route path="/fuel" element={<ProtectedRoute><FuelingPage /></ProtectedRoute>} />
          <Route path="/maintenance" element={<ProtectedRoute><MaintenancePage /></ProtectedRoute>} />
          <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
          <Route path="/tracking" element={<ProtectedRoute><Tracking /></ProtectedRoute>} />
          <Route path="/vehicle-costs" element={<ProtectedRoute><VehicleCosts /></ProtectedRoute>} />
          <Route path="/work-logs" element={<ProtectedRoute><WorkLogs /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </Router>
  );
}
