import React, { useState, useEffect } from 'react';
import { Card, CardContent, Button, Input, Select } from '../components/UI';
import { Calculator, Fuel, Target, Car, Clock, DollarSign, TrendingUp, Info, MapPin } from 'lucide-react';
import { formatCurrency } from '../utils';

const FUEL_PRICES_BY_CITY: Record<string, { gas: number, ethanol: number }> = {
  'São Paulo': { gas: 5.65, ethanol: 3.85 },
  'Rio de Janeiro': { gas: 5.95, ethanol: 4.20 },
  'Belo Horizonte': { gas: 5.45, ethanol: 3.65 },
  'Curitiba': { gas: 5.75, ethanol: 4.10 },
  'Salvador': { gas: 6.10, ethanol: 4.50 },
  'Outra': { gas: 5.80, ethanol: 4.00 }
};

export const Simulator = () => {
  const [city, setCity] = useState('São Paulo');
  const [fuelType, setFuelType] = useState<'gas' | 'ethanol'>('gas');
  
  const [inputs, setInputs] = useState({
    fuelPrice: '5.65',
    dailyGoal: '250',
    kmPerLiter: '10',
    avgRideValue: '15',
    estimatedRides: '18',
    avgKmPerRide: '6',
    avgMinutesPerRide: '20'
  });

  const [results, setResults] = useState({
    estimatedRevenue: 0,
    fuelCost: 0,
    netProfit: 0,
    estimatedHours: 0,
    isWorthIt: false
  });

  useEffect(() => {
    const prices = FUEL_PRICES_BY_CITY[city] || FUEL_PRICES_BY_CITY['Outra'];
    const price = fuelType === 'gas' ? prices.gas : prices.ethanol;
    setInputs(prev => ({ ...prev, fuelPrice: price.toFixed(2) }));
  }, [city, fuelType]);

  useEffect(() => {
    const fuelPrice = Number(inputs.fuelPrice);
    const dailyGoal = Number(inputs.dailyGoal);
    const kmPerLiter = Number(inputs.kmPerLiter);
    const avgRideValue = Number(inputs.avgRideValue);
    const estimatedRides = Number(inputs.estimatedRides);
    const avgKmPerRide = Number(inputs.avgKmPerRide);
    const avgMinutesPerRide = Number(inputs.avgMinutesPerRide);

    const estimatedRevenue = estimatedRides * avgRideValue;
    const totalKm = estimatedRides * avgKmPerRide;
    const fuelNeeded = totalKm / kmPerLiter;
    const fuelCost = fuelNeeded * fuelPrice;
    const netProfit = estimatedRevenue - fuelCost;
    const estimatedHours = (estimatedRides * avgMinutesPerRide) / 60;

    setResults({
      estimatedRevenue,
      fuelCost,
      netProfit,
      estimatedHours,
      isWorthIt: netProfit >= dailyGoal
    });
  }, [inputs]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setInputs(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      <header>
        <h1 className="text-2xl font-bold">Simulador de Lucro</h1>
        <p className="text-zinc-500">Vale a pena rodar hoje?</p>
      </header>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Inputs Section */}
        <div className="space-y-6">
          <Card>
            <CardContent className="p-6 space-y-4">
              <h3 className="font-bold flex items-center gap-2 mb-2">
                <MapPin size={20} className="text-emerald-600" />
                Preço Médio por Cidade
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase">Cidade</label>
                  <Select value={city} onChange={e => setCity(e.target.value)}>
                    {Object.keys(FUEL_PRICES_BY_CITY).map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </Select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase">Combustível</label>
                  <Select value={fuelType} onChange={e => setFuelType(e.target.value as any)}>
                    <option value="gas">Gasolina</option>
                    <option value="ethanol">Etanol</option>
                  </Select>
                </div>
              </div>
              <div className="p-3 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl">
                <p className="text-[10px] text-zinc-500 font-bold uppercase mb-1">Preço Médio Estimado</p>
                <p className="text-lg font-bold text-emerald-600">
                  {formatCurrency(fuelType === 'gas' ? FUEL_PRICES_BY_CITY[city].gas : FUEL_PRICES_BY_CITY[city].ethanol)}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 space-y-4">
              <h3 className="font-bold flex items-center gap-2 mb-2">
                <Calculator size={20} className="text-emerald-600" />
                Parâmetros da Simulação
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase">Preço Combustível (R$/L)</label>
                  <Input 
                    name="fuelPrice"
                    type="number"
                    step="0.01"
                    value={inputs.fuelPrice}
                    onChange={handleChange}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase">Meta Diária (R$)</label>
                  <Input 
                    name="dailyGoal"
                    type="number"
                    value={inputs.dailyGoal}
                    onChange={handleChange}
                  />
                </div>
              </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase">Consumo (KM/L)</label>
                <Input 
                  name="kmPerLiter"
                  type="number"
                  value={inputs.kmPerLiter}
                  onChange={handleChange}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase">Valor Médio Corrida (R$)</label>
                <Input 
                  name="avgRideValue"
                  type="number"
                  value={inputs.avgRideValue}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase">Corridas Estimadas</label>
                <Input 
                  name="estimatedRides"
                  type="number"
                  value={inputs.estimatedRides}
                  onChange={handleChange}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase">KM Médio / Corrida</label>
                <Input 
                  name="avgKmPerRide"
                  type="number"
                  value={inputs.avgKmPerRide}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-zinc-500 uppercase">Tempo Médio / Corrida (min)</label>
              <Input 
                name="avgMinutesPerRide"
                type="number"
                value={inputs.avgMinutesPerRide}
                onChange={handleChange}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Results Section */}
      <div className="space-y-4">
        <Card className={results.isWorthIt ? "border-emerald-500 bg-emerald-50/30 dark:bg-emerald-500/5" : "border-orange-500 bg-orange-50/30 dark:bg-orange-500/5"}>
            <CardContent className="p-6 text-center">
              <div className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center mb-4 ${results.isWorthIt ? "bg-emerald-100 text-emerald-600" : "bg-orange-100 text-orange-600"}`}>
                {results.isWorthIt ? <TrendingUp size={32} /> : <Info size={32} />}
              </div>
              <h2 className="text-xl font-bold mb-1">
                {results.isWorthIt ? "Vale a pena rodar!" : "Meta difícil de atingir"}
              </h2>
              <p className="text-sm text-zinc-500">
                {results.isWorthIt 
                  ? "Com esses parâmetros, você deve superar sua meta diária." 
                  : "O lucro líquido estimado está abaixo da sua meta diária."}
              </p>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 gap-4">
            <ResultCard 
              label="Faturamento Est." 
              value={formatCurrency(results.estimatedRevenue)} 
              icon={DollarSign} 
              color="text-emerald-600"
            />
            <ResultCard 
              label="Custo Combustível" 
              value={formatCurrency(results.fuelCost)} 
              icon={Fuel} 
              color="text-red-500"
            />
            <ResultCard 
              label="Lucro Líquido Est." 
              value={formatCurrency(results.netProfit)} 
              icon={TrendingUp} 
              color="text-blue-600"
            />
            <ResultCard 
              label="Horas Estimadas" 
              value={`${results.estimatedHours.toFixed(1)}h`} 
              icon={Clock} 
              color="text-orange-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

const ResultCard = ({ label, value, icon: Icon, color }: any) => (
  <Card>
    <CardContent className="p-4">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 bg-zinc-100 dark:bg-zinc-800 ${color}`}>
        <Icon size={18} />
      </div>
      <p className="text-[10px] text-zinc-500 font-bold uppercase">{label}</p>
      <p className="text-lg font-bold">{value}</p>
    </CardContent>
  </Card>
);
