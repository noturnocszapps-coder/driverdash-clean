import React, { useMemo, useState } from 'react';
import { useDriverStore } from '../store';
import { formatCurrency, downloadFile, cn } from '../utils';
import { Card, CardContent, Button, Select, Input } from '../components/UI';
import { 
  BarChart3, Download, FileJson, FileSpreadsheet, Sparkles, TrendingUp, TrendingDown, 
  Smartphone, Receipt, Clock, Calendar, Filter, Package, FileText, Car, Bike,
  ChevronRight, ChevronLeft, Search
} from 'lucide-react';
import { 
  startOfDay, startOfWeek, startOfMonth, isWithinInterval, parseISO, endOfDay, 
  endOfWeek, endOfMonth, getDay, format, getHours, subDays, isSameDay
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { PlatformType } from '../types';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

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
  
  const [startDate, setStartDate] = useState<string>(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState<string>(format(endOfDay(new Date()), 'yyyy-MM-dd'));
  const [filterPreset, setFilterPreset] = useState<'today' | 'yesterday' | 'week' | 'month' | 'custom'>('month');

  const setPreset = (preset: 'today' | 'yesterday' | 'week' | 'month') => {
    const now = new Date();
    setFilterPreset(preset);
    if (preset === 'today') {
      setStartDate(format(now, 'yyyy-MM-dd'));
      setEndDate(format(now, 'yyyy-MM-dd'));
    } else if (preset === 'yesterday') {
      const yesterday = subDays(now, 1);
      setStartDate(format(yesterday, 'yyyy-MM-dd'));
      setEndDate(format(yesterday, 'yyyy-MM-dd'));
    } else if (preset === 'week') {
      setStartDate(format(startOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd'));
      setEndDate(format(endOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd'));
    } else if (preset === 'month') {
      setStartDate(format(startOfMonth(now), 'yyyy-MM-dd'));
      setEndDate(format(endOfMonth(now), 'yyyy-MM-dd'));
    }
  };

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
    let logs = allLogs;
    if (filterPlatform !== 'all') {
      logs = logs.filter(l => l.platform_type === filterPlatform);
    }
    return logs.filter(l => {
      const logDate = parseISO(l.date);
      return isWithinInterval(logDate, { 
        start: startOfDay(parseISO(startDate)), 
        end: endOfDay(parseISO(endDate)) 
      });
    });
  }, [allLogs, filterPlatform, startDate, endDate]);

  const filteredFaturamento = useMemo(() => {
    return faturamentoLogs.filter(l => {
      const logDate = parseISO(l.date);
      return isWithinInterval(logDate, { 
        start: startOfDay(parseISO(startDate)), 
        end: endOfDay(parseISO(endDate)) 
      });
    });
  }, [faturamentoLogs, startDate, endDate]);

  const generateReport = (start: Date, end: Date) => {
    const interval = { start, end };
    
    const logsInInterval = allLogs.filter(l => {
      if (filterPlatform !== 'all' && l.platform_type !== filterPlatform) return false;
      return isWithinInterval(parseISO(l.date), interval);
    });
    
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

  const currentReport = useMemo(() => {
    return generateReport(startOfDay(parseISO(startDate)), endOfDay(parseISO(endDate)));
  }, [startDate, endDate, filteredAllLogs, faturamentoLogs, expenses, fuelings, maintenances, filterPlatform]);

  const platformComparison = useMemo(() => {
    const platforms = ['uber', 'noventanove', 'indrive'];
    return platforms.map(p => {
      let revenue = 0;
      let km = 0;
      let hours = 0;
      let expenses = 0;

      // From workLogs
      allLogs.forEach(l => {
        if (l.platform_type.startsWith(p)) {
          revenue += l.gross_amount + l.tips_amount + l.bonus_amount;
          km += l.km_driven;
          hours += l.hours_worked;
        }
      });

      // From faturamentoLogs
      filteredFaturamento.forEach(l => {
        let platRevenue = 0;
        if (p === 'uber') platRevenue = l.uber_amount;
        if (p === 'noventanove') platRevenue = l.noventanove_amount;
        if (p === 'indrive') platRevenue = l.indriver_amount;

        if (platRevenue > 0) {
          revenue += platRevenue;
          // Distribute KM and Hours proportionally if multiple platforms worked
          const totalDayRevenue = l.uber_amount + l.noventanove_amount + l.indriver_amount + l.extra_amount;
          const ratio = totalDayRevenue > 0 ? platRevenue / totalDayRevenue : 0;
          km += l.km_total * ratio;
          hours += l.active_hours_total * ratio;
          expenses += (l.fuel_total + l.additional_expense) * ratio;
        }
      });

      const netProfit = revenue - expenses;

      return {
        id: p,
        name: p === 'uber' ? 'Uber' : p === 'noventanove' ? '99' : 'inDrive',
        revenue,
        netProfit,
        earningsPerHour: hours > 0 ? revenue / hours : 0,
        earningsPerKm: km > 0 ? revenue / km : 0
      };
    });
  }, [filteredAllLogs, filteredFaturamento]);

  const vehicleComparison = useMemo(() => {
    const modes: ('carro' | 'moto')[] = ['carro', 'moto'];
    return modes.map(mode => {
      let revenue = 0;
      let km = 0;
      let hours = 0;
      let expenses = 0;

      // From workLogs (we need to map platform_type to vehicle mode)
      filteredAllLogs.forEach(l => {
        const isMoto = l.platform_type.endsWith('_moto');
        const isCar = l.platform_type.endsWith('_car');
        
        if ((mode === 'moto' && isMoto) || (mode === 'carro' && isCar)) {
          revenue += l.gross_amount + l.tips_amount + l.bonus_amount;
          km += l.km_driven;
          hours += l.hours_worked;
        }
      });

      // From faturamentoLogs
      filteredFaturamento.forEach(l => {
        if (l.vehicle_mode === mode) {
          revenue += l.uber_amount + l.noventanove_amount + l.indriver_amount + l.extra_amount;
          km += l.km_total;
          hours += l.active_hours_total;
          expenses += l.fuel_total + l.additional_expense;
        }
      });

      return {
        mode,
        name: mode === 'carro' ? 'Carro' : 'Moto',
        revenue,
        netProfit: revenue - expenses,
        km,
        hours
      };
    });
  }, [filteredAllLogs, filteredFaturamento]);

  const exportExcel = () => {
    const data = [
      ['Relatório DriverDash'],
      ['Período', `${startDate} até ${endDate}`],
      [],
      ['Resumo Geral'],
      ['Bruto', currentReport.gross],
      ['Despesas', currentReport.totalExp],
      ['Líquido', currentReport.net],
      ['KM', currentReport.km],
      ['Horas', currentReport.hours],
      [],
      ['Lançamentos'],
      ['Data', 'Tipo', 'Plataforma', 'Valor', 'KM', 'Horas'],
      ...currentReport.logs.map(l => [l.date, 'Trabalho', PLATFORM_LABELS[l.platform_type] || l.platform_type, l.gross_amount + l.tips_amount + l.bonus_amount, l.km_driven, l.hours_worked]),
      ...currentReport.faturamento.map(l => [l.date, 'Faturamento', l.vehicle_mode, l.uber_amount + l.noventanove_amount + l.indriver_amount + l.extra_amount, l.km_total, l.active_hours_total])
    ];

    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Relatório");
    XLSX.writeFile(wb, `relatorio-driverdash-${startDate}-a-${endDate}.xlsx`);
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text('Relatório DriverDash', 14, 15);
    doc.setFontSize(10);
    doc.text(`Período: ${startDate} até ${endDate}`, 14, 22);

    const summaryData = [
      ['Bruto', formatCurrency(currentReport.gross)],
      ['Despesas', formatCurrency(currentReport.totalExp)],
      ['Líquido', formatCurrency(currentReport.net)],
      ['KM', `${currentReport.km} km`],
      ['Horas', `${currentReport.hours}h`]
    ];

    (doc as any).autoTable({
      startY: 30,
      head: [['Métrica', 'Valor']],
      body: summaryData,
    });

    const tableData = [
      ...currentReport.logs.map(l => [l.date, PLATFORM_LABELS[l.platform_type] || l.platform_type, formatCurrency(l.gross_amount + l.tips_amount + l.bonus_amount), `${l.km_driven}km`, `${l.hours_worked}h`]),
      ...currentReport.faturamento.map(l => [l.date, `Faturamento (${l.vehicle_mode})`, formatCurrency(l.uber_amount + l.noventanove_amount + l.indriver_amount + l.extra_amount), `${l.km_total}km`, `${l.active_hours_total}h`])
    ];

    (doc as any).autoTable({
      startY: (doc as any).lastAutoTable.finalY + 10,
      head: [['Data', 'Plataforma/Modo', 'Valor', 'KM', 'Horas']],
      body: tableData,
    });

    doc.save(`relatorio-driverdash-${startDate}-a-${endDate}.pdf`);
  };

  const exportCSV = () => {
    const headers = ['Data', 'Tipo', 'Plataforma', 'Valor', 'KM', 'Horas'];
    const rows = [
      ...currentReport.logs.map(l => [l.date, 'Trabalho', PLATFORM_LABELS[l.platform_type] || l.platform_type, l.gross_amount + l.tips_amount + l.bonus_amount, l.km_driven, l.hours_worked]),
      ...currentReport.faturamento.map(l => [l.date, 'Faturamento', l.vehicle_mode, l.uber_amount + l.noventanove_amount + l.indriver_amount + l.extra_amount, l.km_total, l.active_hours_total])
    ];
    
    const csvContent = [headers, ...rows].map(e => e.join(',')).join('\n');
    downloadFile(csvContent, `relatorio-driverdash-${startDate}-a-${endDate}.csv`, 'text/csv');
  };

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      <header className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Relatórios Avançados</h1>
          <p className="text-zinc-500">Análise detalhada e comparativos</p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Button 
            variant={filterPreset === 'today' ? 'primary' : 'outline'} 
            onClick={() => setPreset('today')}
            className="text-xs h-9 px-3"
          >
            Hoje
          </Button>
          <Button 
            variant={filterPreset === 'yesterday' ? 'primary' : 'outline'} 
            onClick={() => setPreset('yesterday')}
            className="text-xs h-9 px-3"
          >
            Ontem
          </Button>
          <Button 
            variant={filterPreset === 'week' ? 'primary' : 'outline'} 
            onClick={() => setPreset('week')}
            className="text-xs h-9 px-3"
          >
            Semana
          </Button>
          <Button 
            variant={filterPreset === 'month' ? 'primary' : 'outline'} 
            onClick={() => setPreset('month')}
            className="text-xs h-9 px-3"
          >
            Mês
          </Button>
        </div>
      </header>

      <Card>
        <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 space-y-1">
            <label className="text-[10px] font-bold text-zinc-500 uppercase">Início</label>
            <Input 
              type="date" 
              value={startDate} 
              onChange={e => {
                setStartDate(e.target.value);
                setFilterPreset('custom');
              }} 
            />
          </div>
          <div className="flex-1 space-y-1">
            <label className="text-[10px] font-bold text-zinc-500 uppercase">Fim</label>
            <Input 
              type="date" 
              value={endDate} 
              onChange={e => {
                setEndDate(e.target.value);
                setFilterPreset('custom');
              }} 
            />
          </div>
          <div className="flex-1 space-y-1">
            <label className="text-[10px] font-bold text-zinc-500 uppercase">Plataforma</label>
            <Select 
              value={filterPlatform} 
              onChange={e => setFilterPlatform(e.target.value as any)}
            >
              <option value="all">Todas</option>
              {settings.activePlatforms?.map(p => (
                <option key={p} value={p}>{PLATFORM_LABELS[p]}</option>
              ))}
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Bruto" value={formatCurrency(currentReport.gross)} icon={TrendingUp} color="text-emerald-500" />
        <StatCard label="Líquido" value={formatCurrency(currentReport.net)} icon={Sparkles} color="text-blue-500" />
        <StatCard label="KM Total" value={`${currentReport.km.toFixed(1)} km`} icon={TrendingDown} color="text-orange-500" />
        <StatCard label="Horas" value={`${currentReport.hours.toFixed(1)}h`} icon={Clock} color="text-purple-500" />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-6">
            <h3 className="font-bold mb-6 flex items-center gap-2">
              <Smartphone size={20} className="text-emerald-600" />
              Comparativo por Plataforma
            </h3>
            <div className="space-y-4">
              {platformComparison.map(plat => (
                <div key={plat.id} className="p-4 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
                  <div className="flex justify-between items-center mb-3">
                    <span className="font-bold text-lg">{plat.name}</span>
                    <span className="text-emerald-500 font-bold">{formatCurrency(plat.revenue)}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] text-zinc-500 uppercase font-bold">Lucro Líquido</p>
                      <p className="font-semibold text-sm">{formatCurrency(plat.netProfit)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-zinc-500 uppercase font-bold">Ganho / Hora</p>
                      <p className="font-semibold text-sm">{formatCurrency(plat.earningsPerHour)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-zinc-500 uppercase font-bold">Ganho / KM</p>
                      <p className="font-semibold text-sm">{formatCurrency(plat.earningsPerKm)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h3 className="font-bold mb-6 flex items-center gap-2">
              <Car size={20} className="text-emerald-600" />
              Comparativo por Veículo
            </h3>
            <div className="space-y-4">
              {vehicleComparison.map(veh => (
                <div key={veh.mode} className="p-4 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-2">
                      {veh.mode === 'carro' ? <Car size={20} /> : <Bike size={20} />}
                      <span className="font-bold text-lg">{veh.name}</span>
                    </div>
                    <span className="text-emerald-500 font-bold">{formatCurrency(veh.revenue)}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] text-zinc-500 uppercase font-bold">Lucro Líquido</p>
                      <p className="font-semibold text-sm">{formatCurrency(veh.netProfit)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-zinc-500 uppercase font-bold">KM Rodados</p>
                      <p className="font-semibold text-sm">{veh.km.toFixed(1)} km</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-zinc-500 uppercase font-bold">Horas Trabalhadas</p>
                      <p className="font-semibold text-sm">{veh.hours.toFixed(1)}h</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-6">
          <h3 className="font-bold mb-4 flex items-center gap-2">
            <Download size={20} className="text-emerald-600" />
            Exportar Relatório ({filterPreset === 'custom' ? 'Personalizado' : filterPreset})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" onClick={exportCSV} className="h-14 gap-3">
              <FileText size={20} className="text-blue-500" /> 
              <div className="text-left">
                <p className="text-sm font-bold">CSV</p>
                <p className="text-[10px] text-zinc-500">Planilha simples</p>
              </div>
            </Button>
            <Button variant="outline" onClick={exportExcel} className="h-14 gap-3">
              <FileSpreadsheet size={20} className="text-emerald-500" />
              <div className="text-left">
                <p className="text-sm font-bold">Excel</p>
                <p className="text-[10px] text-zinc-500">Formato .xlsx</p>
              </div>
            </Button>
            <Button variant="outline" onClick={exportPDF} className="h-14 gap-3">
              <FileText size={20} className="text-red-500" />
              <div className="text-left">
                <p className="text-sm font-bold">PDF</p>
                <p className="text-[10px] text-zinc-500">Documento pronto</p>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const StatCard = ({ label, value, icon: Icon, color }: any) => (
  <Card className="p-4">
    <div className="flex justify-between items-start mb-2">
      <div className={cn("p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800", color)}>
        <Icon size={18} />
      </div>
    </div>
    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">{label}</p>
    <p className="text-lg font-bold truncate">{value}</p>
  </Card>
);
