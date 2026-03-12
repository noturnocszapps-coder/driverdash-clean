import React, { useMemo } from 'react';
import { useDriverStore } from '../store';
import { formatCurrency, formatKm, cn } from '../utils';
import { Card, CardContent } from '../components/UI';
import { Fuel, Gauge, TrendingUp, TrendingDown, History, AlertCircle } from 'lucide-react';
import { format, parseISO } from 'date-fns';

export const FuelConsumption = () => {
  const { fuelings } = useDriverStore();

  const stats = useMemo(() => {
    if (fuelings.length < 2) return null;

    // Sort fuelings by odometer to calculate differences
    const sortedFuelings = [...fuelings].sort((a, b) => a.odometer - b.odometer);
    
    const consumptions = [];
    let totalKm = 0;
    let totalLiters = 0;
    let totalValue = 0;

    for (let i = 1; i < sortedFuelings.length; i++) {
      const current = sortedFuelings[i];
      const previous = sortedFuelings[i - 1];
      
      const distance = current.odometer - previous.odometer;
      const consumption = distance / current.liters;
      const costPerKm = current.value / distance;

      consumptions.push({
        date: current.date,
        distance,
        liters: current.liters,
        value: current.value,
        kmPerLiter: consumption,
        costPerKm
      });

      totalKm += distance;
      totalLiters += current.liters;
      totalValue += current.value;
    }

    const avgConsumption = totalKm / totalLiters;
    const avgCostPerKm = totalValue / totalKm;
    const avgSpent = totalValue / (sortedFuelings.length - 1);

    const sortedByConsumption = [...consumptions].sort((a, b) => b.kmPerLiter - a.kmPerLiter);
    const bestConsumption = sortedByConsumption[0];
    const worstConsumption = sortedByConsumption[sortedByConsumption.length - 1];

    return {
      history: consumptions.reverse(),
      avgConsumption,
      avgCostPerKm,
      avgSpent,
      bestConsumption,
      worstConsumption
    };
  }, [fuelings]);

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      <header>
        <h1 className="text-2xl font-bold">Consumo Real</h1>
        <p className="text-zinc-500">Eficiência do seu veículo</p>
      </header>

      {!stats ? (
        <Card>
          <CardContent className="p-12 text-center text-zinc-500 space-y-4">
            <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle size={32} className="text-zinc-400" />
            </div>
            <p>Você precisa de pelo menos 2 abastecimentos cadastrados para calcular o consumo real.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Main Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard 
              label="Consumo Médio" 
              value={`${stats.avgConsumption.toFixed(2)} km/l`} 
              icon={Fuel} 
              color="text-emerald-600"
            />
            <StatCard 
              label="Custo por KM" 
              value={formatCurrency(stats.avgCostPerKm)} 
              icon={TrendingUp} 
              color="text-blue-600"
            />
            <StatCard 
              label="Média por Tanque" 
              value={formatCurrency(stats.avgSpent)} 
              icon={Gauge} 
              color="text-orange-600"
            />
          </div>

          {/* Trends */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="border-emerald-500/20 bg-emerald-50/30 dark:bg-emerald-500/5">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center text-emerald-600">
                    <TrendingUp size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold">Melhor Consumo</h3>
                    <p className="text-xs text-zinc-500">Sua maior eficiência registrada</p>
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-emerald-600">{stats.bestConsumption.kmPerLiter.toFixed(2)}</span>
                  <span className="text-sm font-medium text-zinc-500">km/l</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-red-500/20 bg-red-50/30 dark:bg-red-500/5">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-500/20 flex items-center justify-center text-red-600">
                    <TrendingDown size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold">Pior Consumo</h3>
                    <p className="text-xs text-zinc-500">Sua menor eficiência registrada</p>
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-red-600">{stats.worstConsumption.kmPerLiter.toFixed(2)}</span>
                  <span className="text-sm font-medium text-zinc-500">km/l</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* History */}
          <div className="space-y-4">
            <h3 className="font-bold flex items-center gap-2 px-1">
              <History size={20} className="text-zinc-400" />
              Histórico de Eficiência
            </h3>
            <div className="space-y-3">
              {stats.history.map((item, index) => (
                <Card key={index}>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="text-center min-w-[60px]">
                        <p className="text-[10px] font-bold text-zinc-400 uppercase">{format(parseISO(item.date), 'MMM')}</p>
                        <p className="text-lg font-bold">{format(parseISO(item.date), 'dd')}</p>
                      </div>
                      <div className="h-8 w-px bg-zinc-100 dark:bg-zinc-800" />
                      <div>
                        <p className="text-sm font-bold">{formatKm(item.distance)} rodados</p>
                        <p className="text-xs text-zinc-500">{item.liters.toFixed(1)}L • {formatCurrency(item.value)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-emerald-600">{item.kmPerLiter.toFixed(2)} <span className="text-xs font-normal text-zinc-500">km/l</span></p>
                      <p className="text-[10px] font-bold text-zinc-400 uppercase">{formatCurrency(item.costPerKm)}/km</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

const StatCard = ({ label, value, icon: Icon, color }: any) => (
  <Card>
    <CardContent className="p-4 flex items-center gap-4">
      <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center bg-zinc-100 dark:bg-zinc-800", color)}>
        <Icon size={24} />
      </div>
      <div>
        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">{label}</p>
        <p className="text-xl font-bold">{value}</p>
      </div>
    </CardContent>
  </Card>
);
