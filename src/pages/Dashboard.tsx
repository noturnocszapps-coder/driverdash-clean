import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDriverStore } from '../store';
import { formatCurrency, formatKm, cn } from '../utils';
import { Card, CardContent, Button, Select } from '../components/UI';
import { TrendingUp, TrendingDown, DollarSign, Clock, MapPin, Target, Zap, Package, MapPin as MapPinIcon, Filter, LayoutGrid, Layers, Navigation } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { startOfDay, isSameDay, parseISO, subDays, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { isSupabaseConfigured } from '../lib/supabase';
import { AlertCircle } from 'lucide-react';
import { PlatformType } from '../types';

const PLATFORM_LABELS: Record<string, string> = {
  uber_car: 'Uber (Carro)',
  noventanove_car: '99 (Carro)',
  indrive_car: 'inDrive (Carro)',
  uber_moto: 'Uber Moto',
  noventanove_moto: '99 Moto',
  indrive_moto: 'inDrive Moto',
  ifood: 'iFood',
  shopee: 'Shopee',
  mercadolivre: 'Mercado Livre'
};

export const Dashboard = () => {
  const { rides, workLogs, expenses, settings, faturamentoLogs } = useDriverStore();
  const [filterPlatform, setFilterPlatform] = useState<PlatformType | 'all'>('all');
  const navigate = useNavigate();

  const today = startOfDay(new Date());
  
  // Normalize legacy rides to workLogs format for calculation
  const normalizedRides = useMemo(() => rides.map(r => ({
    id: r.id,
    user_id: '',
    platform_type: (r.app === 'Uber' ? 'uber_car' : r.app === '99' ? 'noventanove_car' : 'indrive_car') as PlatformType,
    date: r.date,
    gross_amount: r.grossValue,
    passenger_cash_amount: r.passengerPaid || 0,
    tips_amount: r.tips,
    bonus_amount: r.bonus,
    hours_worked: r.onlineHours,
    km_driven: r.kmDriven,
    created_at: r.date
  })), [rides]);

  const allLogs = useMemo(() => [...normalizedRides, ...workLogs], [normalizedRides, workLogs]);

  const todayFaturamento = useMemo(() => 
    faturamentoLogs.filter(l => isSameDay(parseISO(l.date), today)),
  [faturamentoLogs, today]);

  const filteredLogs = useMemo(() => {
    if (filterPlatform === 'all') return allLogs;
    return allLogs.filter(l => l.platform_type === filterPlatform);
  }, [allLogs, filterPlatform]);

  const todayLogs = filteredLogs.filter(l => isSameDay(parseISO(l.date), today));
  const todayExpenses = expenses.filter(e => isSameDay(parseISO(e.date), today));

  const faturamentoRevenue = todayFaturamento.reduce((acc, l) => {
    if (filterPlatform === 'all') {
      return acc + l.uber_amount + l.noventanove_amount + l.indriver_amount + l.extra_amount;
    }
    
    let amount = 0;
    if (filterPlatform.startsWith('uber')) amount += l.uber_amount;
    if (filterPlatform.startsWith('noventanove')) amount += l.noventanove_amount;
    if (filterPlatform.startsWith('indrive')) amount += l.indriver_amount;
    
    return acc + amount;
  }, 0);
  
  const faturamentoExpenses = todayFaturamento.reduce((acc, l) => {
    if (filterPlatform === 'all') {
      return acc + l.fuel_total + l.additional_expense;
    }
    const hasPlatform = 
      (filterPlatform.startsWith('uber') && l.uber_amount > 0) ||
      (filterPlatform.startsWith('noventanove') && l.noventanove_amount > 0) ||
      (filterPlatform.startsWith('indrive') && l.indriver_amount > 0);
    
    return hasPlatform ? acc + l.fuel_total + l.additional_expense : acc;
  }, 0);

  const grossRevenue = todayLogs.reduce((acc, l) => acc + l.gross_amount + l.tips_amount + l.bonus_amount, 0) + faturamentoRevenue;
  const totalExtraExpenses = todayLogs.reduce((acc, l) => acc + (l.extra_expenses || 0), 0);
  const totalExpenses = todayExpenses.reduce((acc, e) => acc + e.value, 0) + totalExtraExpenses + faturamentoExpenses;
  const netProfit = grossRevenue - totalExpenses;
  
  const totalHours = todayLogs.reduce((acc, l) => acc + l.hours_worked, 0) + todayFaturamento.reduce((acc, l) => acc + l.active_hours_total, 0);
  const totalKm = todayLogs.reduce((acc, l) => acc + l.km_driven, 0) + todayFaturamento.reduce((acc, l) => acc + l.km_total, 0);
  const totalPackages = todayLogs.reduce((acc, l) => acc + (l.packages_count || 0), 0);
  const totalTasks = todayLogs.reduce((acc, l) => acc + (l.deliveries_count || 0) + (l.rides_count || 0) + (l.packages_count || 0), 0);

  const hourlyGain = totalHours > 0 ? grossRevenue / totalHours : 0;
  const costPerKm = totalKm > 0 ? totalExpenses / totalKm : 0;
  const valuePerKm = totalKm > 0 ? grossRevenue / totalKm : 0;
  const valuePerPackage = totalPackages > 0 ? grossRevenue / totalPackages : 0;
  
  const progress = Math.min((grossRevenue / settings.dailyGoal) * 100, 100);

  // Best Platform Logic
  const platformStats = useMemo(() => {
    const stats: Record<string, { gross: number; hours: number; count: number }> = {};
    allLogs.forEach(l => {
      if (!stats[l.platform_type]) stats[l.platform_type] = { gross: 0, hours: 0, count: 0 };
      stats[l.platform_type].gross += l.gross_amount + l.tips_amount + l.bonus_amount;
      stats[l.platform_type].hours += l.hours_worked;
      stats[l.platform_type].count++;
    });
    return Object.entries(stats).map(([id, s]) => ({
      id,
      label: PLATFORM_LABELS[id] || id,
      gross: s.gross,
      hourly: s.hours > 0 ? s.gross / s.hours : 0,
      count: s.count
    })).sort((a, b) => b.hourly - a.hourly);
  }, [allLogs]);

  const bestPlatform = platformStats[0];

  // Projection logic
  const historicalAverages = useMemo(() => {
    const totalValue = filteredLogs.reduce((acc, l) => acc + l.gross_amount + l.tips_amount + l.bonus_amount, 0);
    const totalMinutes = filteredLogs.reduce((acc, l) => acc + (l.hours_worked * 60), 0);
    const totalTasks = filteredLogs.reduce((acc, l) => acc + (l.deliveries_count || 0) + (l.rides_count || 0) + (l.packages_count || 0), 0);

    if (totalTasks === 0) return { avgValue: 15, avgTime: 20 };
    
    return {
      avgValue: totalValue / totalTasks,
      avgTime: totalMinutes / totalTasks
    };
  }, [filteredLogs]);

  const remainingRevenue = Math.max(0, settings.dailyGoal - grossRevenue);
  const tasksNeeded = Math.ceil(remainingRevenue / historicalAverages.avgValue);
  const hoursNeeded = (tasksNeeded * historicalAverages.avgTime) / 60;

  // Last 7 days data for chart
  const last7Days = Array.from({ length: 7 }).map((_, i) => {
    const date = subDays(today, 6 - i);
    const dayLogs = filteredLogs.filter(l => isSameDay(parseISO(l.date), date));
    const dayFaturamento = faturamentoLogs.filter(l => isSameDay(parseISO(l.date), date));
    
    const dayFaturamentoRevenue = dayFaturamento.reduce((acc, l) => {
      if (filterPlatform === 'all') {
        return acc + l.uber_amount + l.noventanove_amount + l.indriver_amount + l.extra_amount;
      }
      
      let amount = 0;
      if (filterPlatform.startsWith('uber')) amount += l.uber_amount;
      if (filterPlatform.startsWith('noventanove')) amount += l.noventanove_amount;
      if (filterPlatform.startsWith('indrive')) amount += l.indriver_amount;
      
      return acc + amount;
    }, 0);
    
    const dayRevenue = dayLogs.reduce((acc, l) => acc + l.gross_amount + l.tips_amount + l.bonus_amount, 0) + dayFaturamentoRevenue;
    
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
          <p className="text-zinc-500">Resumo Multi-Plataforma • {format(today, "dd 'de' MMMM", { locale: ptBR })}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden md:block">
            <Select 
              value={filterPlatform} 
              onChange={e => setFilterPlatform(e.target.value as any)}
              className="w-48 h-10"
            >
              <option value="all">Todas Plataformas</option>
              {settings.activePlatforms?.map(p => (
                <option key={p} value={p}>{PLATFORM_LABELS[p]}</option>
              ))}
            </Select>
          </div>
          <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-500/20 rounded-full flex items-center justify-center text-emerald-600 font-bold">
            {settings.name?.charAt(0) || '?'}
          </div>
        </div>
      </header>

      <div className="md:hidden">
        <Select 
          value={filterPlatform} 
          onChange={e => setFilterPlatform(e.target.value as any)}
          className="w-full"
        >
          <option value="all">Todas Plataformas</option>
          {settings.activePlatforms?.map(p => (
            <option key={p} value={p}>{PLATFORM_LABELS[p]}</option>
          ))}
        </Select>
      </div>

      {!isSupabaseConfigured && (
        <Card className="bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-900/30">
          <CardContent className="p-4 flex items-start gap-3">
            <AlertCircle className="text-amber-600 shrink-0 mt-0.5" size={20} />
            <div>
              <h3 className="text-sm font-bold text-amber-800 dark:text-amber-400">Configuração Pendente</h3>
              <p className="text-xs text-amber-700 dark:text-amber-500 mt-1">
                As chaves do Supabase não foram configuradas. O sistema funcionará apenas com armazenamento local temporário. 
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-3 gap-3">
        <QuickAction 
          label="Faturamento" 
          icon={DollarSign} 
          onClick={() => navigate('/faturamento')}
          color="bg-emerald-600"
        />
        <QuickAction 
          label="Despesa" 
          icon={TrendingDown} 
          onClick={() => navigate('/expenses')}
          color="bg-red-500"
        />
        <QuickAction 
          label="Corrida" 
          icon={Navigation} 
          onClick={() => navigate('/rides')}
          color="bg-blue-500"
        />
      </div>

      {/* Goal Progress */}
      <Card className="bg-emerald-600 text-white border-none">
        <CardContent className="p-6">
          <div className="flex justify-between items-end mb-4">
            <div>
              <p className="text-emerald-100 text-sm font-medium flex items-center gap-1">
                <Target size={16} /> Meta Diária {filterPlatform !== 'all' && `(${PLATFORM_LABELS[filterPlatform]})`}
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

      {/* Best Platform Card */}
      {filterPlatform === 'all' && bestPlatform && (
        <Card className="bg-zinc-900 text-white border-none overflow-hidden relative">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Zap size={80} />
          </div>
          <CardContent className="p-6">
            <h3 className="text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2">Melhor Performance</h3>
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xl font-bold text-emerald-400">{bestPlatform.label}</h4>
                <p className="text-sm text-zinc-400">Média de {formatCurrency(bestPlatform.hourly)}/hora</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">{formatCurrency(bestPlatform.gross)}</p>
                <p className="text-[10px] text-zinc-500 uppercase font-bold">Total Acumulado</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Projection Card */}
      {remainingRevenue > 0 && (
        <Card className="bg-zinc-100 dark:bg-zinc-900 border-none">
          <CardContent className="p-6">
            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Clock size={14} /> Projeção para Meta
            </h3>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                  {tasksNeeded} <span className="text-sm font-normal text-zinc-500">corridas/entregas</span>
                </p>
                <p className="text-xs text-zinc-500">Estimativa baseada no seu histórico</p>
              </div>
              <div className="text-right space-y-1">
                <p className="text-2xl font-bold text-blue-600">
                  {hoursNeeded.toFixed(1)} <span className="text-sm font-normal text-zinc-500">horas</span>
                </p>
                <p className="text-[10px] text-zinc-500 uppercase font-bold">Tempo Restante</p>
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
        <StatCard 
          label="Ganho/Km" 
          value={formatCurrency(valuePerKm)} 
          icon={Navigation} 
          color="text-indigo-500"
          bgColor="bg-indigo-50 dark:bg-indigo-500/10"
        />
        <StatCard 
          label="Total Corridas" 
          value={totalTasks.toString()} 
          icon={Layers} 
          color="text-purple-500"
          bgColor="bg-purple-50 dark:bg-purple-500/10"
        />
        {filterPlatform === 'shopee' && (
          <>
            <StatCard 
              label="Valor/KM" 
              value={formatCurrency(valuePerKm)} 
              icon={Navigation} 
              color="text-indigo-500"
              bgColor="bg-indigo-50 dark:bg-indigo-500/10"
            />
            <StatCard 
              label="Valor/Pacote" 
              value={formatCurrency(valuePerPackage)} 
              icon={Package} 
              color="text-orange-500"
              bgColor="bg-orange-50 dark:bg-orange-500/10"
            />
          </>
        )}
      </div>

      {/* Chart */}
      <Card>
        <CardContent className="p-6">
          <h3 className="font-bold mb-6 flex items-center gap-2">
            <TrendingUp size={20} className="text-emerald-600" />
            Ganhos nos últimos 7 dias {filterPlatform !== 'all' && `(${PLATFORM_LABELS[filterPlatform]})`}
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

      {/* Platform Distribution */}
      {filterPlatform === 'all' && platformStats.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <h3 className="font-bold mb-6 flex items-center gap-2">
              <LayoutGrid size={20} className="text-emerald-600" />
              Distribuição por Plataforma
            </h3>
            <div className="space-y-4">
              {platformStats.map(stat => (
                <div key={stat.id} className="space-y-1">
                  <div className="flex justify-between text-xs font-bold uppercase">
                    <span className="text-zinc-500">{stat.label}</span>
                    <span className="text-zinc-900 dark:text-zinc-100">{formatCurrency(stat.gross)}</span>
                  </div>
                  <div className="h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-emerald-500" 
                      style={{ width: `${(stat.gross / platformStats.reduce((acc, s) => acc + s.gross, 0)) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
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

const QuickAction = ({ label, icon: Icon, onClick, color }: any) => (
  <button 
    onClick={onClick}
    className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-emerald-500 transition-all group"
  >
    <div className={cn("w-12 h-12 rounded-full flex items-center justify-center text-white shadow-lg shadow-emerald-500/10 transition-transform group-active:scale-95", color)}>
      <Icon size={24} />
    </div>
    <span className="text-xs font-bold text-zinc-600 dark:text-zinc-400">{label}</span>
  </button>
);
