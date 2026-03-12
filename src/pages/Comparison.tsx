import React, { useMemo } from 'react';
import { useDriverStore } from '../store';
import { formatCurrency, cn } from '../utils';
import { Card, CardContent } from '../components/UI';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { Trophy, TrendingUp, Clock, DollarSign, Smartphone } from 'lucide-react';
import { AppType } from '../types';

export const Comparison = () => {
  const { rides, fuelings, expenses } = useDriverStore();

  const stats = useMemo(() => {
    const apps: AppType[] = ['Uber', '99', 'Particular'];
    
    // Calculate total fuel cost to estimate profit per app
    const totalFuelCost = fuelings.reduce((acc, f) => acc + f.value, 0);
    const totalKm = rides.reduce((acc, r) => acc + r.kmDriven, 0);
    const fuelCostPerKm = totalKm > 0 ? totalFuelCost / totalKm : 0;

    const data = apps.map(app => {
      const appRides = rides.filter(r => r.app === app);
      const revenue = appRides.reduce((acc, r) => acc + r.grossValue + r.tips + r.bonus, 0);
      const hours = appRides.reduce((acc, r) => acc + r.onlineHours, 0);
      const km = appRides.reduce((acc, r) => acc + r.kmDriven, 0);
      const count = appRides.length;
      
      const estimatedFuelCost = km * fuelCostPerKm;
      const profit = revenue - estimatedFuelCost;
      const hourlyGain = hours > 0 ? revenue / hours : 0;
      const avgPerRide = count > 0 ? revenue / count : 0;

      return {
        name: app,
        revenue,
        profit,
        hourlyGain,
        avgPerRide,
        count,
        hours
      };
    });

    // Determine best app based on hourly gain
    const bestApp = [...data].sort((a, b) => b.hourlyGain - a.hourlyGain)[0];

    return { data, bestApp };
  }, [rides, fuelings]);

  const COLORS = {
    Uber: '#000000',
    '99': '#FACC15',
    Particular: '#059669'
  };

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      <header>
        <h1 className="text-2xl font-bold">Comparativo</h1>
        <p className="text-zinc-500">Uber vs 99 vs Particular</p>
      </header>

      {rides.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center text-zinc-500">
            <Smartphone size={48} className="mx-auto mb-4 opacity-20" />
            <p>Cadastre algumas corridas para ver o comparativo.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Best App Summary */}
          <Card className="bg-emerald-600 text-white border-none">
            <CardContent className="p-6 flex items-center gap-6">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center shrink-0">
                <Trophy size={32} />
              </div>
              <div>
                <h2 className="text-xl font-bold">Melhor Desempenho: {stats.bestApp.name}</h2>
                <p className="text-emerald-100 text-sm">
                  O aplicativo {stats.bestApp.name} está rendendo {formatCurrency(stats.bestApp.hourlyGain)} por hora, 
                  sendo sua melhor opção no momento.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Charts Row */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardContent className="p-6">
                <h3 className="font-bold mb-6 flex items-center gap-2">
                  <DollarSign size={20} className="text-emerald-600" />
                  Faturamento Total
                </h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.data}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} />
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
                      <Bar dataKey="revenue" radius={[4, 4, 0, 0]}>
                        {stats.data.map((entry) => (
                          <Cell key={`cell-${entry.name}`} fill={COLORS[entry.name as keyof typeof COLORS]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h3 className="font-bold mb-6 flex items-center gap-2">
                  <Clock size={20} className="text-emerald-600" />
                  Ganho por Hora
                </h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.data}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} />
                      <YAxis hide />
                      <Tooltip 
                        cursor={{ fill: 'transparent' }}
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="bg-zinc-900 text-white p-2 rounded-lg text-xs shadow-xl">
                                {formatCurrency(payload[0].value as number)}/h
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar dataKey="hourlyGain" radius={[4, 4, 0, 0]}>
                        {stats.data.map((entry) => (
                          <Cell key={`cell-${entry.name}`} fill={COLORS[entry.name as keyof typeof COLORS]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Stats Table */}
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-100 dark:border-zinc-800">
                      <th className="p-4 text-xs font-bold text-zinc-500 uppercase">App</th>
                      <th className="p-4 text-xs font-bold text-zinc-500 uppercase text-right">Corridas</th>
                      <th className="p-4 text-xs font-bold text-zinc-500 uppercase text-right">Média/Corrida</th>
                      <th className="p-4 text-xs font-bold text-zinc-500 uppercase text-right">Lucro Est.</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {stats.data.map((app) => (
                      <tr key={app.name}>
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: COLORS[app.name as keyof typeof COLORS] }}
                            />
                            <span className="font-bold">{app.name}</span>
                          </div>
                        </td>
                        <td className="p-4 text-right font-medium">{app.count}</td>
                        <td className="p-4 text-right font-medium">{formatCurrency(app.avgPerRide)}</td>
                        <td className="p-4 text-right font-bold text-emerald-600">{formatCurrency(app.profit)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};
