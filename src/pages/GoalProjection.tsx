import React, { useMemo, useState, useEffect } from 'react';
import { useDriverStore } from '../store';
import { formatCurrency, cn } from '../utils';
import { Card, CardContent, Input } from '../components/UI';
import { Target, Clock, Car, DollarSign, TrendingUp, AlertCircle, CheckCircle2 } from 'lucide-react';
import { isToday, parseISO } from 'date-fns';

export const GoalProjection = () => {
  const { rides, settings } = useDriverStore();

  // Get today's data
  const todayRides = useMemo(() => {
    return rides.filter(r => isToday(parseISO(r.date)));
  }, [rides]);

  const todayRevenue = useMemo(() => {
    return todayRides.reduce((acc, r) => acc + r.grossValue + r.tips + r.bonus, 0);
  }, [todayRides]);

  // Calculate historical averages for projection
  const historicalAverages = useMemo(() => {
    if (rides.length === 0) return { avgValue: 15, avgTime: 20 };
    
    const totalValue = rides.reduce((acc, r) => acc + r.grossValue + r.tips + r.bonus, 0);
    const totalMinutes = rides.reduce((acc, r) => acc + (r.onlineHours * 60), 0);
    
    return {
      avgValue: totalValue / rides.length,
      avgTime: totalMinutes / rides.length
    };
  }, [rides]);

  // Editable parameters for projection
  const [params, setParams] = useState({
    avgValue: historicalAverages.avgValue.toFixed(2),
    avgTime: Math.round(historicalAverages.avgTime).toString()
  });

  // Sync with historical data if it changes and user hasn't touched it? 
  // Better to just let them edit.
  
  const projection = useMemo(() => {
    const remainingRevenue = Math.max(0, settings.dailyGoal - todayRevenue);
    const avgValue = Number(params.avgValue) || 1;
    const avgTime = Number(params.avgTime) || 1;

    const ridesNeeded = Math.ceil(remainingRevenue / avgValue);
    const minutesNeeded = ridesNeeded * avgTime;
    const hoursNeeded = minutesNeeded / 60;

    return {
      remainingRevenue,
      ridesNeeded,
      hoursNeeded,
      isGoalReached: todayRevenue >= settings.dailyGoal
    };
  }, [todayRevenue, settings.dailyGoal, params]);

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      <header>
        <h1 className="text-2xl font-bold">Projeção de Meta</h1>
        <p className="text-zinc-500">Quanto falta para encerrar o dia?</p>
      </header>

      {/* Progress Overview */}
      <Card className={projection.isGoalReached ? "bg-emerald-600 text-white border-none" : "bg-zinc-900 text-white border-none"}>
        <CardContent className="p-6">
          <div className="flex justify-between items-end mb-4">
            <div>
              <p className="text-emerald-100/80 text-xs font-bold uppercase tracking-wider">Progresso Atual</p>
              <h2 className="text-3xl font-bold">{formatCurrency(todayRevenue)}</h2>
            </div>
            <div className="text-right">
              <p className="text-emerald-100/80 text-xs font-bold uppercase tracking-wider">Meta Diária</p>
              <p className="text-xl font-bold">{formatCurrency(settings.dailyGoal)}</p>
            </div>
          </div>
          
          <div className="w-full bg-white/10 rounded-full h-3 mb-2">
            <div 
              className="bg-white h-full rounded-full transition-all duration-500" 
              style={{ width: `${Math.min(100, (todayRevenue / settings.dailyGoal) * 100)}%` }}
            />
          </div>
          
          <p className="text-sm text-emerald-100/80">
            {projection.isGoalReached 
              ? "Parabéns! Você atingiu sua meta diária." 
              : `Faltam ${formatCurrency(projection.remainingRevenue)} para atingir sua meta.`}
          </p>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Projection Results */}
        <div className="space-y-4">
          <h3 className="font-bold flex items-center gap-2 px-1">
            <TrendingUp size={20} className="text-emerald-600" />
            Estimativa para completar
          </h3>
          
          <div className="grid grid-cols-1 gap-4">
            <ProjectionCard 
              icon={Car} 
              label="Corridas Necessárias" 
              value={projection.isGoalReached ? "0" : `${projection.ridesNeeded} corridas`}
              subtext={projection.isGoalReached ? "Meta concluída" : `Baseado em R$ ${params.avgValue} por corrida`}
              color="text-blue-500"
            />
            <ProjectionCard 
              icon={Clock} 
              label="Tempo Estimado" 
              value={projection.isGoalReached ? "0h 0m" : `${Math.floor(projection.hoursNeeded)}h ${Math.round((projection.hoursNeeded % 1) * 60)}m`}
              subtext={projection.isGoalReached ? "Pode ir para casa!" : `Baseado em ${params.avgTime} min por corrida`}
              color="text-orange-500"
            />
            <ProjectionCard 
              icon={DollarSign} 
              label="Faturamento Restante" 
              value={formatCurrency(projection.remainingRevenue)}
              subtext="Valor bruto necessário"
              color="text-emerald-500"
            />
          </div>
        </div>

        {/* Adjustments */}
        <Card>
          <CardContent className="p-6 space-y-6">
            <div className="flex items-center gap-2 mb-2">
              <Target size={20} className="text-emerald-600" />
              <h3 className="font-bold">Ajustar Médias</h3>
            </div>
            
            <p className="text-xs text-zinc-500 leading-relaxed">
              As projeções são calculadas com base no seu histórico. Você pode ajustar os valores abaixo para uma estimativa mais precisa baseada no movimento de hoje.
            </p>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-500 uppercase">Valor Médio por Corrida (R$)</label>
                <Input 
                  type="number"
                  value={params.avgValue}
                  onChange={e => setParams(prev => ({ ...prev, avgValue: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-500 uppercase">Tempo Médio por Corrida (min)</label>
                <Input 
                  type="number"
                  value={params.avgTime}
                  onChange={e => setParams(prev => ({ ...prev, avgTime: e.target.value }))}
                />
              </div>
            </div>

            <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl flex gap-3">
              <AlertCircle size={18} className="text-zinc-400 shrink-0" />
              <p className="text-[11px] text-zinc-500 italic">
                Dica: Em dias de chuva ou feriados, o valor médio costuma subir devido ao dinâmico, mas o tempo também aumenta devido ao trânsito.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const ProjectionCard = ({ icon: Icon, label, value, subtext, color }: any) => (
  <Card>
    <CardContent className="p-4 flex items-center gap-4">
      <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center bg-zinc-100 dark:bg-zinc-800", color)}>
        <Icon size={24} />
      </div>
      <div>
        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">{label}</p>
        <p className="text-xl font-bold">{value}</p>
        <p className="text-[10px] text-zinc-400">{subtext}</p>
      </div>
    </CardContent>
  </Card>
);
