import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Car, Receipt, Fuel, Wrench, BarChart3, Settings, Calculator, Smartphone, Target, Navigation, Gauge, LogOut, LogIn, User } from 'lucide-react';
import { cn } from '../utils';
import { useDriverStore } from '../store';
import { supabase } from '../lib/supabase';
import { SyncIndicator } from './SyncIndicator';
import { Button } from './UI';

const navItems = [
  { icon: LayoutDashboard, label: 'Início', path: '/dashboard' },
  { icon: Target, label: 'Projeção', path: '/projection' },
  { icon: Calculator, label: 'Simulador', path: '/simulator' },
  { icon: Navigation, label: 'Rastrear', path: '/tracking' },
  { icon: Smartphone, label: 'Comparar', path: '/comparison' },
  { icon: Car, label: 'Corridas', path: '/rides' },
  { icon: BarChart3, label: 'Relatórios', path: '/reports' },
  { icon: Gauge, label: 'Custo Carro', path: '/vehicle-costs' },
];

const bottomNavItems = [
  { icon: LayoutDashboard, label: 'Início', path: '/dashboard' },
  { icon: Navigation, label: 'Rastrear', path: '/tracking' },
  { icon: Car, label: 'Corridas', path: '/rides' },
  { icon: BarChart3, label: 'Relatórios', path: '/reports' },
  { icon: Settings, label: 'Ajustes', path: '/settings' },
];

export const BottomNav = () => {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800 px-2 pb-safe pt-2 z-50 md:hidden">
      <div className="flex justify-around items-center max-w-lg mx-auto">
        {bottomNavItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link 
              key={item.path} 
              to={item.path}
              className={cn(
                "flex flex-col items-center gap-1 p-2 rounded-xl transition-colors",
                isActive ? "text-emerald-600" : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
              )}
            >
              <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, setUser } = useDriverStore();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    navigate('/');
  };

  return (
    <aside className="hidden md:flex flex-col w-64 bg-white dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-800 h-screen sticky top-0">
      <div className="p-6 flex flex-col gap-4">
        <h1 className="text-xl font-bold text-emerald-600 flex items-center gap-2">
          <Car className="fill-emerald-600" />
          DriverDash
        </h1>
        <SyncIndicator />
      </div>

      <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link 
              key={item.path} 
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all",
                isActive 
                  ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 font-semibold" 
                  : "text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-zinc-100"
              )}
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 space-y-2">
        {user ? (
          <div className="space-y-2">
            <div className="px-4 py-2 flex items-center gap-3 text-zinc-600 dark:text-zinc-400">
              <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600">
                <User size={16} />
              </div>
              <div className="flex flex-col overflow-hidden">
                <span className="text-sm font-bold truncate">{user.name || 'Motorista'}</span>
                <span className="text-[10px] truncate opacity-60">{user.email}</span>
              </div>
            </div>
            <Link 
              to="/settings"
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all",
                location.pathname === '/settings'
                  ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 font-semibold"
                  : "text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-zinc-100"
              )}
            >
              <Settings size={20} />
              <span>Configurações</span>
            </Link>
            <button 
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-all"
            >
              <LogOut size={20} />
              <span>Sair</span>
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <Link 
              to="/login"
              className="flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition-all"
            >
              <LogIn size={20} />
              <span>Entrar / Sincronizar</span>
            </Link>
            <Link 
              to="/settings"
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all",
                location.pathname === '/settings'
                  ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 font-semibold"
                  : "text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-zinc-100"
              )}
            >
              <Settings size={20} />
              <span>Configurações</span>
            </Link>
          </div>
        )}
      </div>
    </aside>
  );
};
