import React, { useMemo } from 'react';
import { useDriverStore } from '../store';
import { formatCurrency, formatKm, cn } from '../utils';
import { Card, CardContent } from '../components/UI';
import { TrendingUp, TrendingDown, DollarSign, Clock, MapPin, Target } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { startOfDay, isSameDay, parseISO, subDays, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { isSupabaseConfigured } from '../lib/supabase';
import { AlertCircle } from 'lucide-react';

export const Dashboard = () => {
  const { rides, expenses, settings } = useDriverStore();

  const today = startOfDay(new Date());
  
  const todayRides = rides.filter(r => isSameDay(parseISO(r.date), today));
  const todayExpenses = expenses.filter(e => isSameDay(parseISO(e.date), today));

  const grossRevenue = todayRides.reduce((acc, r) => acc + r.grossValue + r.tips + r.bonus, 0);
  const totalExpenses = todayExpenses.reduce((acc, e) => acc + e.value, 0);
  const netProfit = grossRevenue - totalExpenses;
  
  const totalHours = todayRides.reduce((acc, r) => acc + r.onlineHours, 0);
  const totalKm = todayRides.reduce((acc, r) => acc + r.kmDriven, 0);

  const hourlyGain = totalHours > 0 ? grossRevenue / totalHours : 0;
  const costPerKm = totalKm > 0 ? totalExpenses / totalKm : 0;
  
  const progress = Math.min((grossRevenue / settings.dailyGoal) * 100, 100);

  // Projection logic
  const historicalAverages = useMemo(() => {
    if (rides.length === 0) return { avgValue: 15, avgTime: 20 };
    const totalValue = rides.reduce((acc, r) => acc + r.grossValue + r.tips + r.bonus, 0);
    const totalMinutes = rides.reduce((acc, r) => acc + (r.onlineHours * 60), 0);
    return {
      avgValue: totalValue / rides.length,
      avgTime: totalMinutes / rides.length
    };
  }, [rides]);

  const remainingRevenue = Math.max(0, settings.dailyGoal - grossRevenue);
  const ridesNeeded = Math.ceil(remainingRevenue / historicalAverages.avgValue);
  const hoursNeeded = (ridesNeeded * historicalAverages.avgTime) / 60;

  // Last 7 days data for chart
  const last7Days = Array.from({ length: 7 }).map((_, i) => {
    const date = subDays(today, 6 - i);
    const dayRides = rides.filter(r => isSameDay(parseISO(r.date), date));
    const dayRevenue = dayRides.reduce((acc, r) => acc + r.grossValue + r.tips + r.bonus, 0);
    return {
      name: format(date, 'EEE', { locale: ptBR }),
      value: dayRevenue,
      date: date
    };
  });

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Olá, {settings.name}</h1>
          <p className="text-zinc-500">Resumo de hoje, {format(today, "dd 'de' MMMM", { locale: ptBR })}</p>
        </div>
        <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-500/20 rounded-full flex items-center justify-center text-emerald-600 font-bold">
          {settings.name[0]}
        </div>
      </header>

      {!isSupabaseConfigured && (
        <Card className="bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-900/30">
          <CardContent className="p-4 flex items-start gap-3">
            <AlertCircle className="text-amber-600 shrink-0 mt-0.5" size={20} />
            <div>
              <h3 className="text-sm font-bold text-amber-800 dark:text-amber-400">Configuração Pendente</h3>
              <p className="text-xs text-amber-700 dark:text-amber-500 mt-1">
                As chaves do Supabase não foram configuradas. O sistema funcionará apenas com armazenamento local temporário. 
                Para habilitar a sincronização em nuvem e persistência permanente, configure as variáveis de ambiente <code className="bg-amber-100 dark:bg-amber-900/50 px-1 rounded">VITE_SUPABASE_URL</code> e <code className="bg-amber-100 dark:bg-amber-900/50 px-1 rounded">VITE_SUPABASE_ANON_KEY</code>.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Goal Progress */}
      <Card className="bg-emerald-600 text-white border-none">
        <CardContent className="p-6">
          <div className="flex justify-between items-end mb-4">
            <div>
              <p className="text-emerald-100 text-sm font-medium flex items-center gap-1">
                <Target size={16} /> Meta Diária
              </p>
              <h2 className="text-3xl font-bold">{formatCurrency(grossRevenue)}</h2>
            </div>
            <div className="text-right">
              <p className="text-emerald-100 text-sm">Objetivo</p>
              <p className="font-bold">{formatCurrency(settings.dailyGoal)}</p>
            </div>
          </div>
          <div className="h-2 bg-white/20 rounded-full overflow-hidden">
            <div 
              className="h-full bg-white transition-all duration-500" 
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-emerald-100 font-medium">
            {progress >= 100 ? 'Meta batida! Parabéns! 🎉' : `${progress.toFixed(0)}% da meta concluída`}
          </p>
        </CardContent>
      </Card>

      {/* Projection Summary */}
      {!isSameDay(today, today) ? null : ( // Always show for today
        <Card className="border-none bg-zinc-100 dark:bg-zinc-800/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <TrendingUp size={16} className="text-emerald-600" />
                Projeção para bater a meta
              </h3>
              {progress >= 100 && <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold uppercase">Concluído</span>}
            </div>
            
            <div className="grid grid-cols-3 gap-2">
              <div className="text-center p-2 bg-white dark:bg-zinc-800 rounded-lg shadow-sm">
                <p className="text-[10px] text-zinc-500 font-bold uppercase mb-1">Faltam</p>
                <p className="text-sm font-bold text-emerald-600">{formatCurrency(remainingRevenue)}</p>
              </div>
              <div className="text-center p-2 bg-white dark:bg-zinc-800 rounded-lg shadow-sm">
                <p className="text-[10px] text-zinc-500 font-bold uppercase mb-1">Corridas</p>
                <p className="text-sm font-bold">~{progress >= 100 ? 0 : ridesNeeded}</p>
              </div>
              <div className="text-center p-2 bg-white dark:bg-zinc-800 rounded-lg shadow-sm">
                <p className="text-[10px] text-zinc-500 font-bold uppercase mb-1">Tempo</p>
                <p className="text-sm font-bold">~{progress >= 100 ? '0h' : `${Math.floor(hoursNeeded)}h`}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard 
          label="Lucro Líquido" 
          value={formatCurrency(netProfit)} 
          icon={DollarSign} 
          color="text-emerald-600"
          bgColor="bg-emerald-50 dark:bg-emerald-500/10"
        />
        <StatCard 
          label="Despesas" 
          value={formatCurrency(totalExpenses)} 
          icon={TrendingDown} 
          color="text-red-500"
          bgColor="bg-red-50 dark:bg-red-500/10"
        />
        <StatCard 
          label="Ganho/Hora" 
          value={formatCurrency(hourlyGain)} 
          icon={Clock} 
          color="text-blue-500"
          bgColor="bg-blue-50 dark:bg-blue-500/10"
        />
        <StatCard 
          label="Custo/Km" 
          value={formatCurrency(costPerKm)} 
          icon={MapPin} 
          color="text-orange-500"
          bgColor="bg-orange-50 dark:bg-orange-500/10"
        />
      </div>

      {/* Chart */}
      <Card>
        <CardContent className="p-6">
          <h3 className="font-bold mb-6 flex items-center gap-2">
            <TrendingUp size={20} className="text-emerald-600" />
            Ganhos nos últimos 7 dias
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={last7Days}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: '#888' }}
                />
                <YAxis hide />
                <Tooltip 
                  cursor={{ fill: 'transparent' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-zinc-900 text-white p-2 rounded-lg text-xs shadow-xl">
                          {formatCurrency(payload[0].value as number)}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {last7Days.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={isSameDay(entry.date, today) ? '#10b981' : '#e2e8f0'} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const StatCard = ({ label, value, icon: Icon, color, bgColor }: any) => (
  <Card>
    <CardContent className="p-4">
      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-3", bgColor, color)}>
        <Icon size={20} />
      </div>
      <p className="text-xs text-zinc-500 font-medium mb-1">{label}</p>
      <p className="text-lg font-bold truncate">{value}</p>
    </CardContent>
  </Card>
);
