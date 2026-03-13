import React, { useMemo, useState } from 'react';
import { useDriverStore } from '../store';
import { formatCurrency, downloadFile } from '../utils';
import { Card, CardContent, Button, Select } from '../components/UI';
import { BarChart3, Download, FileJson, FileSpreadsheet, Sparkles, TrendingUp, TrendingDown, Smartphone, Receipt, Clock, Calendar, Filter, Package } from 'lucide-react';
import { startOfDay, startOfWeek, startOfMonth, isWithinInterval, parseISO, endOfDay, endOfWeek, endOfMonth, getDay, format, getHours } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
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

export const Reports = () => {
  const { rides, workLogs, expenses, fuelings, maintenances, settings, faturamentoLogs } = useDriverStore();
  const [filterPlatform, setFilterPlatform] = useState<PlatformType | 'all'>('all');

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

  const filteredAllLogs = useMemo(() => {
    if (filterPlatform === 'all') return allLogs;
    return allLogs.filter(l => l.platform_type === filterPlatform);
  }, [allLogs, filterPlatform]);

  const generateReport = (start: Date, end: Date) => {
    const interval = { start, end };
    
    const logsInInterval = filteredAllLogs.filter(l => isWithinInterval(parseISO(l.date), interval));
    const faturamentoInInterval = faturamentoLogs.filter(l => isWithinInterval(parseISO(l.date), interval));
    const filteredExpenses = expenses.filter(e => isWithinInterval(parseISO(e.date), interval));
    const filteredFuelings = fuelings.filter(f => isWithinInterval(parseISO(f.date), interval));
    const filteredMaintenances = maintenances.filter(m => isWithinInterval(parseISO(m.date), interval));

    const faturamentoGross = faturamentoInInterval.reduce((acc, l) => {
      if (filterPlatform === 'all') {
        return acc + l.uber_amount + l.noventanove_amount + l.indriver_amount + l.extra_amount;
      }
      
      let amount = 0;
      if (filterPlatform.startsWith('uber')) amount += l.uber_amount;
      if (filterPlatform.startsWith('noventanove')) amount += l.noventanove_amount;
      if (filterPlatform.startsWith('indrive')) amount += l.indriver_amount;
      
      return acc + amount;
    }, 0);
    
    const faturamentoExp = faturamentoInInterval.reduce((acc, l) => {
      if (filterPlatform === 'all') {
        return acc + l.fuel_total + l.additional_expense;
      }
      // If filtering by platform, expenses are harder to attribute, 
      // but we can show them if the platform was part of that day's work.
      const hasPlatform = 
        (filterPlatform.startsWith('uber') && l.uber_amount > 0) ||
        (filterPlatform.startsWith('noventanove') && l.noventanove_amount > 0) ||
        (filterPlatform.startsWith('indrive') && l.indriver_amount > 0);
      
      return hasPlatform ? acc + l.fuel_total + l.additional_expense : acc;
    }, 0);

    const gross = logsInInterval.reduce((acc, l) => acc + l.gross_amount + l.tips_amount + l.bonus_amount, 0) + faturamentoGross;
    const extraExp = logsInInterval.reduce((acc, l) => acc + (l.extra_expenses || 0), 0);
    const exp = filteredExpenses.reduce((acc, e) => acc + e.value, 0);
    const fuel = filteredFuelings.reduce((acc, f) => acc + f.value, 0);
    const maint = filteredMaintenances.reduce((acc, m) => acc + m.value, 0);
    
    const totalExp = exp + fuel + maint + extraExp + faturamentoExp;
    const net = gross - totalExp;
    const km = logsInInterval.reduce((acc, l) => acc + l.km_driven, 0) + faturamentoInInterval.reduce((acc, l) => acc + l.km_total, 0);
    const hours = logsInInterval.reduce((acc, l) => acc + l.hours_worked, 0) + faturamentoInInterval.reduce((acc, l) => acc + l.active_hours_total, 0);
    const tasks = logsInInterval.reduce((acc, l) => acc + (l.deliveries_count || 0) + (l.rides_count || 0) + (l.packages_count || 0), 0);

    return { 
      gross, 
      totalExp, 
      net, 
      km, 
      hours, 
      tasks,
      count: logsInInterval.length + faturamentoInInterval.length,
      logs: logsInInterval,
      faturamento: faturamentoInInterval,
      expenses: filteredExpenses,
      fuelings: filteredFuelings,
      maintenances: filteredMaintenances
    };
  };

  const today = new Date();
  const daily = generateReport(startOfDay(today), endOfDay(today));
  const weekly = generateReport(startOfWeek(today), endOfWeek(today));
  const monthly = generateReport(startOfMonth(today), endOfMonth(today));

  const shopeeStats = useMemo(() => {
    if (filterPlatform !== 'shopee') return null;
    
    const shopeeLogs = filteredAllLogs.filter(l => l.platform_type === 'shopee');
    if (shopeeLogs.length === 0) return null;

    const totalGross = shopeeLogs.reduce((acc, l) => acc + l.gross_amount + l.tips_amount + l.bonus_amount, 0);
    const totalKm = shopeeLogs.reduce((acc, l) => acc + l.km_driven, 0);
    const totalPackages = shopeeLogs.reduce((acc, l) => acc + (l.packages_count || 0), 0);
    const totalHours = shopeeLogs.reduce((acc, l) => acc + l.hours_worked, 0);
    const totalRoutes = shopeeLogs.reduce((acc, l) => acc + (l.routes_count || 0), 0);

    const vehicleComparison = {
      Passeio: { gross: 0, count: 0 },
      Fiorino: { gross: 0, count: 0 }
    };

    shopeeLogs.forEach(l => {
      if (l.vehicle_type && vehicleComparison[l.vehicle_type]) {
        vehicleComparison[l.vehicle_type].gross += l.gross_amount + l.tips_amount + l.bonus_amount;
        vehicleComparison[l.vehicle_type].count++;
      }
    });

    return {
      avgPerRoute: totalRoutes > 0 ? totalGross / totalRoutes : 0,
      avgPerPackage: totalPackages > 0 ? totalGross / totalPackages : 0,
      avgPerKm: totalKm > 0 ? totalGross / totalKm : 0,
      avgPerHour: totalHours > 0 ? totalGross / totalHours : 0,
      vehicleComparison
    };
  }, [filteredAllLogs, filterPlatform]);

  const weeklyInsights = useMemo(() => {
    if (weekly.logs.length === 0 && weekly.faturamento.length === 0) return null;

    // Best/Worst Day
    const dayStats: Record<number, number> = {};
    weekly.logs.forEach(l => {
      const day = getDay(parseISO(l.date));
      dayStats[day] = (dayStats[day] || 0) + (l.gross_amount + l.tips_amount + l.bonus_amount);
    });
    weekly.faturamento.forEach(l => {
      const day = getDay(parseISO(l.date));
      dayStats[day] = (dayStats[day] || 0) + (l.uber_amount + l.noventanove_amount + l.indriver_amount + l.extra_amount);
    });

    const sortedDays = Object.entries(dayStats).sort((a, b) => b[1] - a[1]);
    const bestDayIndex = sortedDays.length > 0 ? Number(sortedDays[0][0]) : -1;
    
    const dayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    const bestDay = bestDayIndex !== -1 ? dayNames[bestDayIndex] : 'N/A';

    // Best Platform
    const platformStats: Record<string, { revenue: number, hours: number }> = {};
    weekly.logs.forEach(l => {
      if (!platformStats[l.platform_type]) platformStats[l.platform_type] = { revenue: 0, hours: 0 };
      platformStats[l.platform_type].revenue += (l.gross_amount + l.tips_amount + l.bonus_amount);
      platformStats[l.platform_type].hours += l.hours_worked;
    });

    const bestPlatArr = Object.entries(platformStats)
      .map(([id, stats]) => ({ id, label: PLATFORM_LABELS[id] || id, hourly: stats.hours > 0 ? stats.revenue / stats.hours : 0 }))
      .sort((a, b) => b.hourly - a.hourly);
    const bestPlat = bestPlatArr[0];

    // Top Expense Category
    const expenseStats: Record<string, number> = {};
    weekly.expenses.forEach(e => {
      expenseStats[e.category] = (expenseStats[e.category] || 0) + e.value;
    });
    const fuelTotal = weekly.fuelings.reduce((acc, f) => acc + f.value, 0);
    const maintTotal = weekly.maintenances.reduce((acc, m) => acc + m.value, 0);
    
    expenseStats['combustível'] = (expenseStats['combustível'] || 0) + fuelTotal;
    expenseStats['manutenção'] = (expenseStats['manutenção'] || 0) + maintTotal;

    const topExpense = Object.entries(expenseStats).sort((a, b) => b[1] - a[1])[0];
    const fuelPercent = weekly.gross > 0 ? (fuelTotal / weekly.gross) * 100 : 0;

    return {
      bestDay,
      bestApp: bestPlat?.label || 'N/A',
      topExpense: topExpense?.[0] || 'N/A',
      avgHourly: weekly.hours > 0 ? weekly.gross / weekly.hours : 0,
      fuelPercent
    };
  }, [weekly]);

  const heatmapData = useMemo(() => {
    const days = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
    const stats = days.map((day, index) => {
      const dayIndex = (index + 1) % 7; // Adjust for getDay (0=Sun, 1=Mon...)
      const dayLogs = filteredAllLogs.filter(l => getDay(parseISO(l.date)) === dayIndex);
      const dayFaturamento = faturamentoLogs.filter(l => getDay(parseISO(l.date)) === dayIndex);
      
      const total = dayLogs.reduce((acc, l) => acc + l.gross_amount + l.tips_amount + l.bonus_amount, 0) +
                    dayFaturamento.reduce((acc, l) => acc + l.uber_amount + l.noventanove_amount + l.indriver_amount + l.extra_amount, 0);
      
      const count = dayLogs.length + dayFaturamento.length;
      const avg = count > 0 ? total / count : 0;
      return { name: day, value: avg, total };
    });
    return stats;
  }, [filteredAllLogs, faturamentoLogs]);

  const exportCSV = () => {
    const headers = ['Data', 'Tipo', 'Plataforma', 'Descrição', 'Valor', 'Corridas/Entregas', 'KM', 'Horas', 'Veículo', 'Despesas Extras', 'Faixa KM Shopee'];
    const rows = [
      ...allLogs.map(l => [
        l.date, 
        'Lançamento', 
        PLATFORM_LABELS[l.platform_type] || l.platform_type, 
        'Faturamento', 
        l.gross_amount + l.tips_amount + l.bonus_amount,
        (l.deliveries_count || 0) + (l.rides_count || 0) + (l.packages_count || 0),
        l.km_driven,
        l.hours_worked,
        l.vehicle_type || '',
        l.extra_expenses || 0,
        l.shopee_km_bracket || ''
      ]),
      ...faturamentoLogs.map(l => [
        l.date,
        'Faturamento Simplificado',
        'Multi-Plataforma',
        `Uber: ${l.uber_amount}, 99: ${l.noventanove_amount}, inDrive: ${l.indriver_amount}`,
        l.uber_amount + l.noventanove_amount + l.indriver_amount + l.extra_amount,
        '',
        l.km_total,
        l.active_hours_total,
        l.vehicle_mode,
        l.fuel_total + l.additional_expense,
        ''
      ]),
      ...expenses.map(e => [e.date, 'Despesa', e.category, e.description, e.value, '', '', '', '', '', '']),
      ...fuelings.map(f => [f.date, 'Abastecimento', 'Combustível', `${f.liters}L`, f.value, '', '', '', '', '', '']),
      ...maintenances.map(m => [m.date, 'Manutenção', m.type, 'Oficina', m.value, '', '', '', '', '', '']),
    ];
    
    const csvContent = [headers, ...rows].map(e => e.join(',')).join('\n');
    downloadFile(csvContent, 'driverdash-export.csv', 'text/csv');
  };

  const exportJSON = () => {
    const data = { rides, workLogs, expenses, fuelings, maintenances, faturamentoLogs };
    downloadFile(JSON.stringify(data, null, 2), 'driverdash-export.json', 'application/json');
  };

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Relatórios</h1>
          <p className="text-zinc-500">Análise de desempenho multi-plataforma</p>
        </div>
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

      {weeklyInsights && (
        <Card className="bg-zinc-900 text-white border-none overflow-hidden relative">
          <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
            <Sparkles size={120} />
          </div>
          <CardContent className="p-6 relative z-10">
            <h3 className="text-emerald-400 font-bold text-xs uppercase tracking-widest mb-4 flex items-center gap-2">
              <Sparkles size={14} />
              Assistente Inteligente
            </h3>
            <div className="space-y-2 mb-6">
              <p className="text-lg font-medium leading-relaxed">
                Nesta semana seu melhor resultado foi no <span className="text-emerald-400 font-bold">{weeklyInsights.bestDay}</span>. 
              </p>
              <p className="text-sm text-zinc-400">
                Combustível representou <span className="text-red-400 font-bold">{weeklyInsights.fuelPercent.toFixed(1)}%</span> dos seus ganhos brutos.
                A plataforma <span className="text-blue-400 font-bold">{weeklyInsights.bestApp}</span> teve a melhor rentabilidade horária.
              </p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-white/10">
              <InsightMiniCard icon={TrendingUp} label="Melhor Dia" value={weeklyInsights.bestDay} color="text-emerald-400" />
              <InsightMiniCard icon={Smartphone} label="Melhor Plataforma" value={weeklyInsights.bestApp} color="text-blue-400" />
              <InsightMiniCard icon={Receipt} label="Maior Gasto" value={weeklyInsights.topExpense} color="text-red-400" />
              <InsightMiniCard icon={Clock} label="Ganho/Hora" value={formatCurrency(weeklyInsights.avgHourly)} color="text-orange-400" />
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid md:grid-cols-1 gap-6">
        <Card>
          <CardContent className="p-6">
            <h3 className="font-bold mb-6 flex items-center gap-2">
              <Calendar size={20} className="text-emerald-600" />
              Heatmap: Ganhos Médios por Dia {filterPlatform !== 'all' && `(${PLATFORM_LABELS[filterPlatform]})`}
            </h3>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={heatmapData}>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                  <YAxis hide />
                  <Tooltip 
                    cursor={{ fill: 'transparent' }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-zinc-900 text-white p-2 rounded-lg text-xs shadow-xl">
                            Média: {formatCurrency(payload[0].value as number)}
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {heatmapData.map((entry, index) => {
                      const max = Math.max(...heatmapData.map(d => d.value));
                      const min = Math.min(...heatmapData.map(d => d.value));
                      let fill = '#facc15'; // Amarelo (médio)
                      if (entry.value === max && max > 0) fill = '#10b981'; // Verde (maior)
                      if (entry.value === min && min < max) fill = '#ef4444'; // Vermelho (menor)
                      return <Cell key={`cell-${index}`} fill={fill} />;
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4">
        <ReportCard title="Hoje" data={daily} />
        <ReportCard title="Esta Semana" data={weekly} />
        <ReportCard title="Este Mês" data={monthly} />
      </div>

      {shopeeStats && (
        <Card className="border-emerald-500/30 bg-emerald-50/30 dark:bg-emerald-900/5">
          <CardContent className="p-6">
            <h3 className="font-bold mb-6 flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
              <Package size={20} />
              Métricas Detalhadas Shopee
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
              <div className="space-y-1">
                <p className="text-[10px] text-zinc-500 font-bold uppercase">Média por Rota</p>
                <p className="text-xl font-bold">{formatCurrency(shopeeStats.avgPerRoute)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] text-zinc-500 font-bold uppercase">Média por Pacote</p>
                <p className="text-xl font-bold">{formatCurrency(shopeeStats.avgPerPackage)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] text-zinc-500 font-bold uppercase">Média por KM</p>
                <p className="text-xl font-bold">{formatCurrency(shopeeStats.avgPerKm)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] text-zinc-500 font-bold uppercase">Média por Hora</p>
                <p className="text-xl font-bold">{formatCurrency(shopeeStats.avgPerHour)}</p>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">Comparativo de Veículos</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(shopeeStats.vehicleComparison).map(([type, stats]) => (
                  <div key={type} className="p-4 bg-white dark:bg-zinc-800 rounded-xl border border-zinc-100 dark:border-zinc-700">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-bold">{type}</span>
                      <span className="text-xs text-zinc-500">{(stats as any).count} turnos</span>
                    </div>
                    <div className="flex justify-between items-end">
                      <p className="text-2xl font-bold text-emerald-600">{formatCurrency((stats as any).gross)}</p>
                      <p className="text-[10px] text-zinc-400 uppercase font-bold">Total Bruto</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-6">
          <h3 className="font-bold mb-4 flex items-center gap-2">
            <Download size={20} className="text-emerald-600" />
            Exportar Dados
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <Button variant="outline" onClick={exportCSV} className="h-14">
              <FileSpreadsheet size={20} /> CSV
            </Button>
            <Button variant="outline" onClick={exportJSON} className="h-14">
              <FileJson size={20} /> JSON
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const InsightMiniCard = ({ icon: Icon, label, value, color }: any) => (
  <div>
    <p className="text-[10px] text-zinc-500 font-bold uppercase mb-1">{label}</p>
    <div className="flex items-center gap-2">
      <Icon size={14} className={color} />
      <span className="text-sm font-bold truncate">{value}</span>
    </div>
  </div>
);

const ReportCard = ({ title, data }: any) => (
  <Card>
    <CardContent className="p-6">
      <h3 className="text-lg font-bold mb-4">{title}</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
        <div>
          <p className="text-xs text-zinc-500 uppercase font-bold mb-1">Bruto</p>
          <p className="text-xl font-bold text-emerald-600">{formatCurrency(data.gross)}</p>
        </div>
        <div>
          <p className="text-xs text-zinc-500 uppercase font-bold mb-1">Despesas</p>
          <p className="text-xl font-bold text-red-500">{formatCurrency(data.totalExp)}</p>
        </div>
        <div>
          <p className="text-xs text-zinc-500 uppercase font-bold mb-1">Líquido</p>
          <p className="text-xl font-bold">{formatCurrency(data.net)}</p>
        </div>
        <div>
          <p className="text-xs text-zinc-500 uppercase font-bold mb-1">KM Rodados</p>
          <p className="text-lg font-semibold">{data.km} km</p>
        </div>
        <div>
          <p className="text-xs text-zinc-500 uppercase font-bold mb-1">Horas Online</p>
          <p className="text-lg font-semibold">{data.hours}h</p>
        </div>
        <div>
          <p className="text-xs text-zinc-500 uppercase font-bold mb-1">Corridas/Entregas</p>
          <p className="text-lg font-semibold">{data.tasks}</p>
        </div>
        <div>
          <p className="text-xs text-zinc-500 uppercase font-bold mb-1">Lançamentos</p>
          <p className="text-lg font-semibold">{data.count}</p>
        </div>
      </div>
    </CardContent>
  </Card>
);
