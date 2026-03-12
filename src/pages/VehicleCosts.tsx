import React, { useState, useEffect } from 'react';
import { useDriverStore } from '../store';
import { Card, CardContent, Button, Input } from '../components/UI';
import { Car, DollarSign, Calendar, Shield, Wrench, Info, TrendingDown } from 'lucide-react';
import { formatCurrency } from '../utils';

export const VehicleCosts = () => {
  const { settings, updateSettings } = useDriverStore();
  const [costs, setCosts] = useState(settings.vehicleCosts || {
    purchaseValue: 50000,
    insurance: 2500,
    ipva: 2000,
    licensing: 150,
    depreciation: 10,
    monthlyMaintenance: 200,
    annualKm: 30000
  });

  const [results, setResults] = useState({
    annualTotal: 0,
    monthlyTotal: 0,
    costPerKm: 0,
    depreciationValue: 0
  });

  useEffect(() => {
    const depreciationValue = (costs.purchaseValue * (costs.depreciation / 100));
    const annualMaintenance = costs.monthlyMaintenance * 12;
    const annualFixed = costs.insurance + costs.ipva + costs.licensing;
    
    const annualTotal = depreciationValue + annualMaintenance + annualFixed;
    const monthlyTotal = annualTotal / 12;
    const costPerKm = costs.annualKm > 0 ? annualTotal / costs.annualKm : 0;

    setResults({
      annualTotal,
      monthlyTotal,
      costPerKm,
      depreciationValue
    });

    updateSettings({ vehicleCosts: costs });
  }, [costs]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCosts(prev => ({ ...prev, [name]: Number(value) }));
  };

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      <header>
        <h1 className="text-2xl font-bold">Custo Real do Veículo</h1>
        <p className="text-zinc-500">Quanto seu carro custa por KM?</p>
      </header>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-6 space-y-4">
            <h3 className="font-bold flex items-center gap-2 mb-2">
              <Car size={20} className="text-emerald-600" />
              Dados do Veículo
            </h3>
            
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase">Valor de Compra (R$)</label>
                <Input name="purchaseValue" type="number" value={costs.purchaseValue} onChange={handleChange} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase">Seguro Anual (R$)</label>
                  <Input name="insurance" type="number" value={costs.insurance} onChange={handleChange} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase">IPVA Anual (R$)</label>
                  <Input name="ipva" type="number" value={costs.ipva} onChange={handleChange} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase">Licenciamento (R$)</label>
                  <Input name="licensing" type="number" value={costs.licensing} onChange={handleChange} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase">Depreciação Anual (%)</label>
                  <Input name="depreciation" type="number" value={costs.depreciation} onChange={handleChange} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase">Manutenção Média (R$)</label>
                  <Input name="monthlyMaintenance" type="number" value={costs.monthlyMaintenance} onChange={handleChange} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase">KM Anual Estimado</label>
                  <Input name="annualKm" type="number" value={costs.annualKm} onChange={handleChange} />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="bg-zinc-900 text-white border-none">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest mb-1">Custo por KM Rodado</p>
                  <h2 className="text-4xl font-bold text-emerald-400">{formatCurrency(results.costPerKm)}</h2>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <TrendingDown size={24} />
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center py-3 border-t border-white/10">
                  <span className="text-sm text-zinc-400">Custo Total Anual</span>
                  <span className="font-bold">{formatCurrency(results.annualTotal)}</span>
                </div>
                <div className="flex justify-between items-center py-3 border-t border-white/10">
                  <span className="text-sm text-zinc-400">Custo Médio Mensal</span>
                  <span className="font-bold">{formatCurrency(results.monthlyTotal)}</span>
                </div>
                <div className="flex justify-between items-center py-3 border-t border-white/10">
                  <span className="text-sm text-zinc-400">Depreciação Anual</span>
                  <span className="font-bold text-red-400">-{formatCurrency(results.depreciationValue)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-blue-50 border-blue-100 dark:bg-blue-900/10 dark:border-blue-900/20">
            <CardContent className="p-4 flex gap-3">
              <Info className="text-blue-600 shrink-0" size={20} />
              <p className="text-xs text-blue-800 dark:text-blue-300 leading-relaxed">
                Este cálculo considera custos fixos e depreciação. Para um lucro real, você deve subtrair este valor do seu ganho bruto por KM.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
