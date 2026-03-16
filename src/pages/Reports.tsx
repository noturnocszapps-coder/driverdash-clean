import React, { useMemo } from 'react';
import { useDriverStore } from '../store';
import { formatCurrency, cn, calculateDailyFixedCost } from '../utils';
import { Card, CardContent } from '../components/UI';
import { 
  TrendingUp, Calendar, ChevronRight, BarChart3, Award, Zap, Download, Filter
} from 'lucide-react';
import { 
  startOfDay, isSameDay, parseISO, format, subDays, startOfWeek, addDays
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { motion } from 'motion/react';

export const Reports = () => {
  const { cycles, settings } = useDriverStore();
  const dailyFixed = calculateDailyFixedCost(settings.fixedCosts);
  
  const today = startOfDay(new Date());
  
  const currentWeek = useMemo(() => {
    const start = startOfWeek(today, { weekStartsOn: 1 });
    return Array.from({ length: 7 }).map((_, i) => {
      const date = addDays(start, i);
      const dayCycles = cycles.filter(c => isSameDay(parseISO(c.start_time), date));
      const dayRevenue = dayCycles.reduce((acc, c) => acc + c.total_amount, 0);
      const dayExpenses = dayCycles.reduce((acc, c) => acc + (c.total_expenses || 0), 0);
      
      const uber = dayCycles.reduce((acc, c) => acc + c.uber_amount, 0);
      const noventanove = dayCycles.reduce((acc, c) => acc + c.noventanove_amount, 0);
      const indriver = dayCycles.reduce((acc, c) => acc + c.indriver_amount, 0);
      const extra = dayCycles.reduce((acc, c) => acc + c.extra_amount, 0);

      // Only apply fixed cost if there was activity
      const fixedCost = dayRevenue > 0 ? dailyFixed : 0;
      const totalDayExpenses = dayExpenses + fixedCost;

      return {
        name: format(date, 'EEE', { locale: ptBR }),
        fullName: format(date, "dd 'de' MMM", { locale: ptBR }),
        value: dayRevenue,
        expenses: totalDayExpenses,
        profit: dayRevenue - totalDayExpenses,
        uber,
        noventanove,
        indriver,
        extra,
        date: date
      };
    });
  }, [cycles, today, dailyFixed]);

  const stats = useMemo(() => {
    const total = currentWeek.reduce((acc, d) => acc + d.value, 0);
    const totalExpenses = currentWeek.reduce((acc, d) => acc + d.expenses, 0);
    const totalProfit = total - totalExpenses;
    const avg = total / 7;
    const sorted = [...currentWeek].sort((a, b) => b.value - a.value);
    
    const platformTotals = currentWeek.reduce((acc, d) => ({
      uber: acc.uber + d.uber,
      noventanove: acc.noventanove + d.noventanove,
      indriver: acc.indriver + d.indriver,
      extra: acc.extra + d.extra
    }), { uber: 0, noventanove: 0, indriver: 0, extra: 0 });

    return {
      total,
      totalExpenses,
      totalProfit,
      avg,
      best: sorted[0],
      platformTotals
    };
  }, [currentWeek]);

  const recentCycles = useMemo(() => {
    return [...cycles]
      .sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime())
      .slice(0, 15);
  }, [cycles]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 pb-24 md:pb-8"
    >
      <header className="flex justify-between items-center px-1">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-1">Relatórios</p>
          <h1 className="text-3xl font-black tracking-tighter">Análise Semanal</h1>
        </div>
        <div className="flex gap-2">
          <button className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500">
            <Filter size={18} />
          </button>
          <button className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-zinc-950">
            <Download size={18} />
          </button>
        </div>
      </header>

      {/* Weekly Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        <SummaryCard label="Faturado" value={formatCurrency(stats.total)} color="text-zinc-900 dark:text-white" />
        <SummaryCard label="Despesas" value={formatCurrency(stats.totalExpenses)} color="text-red-500" />
        <SummaryCard label="Lucro Total" value={formatCurrency(stats.totalProfit)} color="text-emerald-500" />
      </div>

      {/* Main Chart Card */}
      <Card className="border-none bg-zinc-900 text-white shadow-2xl overflow-hidden">
        <CardContent className="p-8 space-y-8">
          <div className="flex justify-between items-center">
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Faturamento Diário</p>
              <h2 className="text-2xl font-black tracking-tight">{stats.best.fullName} foi seu melhor dia</h2>
            </div>
            <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center border border-emerald-500/20">
              <TrendingUp className="text-emerald-400" size={24} />
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={currentWeek}>
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#52525b', fontWeight: 800 }}
                  dy={10}
                />
                <Tooltip 
                  cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-zinc-950 border border-white/5 p-4 rounded-2xl shadow-2xl space-y-3 min-w-[160px]">
                          <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{data.fullName}</p>
                          <p className="text-xl font-black text-white">{formatCurrency(data.value)}</p>
                          <div className="space-y-2 pt-2 border-t border-white/5">
                            <div className="flex justify-between items-center text-[9px] font-bold">
                              <span className="text-zinc-500 uppercase">Lucro</span>
                              <span className="text-emerald-400">{formatCurrency(data.profit)}</span>
                            </div>
                            <div className="flex justify-between items-center text-[9px] font-bold">
                              <span className="text-zinc-500 uppercase">Despesas</span>
                              <span className="text-red-400">{formatCurrency(data.expenses)}</span>
                            </div>
                            <div className="pt-1" />
                            <TooltipItem label="Uber" value={data.uber} color="bg-white" />
                            <TooltipItem label="99" value={data.noventanove} color="bg-yellow-500" />
                            <TooltipItem label="inDrive" value={data.indriver} color="bg-emerald-500" />
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={32}>
                  {currentWeek.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      className={cn(
                        isSameDay(entry.date, today) ? "fill-emerald-500" : "fill-zinc-800"
                      )}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Platform Breakdown */}
      <Card className="border-none bg-white dark:bg-zinc-900 shadow-sm">
        <CardContent className="p-6 space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="font-black text-sm uppercase tracking-widest flex items-center gap-2">
              <BarChart3 size={16} className="text-emerald-500" />
              Mix de Plataformas
            </h3>
            <span className="text-[10px] font-bold text-zinc-400 uppercase">Últimos 7 dias</span>
          </div>
          
          <div className="space-y-5">
            <PlatformRow label="Uber" value={stats.platformTotals.uber} total={stats.total} color="bg-zinc-900 dark:bg-white" />
            <PlatformRow label="99" value={stats.platformTotals.noventanove} total={stats.total} color="bg-yellow-500" />
            <PlatformRow label="inDrive" value={stats.platformTotals.indriver} total={stats.total} color="bg-emerald-500" />
            <PlatformRow label="Extra / Outros" value={stats.platformTotals.extra} total={stats.total} color="bg-blue-500" />
          </div>
        </CardContent>
      </Card>

      {/* History List */}
      <div className="space-y-4">
        <div className="flex justify-between items-center px-1">
          <h3 className="font-black text-sm uppercase tracking-widest flex items-center gap-2">
            <Calendar size={16} className="text-zinc-400" />
            Histórico Recente
          </h3>
        </div>
        
        <div className="space-y-3">
          {recentCycles.map((cycle) => (
            <Card key={cycle.id} className="border-none bg-white dark:bg-zinc-900 shadow-sm overflow-hidden group active:scale-[0.98] transition-all">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="text-center min-w-[40px]">
                    <p className="text-[9px] font-black text-zinc-400 uppercase">
                      {format(new Date(cycle.start_time), 'MMM', { locale: ptBR })}
                    </p>
                    <p className="text-xl font-black tracking-tighter">
                      {format(new Date(cycle.start_time), 'dd')}
                    </p>
                  </div>
                  <div className="h-8 w-px bg-zinc-100 dark:bg-zinc-800" />
                  <div>
                    <p className="text-sm font-black tracking-tight">{formatCurrency(cycle.total_amount)}</p>
                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                      {format(new Date(cycle.start_time), 'HH:mm')} 
                      {cycle.end_time && ` • ${format(new Date(cycle.end_time), 'HH:mm')}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "px-2 py-1 rounded-full text-[8px] font-black uppercase tracking-widest",
                    cycle.status === 'open' ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400" : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-500"
                  )}>
                    {cycle.status === 'open' ? 'Aberto' : 'Fechado'}
                  </div>
                  <ChevronRight size={16} className="text-zinc-300 group-hover:text-emerald-500 transition-colors" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

const SummaryCard = ({ label, value, color }: any) => (
  <Card className="border-none bg-white dark:bg-zinc-900 shadow-sm">
    <CardContent className="p-4 space-y-1">
      <p className="text-[9px] font-black uppercase text-zinc-400 tracking-widest">{label}</p>
      <p className={cn("text-sm font-black tracking-tight truncate", color)}>{value}</p>
    </CardContent>
  </Card>
);

const PlatformRow = ({ label, value, total, color }: any) => {
  const percent = total > 0 ? (value / total) * 100 : 0;
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-end">
        <span className="text-[10px] font-black text-zinc-400 uppercase tracking-wider">{label}</span>
        <div className="text-right">
          <span className="text-sm font-black tracking-tight">{formatCurrency(value)}</span>
          <span className="text-[10px] text-zinc-400 ml-2 font-black">{percent.toFixed(0)}%</span>
        </div>
      </div>
      <div className="h-1.5 bg-zinc-50 dark:bg-zinc-800 rounded-full overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          className={cn("h-full rounded-full", color)} 
        />
      </div>
    </div>
  );
};

const TooltipItem = ({ label, value, color }: any) => (
  <div className="flex items-center justify-between gap-4">
    <div className="flex items-center gap-1.5">
      <div className={cn("w-1.5 h-1.5 rounded-full", color)} />
      <span className="text-[9px] font-black text-zinc-500 uppercase tracking-wider">{label}</span>
    </div>
    <span className="text-[10px] font-black text-white">{formatCurrency(value)}</span>
  </div>
);
