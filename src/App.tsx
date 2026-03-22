import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { LandingPage } from './LandingPage';
import { Dashboard } from './pages/Dashboard';
import { Reports } from './pages/Reports';
import { Settings } from './pages/Settings';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { ForgotPassword } from './pages/ForgotPassword';
import { Faturamento } from './pages/Faturamento';
import { Sidebar, BottomNav } from './components/Navigation';
import { SyncManager } from './components/SyncManager';
import { Footer } from './components/Footer';
import { supabase, isSupabaseConfigured } from './lib/supabase';
import { useDriverStore } from './store';
import { ProtectedRoute } from './components/ProtectedRoute';


// ==============================
// Layout
// ==============================
const Layout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const isLanding = location.pathname === '/';
  const isAuth = ['/login', '/register', '/forgot-password'].includes(location.pathname);

  if (isLanding || isAuth) {
    return (
      <>
        {children}
        {isLanding && <Footer />}
      </>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 px-4 py-6 md:px-8 max-w-5xl mx-auto w-full">
          {children}
        </main>
      </div>
      <BottomNav />
    </div>
  );
};


// ==============================
// Core App (com proteção)
// ==============================
function AppContent() {
  const { setUser, setSyncStatus } = useDriverStore();
  const [isAuthReady, setIsAuthReady] = React.useState(false);

  // 🔥 LIMPEZA DE CACHE + SERVICE WORKER (CRÍTICO)
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((registration) => {
          registration.unregister().catch((err) => {
            console.error('[App] Failed to unregister SW:', err);
          });
        });
      });
    }

    if ('caches' in window) {
      caches.keys().then((keys) => {
        keys.forEach((key) => {
          caches.delete(key).catch((err) => {
            console.error('[App] Failed to delete cache:', err);
          });
        });
      });
    }
  }, []);

  // 🔐 AUTH FLOW
  useEffect(() => {
    if (!isSupabaseConfigured) {
      setIsAuthReady(true);
      return;
    }

    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error('[App] Auth session error:', error.message);

          if (
            error.message.includes('Refresh Token Not Found') ||
            error.message.includes('refresh_token_not_found') ||
            error.message.includes('Invalid Refresh Token')
          ) {
            await supabase.auth.signOut();
            setUser(null);
          }

        } else if (session?.user) {
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

      } catch (err) {
        console.error('[App] Unexpected auth error:', err);
      } finally {
        setIsAuthReady(true);
      }
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
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

      setIsAuthReady(true);
    });

    return () => subscription.unsubscribe();

  }, [setUser, setSyncStatus]);

  // ⏳ LOADING
  if (!isAuthReady) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    );
  }

  // 🚀 APP
  return (
    <Router>
      <SyncManager />

      <Layout>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* PROTEGIDAS */}
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/faturamento" element={<ProtectedRoute><Faturamento /></ProtectedRoute>} />
          <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </Router>
  );
}


// ==============================
// ERROR BOUNDARY (ANTI TELA BRANCA)
// ==============================
class ErrorBoundary extends React.Component<any, { hasError: boolean }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: any) {
    console.error('[App] Critical error:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-950 text-white text-center p-6">
          <h1 className="text-xl font-bold mb-2">Erro ao carregar o app</h1>
          <p className="text-sm text-zinc-400 mb-4">
            Tente atualizar a página
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-emerald-500 text-black px-4 py-2 rounded-xl font-bold"
          >
            Recarregar
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}


// ==============================
// EXPORT FINAL
// ==============================
export default function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}