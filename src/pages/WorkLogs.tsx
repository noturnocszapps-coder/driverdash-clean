import React, { useState } from 'react';
import { useDriverStore } from '../store';
import { Card, CardContent, Button, Input, Select } from '../components/UI';
import { Plus, History, Trash2, Calendar, Clock, MapPin, Package, Navigation, DollarSign, Star, Zap, Car } from 'lucide-react';
import { PlatformType } from '../types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const PLATFORM_LABELS: Record<PlatformType, string> = {
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

const SHOPEE_TABLE = {
  Passeio: [
    { maxKm: 100, value: 229 },
    { maxKm: 150, value: 256 },
    { maxKm: 200, value: 284 },
    { maxKm: 250, value: 314 },
    { maxKm: 300, value: 330 },
    { maxKm: 350, value: 361 },
    { maxKm: 400, value: 378 },
    { maxKm: 450, value: 411 },
    { maxKm: 500, value: 441 },
  ],
  Fiorino: [
    { maxKm: 100, value: 272 },
    { maxKm: 150, value: 301 },
    { maxKm: 200, value: 334 },
    { maxKm: 250, value: 367 },
    { maxKm: 300, value: 385 },
    { maxKm: 350, value: 419 },
    { maxKm: 400, value: 443 },
    { maxKm: 450, value: 497 },
    { maxKm: 500, value: 537 },
  ]
};

export const WorkLogs = () => {
  const { workLogs, addWorkLog, deleteWorkLog, settings } = useDriverStore();
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    platform_type: settings.activePlatforms?.[0] || 'uber_car',
    gross_amount: '',
    passenger_cash_amount: '',
    tips_amount: '',
    bonus_amount: '',
    hours_worked: '',
    km_driven: '',
    deliveries_count: '',
    rides_count: '',
    packages_count: '',
    routes_count: '',
    vehicle_type: 'Passeio' as 'Passeio' | 'Fiorino',
    extra_expenses: '',
    notes: ''
  });

  const calculateShopeeValue = (km: number, vehicle: 'Passeio' | 'Fiorino') => {
    const table = SHOPEE_TABLE[vehicle];
    const bracket = table.find(b => km <= b.maxKm) || table[table.length - 1];
    return { value: bracket.value, label: `${bracket.maxKm === 500 ? '451-500' : (table[table.indexOf(bracket)-1]?.maxKm + 1 || 0) + '-' + bracket.maxKm} km` };
  };

  const handleKmChange = (kmValue: string) => {
    const km = Number(kmValue);
    let newGross = formData.gross_amount;
    let bracketLabel = '';

    if (formData.platform_type === 'shopee' && km > 0) {
      const result = calculateShopeeValue(km, formData.vehicle_type);
      newGross = result.value.toString();
      bracketLabel = result.label;
    }

    setFormData({ 
      ...formData, 
      km_driven: kmValue, 
      gross_amount: newGross,
    });
  };

  const handleVehicleTypeChange = (type: 'Passeio' | 'Fiorino') => {
    let newGross = formData.gross_amount;
    const km = Number(formData.km_driven);

    if (formData.platform_type === 'shopee' && km > 0) {
      const result = calculateShopeeValue(km, type);
      newGross = result.value.toString();
    }

    setFormData({ ...formData, vehicle_type: type, gross_amount: newGross });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    let shopeeBracket = undefined;
    if (formData.platform_type === 'shopee' && Number(formData.km_driven) > 0) {
      const result = calculateShopeeValue(Number(formData.km_driven), formData.vehicle_type);
      shopeeBracket = result.label;
    }

    addWorkLog({
      date: formData.date,
      platform_type: formData.platform_type as PlatformType,
      gross_amount: Number(formData.gross_amount),
      passenger_cash_amount: Number(formData.passenger_cash_amount) || 0,
      tips_amount: Number(formData.tips_amount) || 0,
      bonus_amount: Number(formData.bonus_amount) || 0,
      hours_worked: Number(formData.hours_worked),
      km_driven: Number(formData.km_driven),
      deliveries_count: formData.deliveries_count ? Number(formData.deliveries_count) : undefined,
      rides_count: formData.rides_count ? Number(formData.rides_count) : undefined,
      packages_count: formData.packages_count ? Number(formData.packages_count) : undefined,
      routes_count: formData.routes_count ? Number(formData.routes_count) : undefined,
      vehicle_type: formData.platform_type === 'shopee' ? formData.vehicle_type : undefined,
      extra_expenses: Number(formData.extra_expenses) || 0,
      shopee_km_bracket: shopeeBracket,
      notes: formData.notes
    });
    setIsAdding(false);
    setFormData({
      ...formData,
      gross_amount: '',
      passenger_cash_amount: '',
      tips_amount: '',
      bonus_amount: '',
      hours_worked: '',
      km_driven: '',
      deliveries_count: '',
      rides_count: '',
      packages_count: '',
      routes_count: '',
      extra_expenses: '',
      notes: ''
    });
  };

  const isDelivery = ['ifood', 'shopee', 'mercadolivre'].includes(formData.platform_type);
  const isLogistics = ['shopee', 'mercadolivre'].includes(formData.platform_type);
  const isMobility = ['uber_car', 'noventanove_car', 'indrive_car', 'uber_moto', 'noventanove_moto', 'indrive_moto'].includes(formData.platform_type);

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Entregas/Logística</h1>
          <p className="text-zinc-500">Registre seu turno de trabalho</p>
        </div>
        <Button 
          onClick={() => setIsAdding(!isAdding)}
          className="bg-emerald-600 hover:bg-emerald-700 gap-2"
        >
          {isAdding ? 'Cancelar' : <><Plus size={18} /> Novo Turno</>}
        </Button>
      </header>

      {isAdding && (
        <Card className="border-emerald-500/50 bg-emerald-50/50 dark:bg-emerald-900/10">
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-500 uppercase flex items-center gap-1">
                    <Calendar size={12} /> Data
                  </label>
                  <Input 
                    type="date" 
                    required
                    value={formData.date}
                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-500 uppercase flex items-center gap-1">
                    <Zap size={12} /> Plataforma
                  </label>
                  <Select
                    value={formData.platform_type}
                    onChange={e => setFormData({ ...formData, platform_type: e.target.value as PlatformType })}
                  >
                    {settings.activePlatforms?.map(p => (
                      <option key={p} value={p}>{PLATFORM_LABELS[p]}</option>
                    ))}
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {formData.platform_type === 'shopee' && (
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-zinc-500 uppercase flex items-center gap-1">
                      <Car size={12} /> Tipo de Veículo
                    </label>
                    <Select
                      value={formData.vehicle_type}
                      onChange={e => handleVehicleTypeChange(e.target.value as any)}
                    >
                      <option value="Passeio">Passeio</option>
                      <option value="Fiorino">Fiorino</option>
                    </Select>
                  </div>
                )}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-500 uppercase flex items-center gap-1">
                    <DollarSign size={12} /> Valor Bruto {formData.platform_type === 'shopee' && '(Auto)'}
                  </label>
                  <Input 
                    type="number" 
                    step="0.01"
                    required
                    placeholder="0,00"
                    value={formData.gross_amount}
                    readOnly={formData.platform_type === 'shopee'}
                    onChange={e => setFormData({ ...formData, gross_amount: e.target.value })}
                    className={formData.platform_type === 'shopee' ? 'bg-zinc-100 dark:bg-zinc-800 cursor-not-allowed' : ''}
                  />
                </div>
                {!isLogistics && (
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-zinc-500 uppercase flex items-center gap-1">
                      <DollarSign size={12} /> Em Dinheiro
                    </label>
                    <Input 
                      type="number" 
                      step="0.01"
                      placeholder="0,00"
                      value={formData.passenger_cash_amount}
                      onChange={e => setFormData({ ...formData, passenger_cash_amount: e.target.value })}
                    />
                  </div>
                )}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-500 uppercase flex items-center gap-1">
                    <Star size={12} /> Gorjetas
                  </label>
                  <Input 
                    type="number" 
                    step="0.01"
                    placeholder="0,00"
                    value={formData.tips_amount}
                    onChange={e => setFormData({ ...formData, tips_amount: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-500 uppercase flex items-center gap-1">
                    <Zap size={12} /> Bônus/Extra
                  </label>
                  <Input 
                    type="number" 
                    step="0.01"
                    placeholder="0,00"
                    value={formData.bonus_amount}
                    onChange={e => setFormData({ ...formData, bonus_amount: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-500 uppercase flex items-center gap-1">
                    <Clock size={12} /> Horas Online
                  </label>
                  <Input 
                    type="number" 
                    step="0.1"
                    required
                    placeholder="0.0"
                    value={formData.hours_worked}
                    onChange={e => setFormData({ ...formData, hours_worked: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-500 uppercase flex items-center gap-1">
                    <Navigation size={12} /> KM Rodados
                  </label>
                  <Input 
                    type="number" 
                    step="0.1"
                    required
                    placeholder="0.0"
                    value={formData.km_driven}
                    onChange={e => handleKmChange(e.target.value)}
                  />
                </div>
                {isMobility && (
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-zinc-500 uppercase flex items-center gap-1">
                      <Navigation size={12} /> Corridas
                    </label>
                    <Input 
                      type="number" 
                      placeholder="0"
                      value={formData.rides_count}
                      onChange={e => setFormData({ ...formData, rides_count: e.target.value })}
                    />
                  </div>
                )}
                {formData.platform_type === 'ifood' && (
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-zinc-500 uppercase flex items-center gap-1">
                      <MapPin size={12} /> Entregas
                    </label>
                    <Input 
                      type="number" 
                      placeholder="0"
                      value={formData.deliveries_count}
                      onChange={e => setFormData({ ...formData, deliveries_count: e.target.value })}
                    />
                  </div>
                )}
                {isLogistics && (
                  <>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-zinc-500 uppercase flex items-center gap-1">
                        <Package size={12} /> Pacotes
                      </label>
                      <Input 
                        type="number" 
                        placeholder="0"
                        value={formData.packages_count}
                        onChange={e => setFormData({ ...formData, packages_count: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-zinc-500 uppercase flex items-center gap-1">
                        <Navigation size={12} /> Rotas
                      </label>
                      <Input 
                        type="number" 
                        placeholder="0"
                        value={formData.routes_count}
                        onChange={e => setFormData({ ...formData, routes_count: e.target.value })}
                      />
                    </div>
                  </>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-500 uppercase flex items-center gap-1">
                    <DollarSign size={12} /> Despesas Extras
                  </label>
                  <Input 
                    type="number" 
                    step="0.01"
                    placeholder="0,00"
                    value={formData.extra_expenses}
                    onChange={e => setFormData({ ...formData, extra_expenses: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-500 uppercase">Observações</label>
                  <Input 
                    placeholder="Ex: Chuva forte, trânsito intenso..."
                    value={formData.notes}
                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  />
                </div>
              </div>

              <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 font-bold h-12">
                Salvar Turno
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        <h3 className="font-bold flex items-center gap-2">
          <History size={20} className="text-emerald-600" />
          Histórico Recente
        </h3>

        <div className="space-y-3">
          {workLogs.length === 0 ? (
            <Card className="border-dashed border-zinc-200 dark:border-zinc-800">
              <CardContent className="p-8 text-center">
                <p className="text-zinc-500">Nenhum turno registrado ainda.</p>
              </CardContent>
            </Card>
          ) : (
            [...workLogs].reverse().map(log => (
              <Card key={log.id} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center text-emerald-600">
                        {PLATFORM_LABELS[log.platform_type].includes('Moto') ? <Zap size={20} /> : <DollarSign size={20} />}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm">{PLATFORM_LABELS[log.platform_type]}</h4>
                        <p className="text-xs text-zinc-500">
                          {format(new Date(log.date), "dd 'de' MMMM", { locale: ptBR })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-emerald-600">
                        R$ {(log.gross_amount + log.tips_amount + log.bonus_amount).toFixed(2)}
                      </p>
                      <p className="text-[10px] text-zinc-400 uppercase font-bold">
                        {log.hours_worked}h • {log.km_driven}km
                      </p>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => deleteWorkLog(log.id)}
                      className="text-zinc-400 hover:text-red-500 ml-2"
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                  {(log.deliveries_count || log.rides_count || log.packages_count || log.notes) && (
                    <div className="px-4 pb-4 pt-0 flex flex-wrap gap-2">
                      {log.deliveries_count && (
                        <span className="px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded text-[10px] font-bold text-zinc-500">
                          {log.deliveries_count} Entregas
                        </span>
                      )}
                      {log.rides_count && (
                        <span className="px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded text-[10px] font-bold text-zinc-500">
                          {log.rides_count} Corridas
                        </span>
                      )}
                      {log.packages_count && (
                        <span className="px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded text-[10px] font-bold text-zinc-500">
                          {log.packages_count} Pacotes
                        </span>
                      )}
                      {log.shopee_km_bracket && (
                        <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/20 rounded text-[10px] font-bold text-blue-600">
                          Faixa: {log.shopee_km_bracket}
                        </span>
                      )}
                      {log.vehicle_type && (
                        <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/20 rounded text-[10px] font-bold text-purple-600">
                          {log.vehicle_type}
                        </span>
                      )}
                      {log.notes && (
                        <p className="text-[10px] text-zinc-400 italic w-full">"{log.notes}"</p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
