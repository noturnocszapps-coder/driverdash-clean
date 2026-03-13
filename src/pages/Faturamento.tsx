import React, { useState } from 'react';
import { useDriverStore } from '../store';
import { Card, CardContent, Button, Input, Select } from '../components/UI';
import { DollarSign, Navigation, Clock, Fuel, Plus, Trash2, History, TrendingUp, TrendingDown, Calculator, Smartphone, Zap, Edit2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { formatCurrency, cn } from '../utils';

export const Faturamento = () => {
  const { faturamentoLogs, addFaturamentoLog, updateFaturamentoLog, deleteFaturamentoLog } = useDriverStore();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    vehicle_mode: 'carro' as 'carro' | 'moto',
    uber_amount: '',
    noventanove_amount: '',
    indriver_amount: '',
    extra_amount: '',
    km_total: '',
    active_hours_total: '',
    fuel_total: '',
    fuel_price: '',
    fuel_type: 'gasolina' as 'gasolina' | 'etanol' | 'energia',
    additional_expense: '',
    notes: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const logData = {
      date: formData.date,
      vehicle_mode: formData.vehicle_mode,
      uber_amount: Number(formData.uber_amount) || 0,
      noventanove_amount: Number(formData.noventanove_amount) || 0,
      indriver_amount: Number(formData.indriver_amount) || 0,
      extra_amount: Number(formData.extra_amount) || 0,
      km_total: Number(formData.km_total) || 0,
      active_hours_total: Number(formData.active_hours_total) || 0,
      fuel_total: Number(formData.fuel_total) || 0,
      fuel_price: Number(formData.fuel_price) || 0,
      fuel_type: formData.fuel_type,
      additional_expense: Number(formData.additional_expense) || 0,
      notes: formData.notes
    };

    if (editingId) {
      updateFaturamentoLog(editingId, logData);
    } else {
      addFaturamentoLog(logData);
    }

    setIsAdding(false);
    setEditingId(null);
    setFormData({
      ...formData,
      uber_amount: '',
      noventanove_amount: '',
      indriver_amount: '',
      extra_amount: '',
      km_total: '',
      active_hours_total: '',
      fuel_total: '',
      fuel_price: '',
      additional_expense: '',
      notes: ''
    });
  };

  const handleEdit = (log: any) => {
    setFormData({
      date: log.date,
      vehicle_mode: log.vehicle_mode,
      uber_amount: log.uber_amount.toString(),
      noventanove_amount: log.noventanove_amount.toString(),
      indriver_amount: log.indriver_amount.toString(),
      extra_amount: log.extra_amount.toString(),
      km_total: log.km_total.toString(),
      active_hours_total: log.active_hours_total.toString(),
      fuel_total: log.fuel_total.toString(),
      fuel_price: log.fuel_price.toString(),
      fuel_type: log.fuel_type,
      additional_expense: log.additional_expense.toString(),
      notes: log.notes || ''
    });
    setEditingId(log.id);
    setIsAdding(true);
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingId(null);
    setFormData({
      ...formData,
      uber_amount: '',
      noventanove_amount: '',
      indriver_amount: '',
      extra_amount: '',
      km_total: '',
      active_hours_total: '',
      fuel_total: '',
      fuel_price: '',
      additional_expense: '',
      notes: ''
    });
  };

  const totalRevenue = (Number(formData.uber_amount) || 0) + 
                       (Number(formData.noventanove_amount) || 0) + 
                       (Number(formData.indriver_amount) || 0) + 
                       (Number(formData.extra_amount) || 0);

  const totalExpenses = (Number(formData.fuel_total) || 0) + 
                        (Number(formData.additional_expense) || 0);

  const netProfit = totalRevenue - totalExpenses;

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Faturamento</h1>
          <p className="text-zinc-500">Lançamento diário simplificado</p>
        </div>
        {!isAdding && (
          <Button onClick={() => setIsAdding(true)} className="gap-2 h-12 px-6 rounded-xl shadow-lg shadow-emerald-500/20">
            <Plus size={20} /> Novo Lançamento
          </Button>
        )}
      </header>

      {isAdding && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
          {/* Live Summary - Prominent at top */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl text-center">
              <p className="text-[10px] font-bold text-emerald-600 uppercase mb-1">Total</p>
              <p className="text-lg font-black text-emerald-600">{formatCurrency(totalRevenue)}</p>
            </div>
            <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl text-center">
              <p className="text-[10px] font-bold text-red-600 uppercase mb-1">Gastos</p>
              <p className="text-lg font-black text-red-600">{formatCurrency(totalExpenses)}</p>
            </div>
            <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-2xl text-center">
              <p className="text-[10px] font-bold text-blue-600 uppercase mb-1">Líquido</p>
              <p className="text-lg font-black text-blue-600">{formatCurrency(netProfit)}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Date and Vehicle Mode */}
            <div className="grid grid-cols-1 gap-6">
              <div className="space-y-3">
                <label className="text-xs font-bold text-zinc-500 uppercase px-1">Data do Trabalho</label>
                <Input 
                  type="date" 
                  className="h-14 rounded-2xl text-lg font-bold"
                  value={formData.date} 
                  onChange={e => setFormData({...formData, date: e.target.value})}
                  required
                />
              </div>

              <div className="space-y-3">
                <label className="text-xs font-bold text-zinc-500 uppercase px-1">Veículo Utilizado</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFormData({...formData, vehicle_mode: 'carro'})}
                  className={cn(
                    "flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all gap-2",
                    formData.vehicle_mode === 'carro' 
                      ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600" 
                      : "border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-400"
                  )}
                >
                  <Navigation size={24} />
                  <span className="font-bold">Carro</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({...formData, vehicle_mode: 'moto'})}
                  className={cn(
                    "flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all gap-2",
                    formData.vehicle_mode === 'moto' 
                      ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600" 
                      : "border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-400"
                  )}
                >
                  <Zap size={24} />
                  <span className="font-bold">Moto</span>
                </button>
              </div>
            </div>
            </div>

            {/* Platform Blocks */}
            <div className="space-y-4">
              <h3 className="font-bold text-zinc-400 text-xs uppercase px-1 tracking-wider">Ganhos por Plataforma</h3>
              <div className="grid grid-cols-1 gap-4">
                {/* Uber Block */}
                <div className="bg-black text-white p-5 rounded-3xl flex items-center gap-4 shadow-xl">
                  <div className="bg-white/10 p-3 rounded-2xl">
                    <Smartphone size={24} className="text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] font-bold uppercase text-zinc-400">Uber</p>
                    <input 
                      type="number" step="0.01" placeholder="0,00"
                      className="bg-transparent border-none p-0 text-2xl font-black w-full focus:ring-0 placeholder:text-zinc-700"
                      value={formData.uber_amount} 
                      onChange={e => setFormData({...formData, uber_amount: e.target.value})}
                    />
                  </div>
                </div>

                {/* 99 Block */}
                <div className="bg-orange-500 text-white p-5 rounded-3xl flex items-center gap-4 shadow-xl">
                  <div className="bg-white/10 p-3 rounded-2xl">
                    <TrendingUp size={24} className="text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] font-bold uppercase text-orange-100">99 App</p>
                    <input 
                      type="number" step="0.01" placeholder="0,00"
                      className="bg-transparent border-none p-0 text-2xl font-black w-full focus:ring-0 placeholder:text-orange-300"
                      value={formData.noventanove_amount} 
                      onChange={e => setFormData({...formData, noventanove_amount: e.target.value})}
                    />
                  </div>
                </div>

                {/* inDrive Block */}
                <div className="bg-emerald-600 text-white p-5 rounded-3xl flex items-center gap-4 shadow-xl">
                  <div className="bg-white/10 p-3 rounded-2xl">
                    <DollarSign size={24} className="text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] font-bold uppercase text-emerald-100">inDrive</p>
                    <input 
                      type="number" step="0.01" placeholder="0,00"
                      className="bg-transparent border-none p-0 text-2xl font-black w-full focus:ring-0 placeholder:text-emerald-400"
                      value={formData.indriver_amount} 
                      onChange={e => setFormData({...formData, indriver_amount: e.target.value})}
                    />
                  </div>
                </div>

                {/* Extra Block */}
                <div className="bg-zinc-100 dark:bg-zinc-800 p-5 rounded-3xl flex items-center gap-4">
                  <div className="bg-zinc-200 dark:bg-zinc-700 p-3 rounded-2xl text-zinc-500">
                    <Plus size={24} />
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] font-bold uppercase text-zinc-500">Outros / Particular</p>
                    <input 
                      type="number" step="0.01" placeholder="0,00"
                      className="bg-transparent border-none p-0 text-2xl font-black w-full focus:ring-0 placeholder:text-zinc-300 dark:placeholder:text-zinc-600"
                      value={formData.extra_amount} 
                      onChange={e => setFormData({...formData, extra_amount: e.target.value})}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Operational Data */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 p-5 rounded-3xl shadow-sm">
                <p className="text-[10px] font-bold uppercase text-zinc-500 mb-2 flex items-center gap-1">
                  <Navigation size={12} /> KM Total
                </p>
                <input 
                  type="number" step="0.1" placeholder="0.0"
                  className="bg-transparent border-none p-0 text-2xl font-black w-full focus:ring-0"
                  value={formData.km_total} 
                  onChange={e => setFormData({...formData, km_total: e.target.value})}
                  required
                />
              </div>
              <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 p-5 rounded-3xl shadow-sm">
                <p className="text-[10px] font-bold uppercase text-zinc-500 mb-2 flex items-center gap-1">
                  <Clock size={12} /> Horas
                </p>
                <input 
                  type="number" step="0.1" placeholder="0.0"
                  className="bg-transparent border-none p-0 text-2xl font-black w-full focus:ring-0"
                  value={formData.active_hours_total} 
                  onChange={e => setFormData({...formData, active_hours_total: e.target.value})}
                  required
                />
              </div>
            </div>

            {/* Expenses Section */}
            <div className="space-y-4">
              <h3 className="font-bold text-zinc-400 text-xs uppercase px-1 tracking-wider">Despesas do Dia</h3>
              <div className="bg-red-50 dark:bg-red-500/5 border border-red-100 dark:border-red-500/10 p-6 rounded-3xl space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-red-600 uppercase">Combustível (R$)</label>
                    <Input 
                      type="number" step="0.01" placeholder="0,00"
                      className="text-xl font-bold h-14 rounded-2xl border-red-200 dark:border-red-500/20"
                      value={formData.fuel_total} 
                      onChange={e => setFormData({...formData, fuel_total: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-red-600 uppercase">Outras Despesas (R$)</label>
                    <Input 
                      type="number" step="0.01" placeholder="0,00"
                      className="text-xl font-bold h-14 rounded-2xl border-red-200 dark:border-red-500/20"
                      value={formData.additional_expense} 
                      onChange={e => setFormData({...formData, additional_expense: e.target.value})}
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase">Observações</label>
                  <Input 
                    placeholder="Ex: Aluguel, Lavagem, etc."
                    className="h-14 rounded-2xl"
                    value={formData.notes} 
                    onChange={e => setFormData({...formData, notes: e.target.value})}
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3 pt-4">
              <Button type="submit" className="h-16 text-lg font-bold rounded-2xl shadow-xl shadow-emerald-500/20">
                {editingId ? 'Atualizar Lançamento' : 'Salvar Lançamento'}
              </Button>
              <Button type="button" variant="outline" onClick={handleCancel} className="h-14 rounded-2xl">
                Cancelar
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* History List */}
      <div className="space-y-4">
        <h2 className="font-bold flex items-center gap-2 px-1">
          <History size={20} className="text-zinc-400" />
          Histórico Recente
        </h2>
        
        {faturamentoLogs.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center text-zinc-500">
              <Calculator size={48} className="mx-auto mb-4 opacity-20" />
              <p>Nenhum faturamento lançado ainda.</p>
              <Button variant="ghost" onClick={() => setIsAdding(true)} className="mt-4 text-emerald-600">
                Começar agora
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {[...faturamentoLogs].sort((a, b) => b.date.localeCompare(a.date)).map((log) => {
              const rev = log.uber_amount + log.noventanove_amount + log.indriver_amount + log.extra_amount;
              const exp = log.fuel_total + log.additional_expense;
              const profit = rev - exp;
              
              return (
                <Card key={log.id} className="group hover:border-emerald-500/30 transition-all">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="text-center min-w-[50px]">
                          <p className="text-[10px] font-bold text-zinc-400 uppercase">{format(parseISO(log.date), 'MMM')}</p>
                          <p className="text-lg font-bold">{format(parseISO(log.date), 'dd')}</p>
                        </div>
                        <div className="h-8 w-px bg-zinc-100 dark:bg-zinc-800" />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className={cn(
                              "text-[10px] font-bold uppercase px-2 py-0.5 rounded-full",
                              log.vehicle_mode === 'carro' ? "bg-blue-100 text-blue-600" : "bg-orange-100 text-orange-600"
                            )}>
                              {log.vehicle_mode}
                            </span>
                            <span className="text-sm font-bold text-emerald-600">{formatCurrency(rev)}</span>
                          </div>
                          <p className="text-xs text-zinc-500">
                            {log.km_total}km • {log.active_hours_total}h • {formatCurrency(rev / log.active_hours_total)}/h
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-zinc-500 opacity-0 group-hover:opacity-100"
                          onClick={() => handleEdit(log)}
                        >
                          <Edit2 size={16} />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-red-500 opacity-0 group-hover:opacity-100"
                          onClick={() => deleteFaturamentoLog(log.id)}
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-3 border-t border-zinc-50 dark:border-zinc-800/50">
                      <div className="text-center">
                        <p className="text-[9px] font-bold text-zinc-400 uppercase">Uber</p>
                        <p className="text-xs font-bold">{formatCurrency(log.uber_amount)}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[9px] font-bold text-zinc-400 uppercase">99</p>
                        <p className="text-xs font-bold">{formatCurrency(log.noventanove_amount)}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[9px] font-bold text-zinc-400 uppercase">Lucro</p>
                        <p className="text-xs font-bold text-blue-600">{formatCurrency(profit)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
