import React, { useState } from 'react';
import { useDriverStore } from '../store';
import { formatCurrency, formatKm, cn } from '../utils';
import { Card, CardContent, Button, Input, Select } from '../components/UI';
import { Plus, Car, Calendar, DollarSign, Clock, MapPin, Trash2, Upload, Percent } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AppType } from '../types';
import { CSVImporter } from '../components/CSVImporter';

export const Rides = () => {
  const { rides, addRide, deleteRide } = useDriverStore();
  const [isAdding, setIsAdding] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const [formData, setFormData] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    app: 'Uber' as AppType,
    grossValue: '',
    tips: '',
    bonus: '',
    onlineHours: '',
    kmDriven: '',
    passengerPaid: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addRide({
      date: formData.date,
      app: formData.app,
      grossValue: Number(formData.grossValue),
      tips: Number(formData.tips) || 0,
      bonus: Number(formData.bonus) || 0,
      onlineHours: Number(formData.onlineHours),
      kmDriven: Number(formData.kmDriven),
      passengerPaid: formData.passengerPaid ? Number(formData.passengerPaid) : undefined,
    });
    setIsAdding(false);
    setFormData({
      date: format(new Date(), 'yyyy-MM-dd'),
      app: 'Uber',
      grossValue: '',
      tips: '',
      bonus: '',
      onlineHours: '',
      kmDriven: '',
      passengerPaid: '',
    });
  };

  const handleImport = (importedRides: any[]) => {
    importedRides.forEach(ride => addRide(ride));
  };

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Corridas</h1>
          <p className="text-zinc-500">Histórico de faturamento</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsImporting(true)}>
            <Upload size={18} />
          </Button>
          <Button onClick={() => setIsAdding(!isAdding)}>
            {isAdding ? 'Cancelar' : <><Plus size={20} /> Nova</>}
          </Button>
        </div>
      </header>

      {isImporting && (
        <CSVImporter 
          onImport={handleImport} 
          onClose={() => setIsImporting(false)} 
        />
      )}

      {isAdding && (
        <Card className="border-emerald-500">
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-500 uppercase">Data</label>
                  <Input 
                    type="date" 
                    value={formData.date} 
                    onChange={e => setFormData({...formData, date: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-500 uppercase">Aplicativo</label>
                  <Select 
                    value={formData.app} 
                    onChange={e => setFormData({...formData, app: e.target.value as AppType})}
                  >
                    <option value="Uber">Uber</option>
                    <option value="99">99</option>
                    <option value="Particular">Particular</option>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-500 uppercase">Valor Recebido (R$)</label>
                  <Input 
                    type="number" 
                    step="0.01"
                    placeholder="0,00"
                    value={formData.grossValue} 
                    onChange={e => setFormData({...formData, grossValue: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-500 uppercase">Pago pelo Passageiro (Opt)</label>
                  <Input 
                    type="number" 
                    step="0.01"
                    placeholder="0,00"
                    value={formData.passengerPaid} 
                    onChange={e => setFormData({...formData, passengerPaid: e.target.value})}
                  />
                </div>
              </div>

              {formData.passengerPaid && Number(formData.passengerPaid) > 0 && (
                <div className="bg-zinc-50 dark:bg-zinc-900/50 p-3 rounded-xl flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Percent size={14} className="text-emerald-600" />
                    <span className="text-xs font-bold text-zinc-500 uppercase">Taxa Estimada</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-red-500">
                      {((1 - (Number(formData.grossValue) / Number(formData.passengerPaid))) * 100).toFixed(1)}%
                    </p>
                    <p className="text-[10px] text-zinc-400">
                      Retido: {formatCurrency(Number(formData.passengerPaid) - Number(formData.grossValue))}
                    </p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-500 uppercase">Gorjetas (R$)</label>
                  <Input 
                    type="number" 
                    step="0.01"
                    placeholder="0,00"
                    value={formData.tips} 
                    onChange={e => setFormData({...formData, tips: e.target.value})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-500 uppercase">Bônus (R$)</label>
                  <Input 
                    type="number" 
                    step="0.01"
                    placeholder="0,00"
                    value={formData.bonus} 
                    onChange={e => setFormData({...formData, bonus: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-500 uppercase">Horas Online</label>
                  <Input 
                    type="number" 
                    step="0.1"
                    placeholder="0.0"
                    value={formData.onlineHours} 
                    onChange={e => setFormData({...formData, onlineHours: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-500 uppercase">KM Rodados</label>
                  <Input 
                    type="number" 
                    placeholder="0"
                    value={formData.kmDriven} 
                    onChange={e => setFormData({...formData, kmDriven: e.target.value})}
                    required
                  />
                </div>
              </div>

              <Button type="submit" className="w-full h-12">Salvar Corrida</Button>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {rides.length === 0 ? (
          <div className="text-center py-12 text-zinc-500">
            <Car size={48} className="mx-auto mb-4 opacity-20" />
            <p>Nenhuma corrida cadastrada ainda.</p>
          </div>
        ) : (
          rides.sort((a, b) => b.date.localeCompare(a.date)).map((ride) => (
            <Card key={ride.id} className="group">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm",
                      ride.app === 'Uber' ? "bg-black text-white" : 
                      ride.app === '99' ? "bg-yellow-400 text-black" : 
                      "bg-emerald-600 text-white"
                    )}>
                      {ride.app[0]}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm">{ride.app}</h3>
                      <p className="text-[10px] text-zinc-500 flex items-center gap-1">
                        <Calendar size={10} /> {format(parseISO(ride.date), 'dd/MM/yyyy')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="font-bold text-emerald-600">
                        {formatCurrency(ride.grossValue + ride.tips + ride.bonus)}
                      </p>
                      <p className="text-[10px] text-zinc-500 uppercase font-bold">
                        {ride.kmDriven} km • {ride.onlineHours}h
                      </p>
                    </div>
                    <button 
                      onClick={() => deleteRide(ride.id)}
                      className="p-2 text-zinc-300 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                
                {ride.passengerPaid && (
                  <div className="mt-2 pt-2 border-t border-zinc-100 dark:border-zinc-800 flex justify-between items-center text-[10px]">
                    <span className="text-zinc-400 uppercase font-bold">Taxa da Plataforma</span>
                    <span className="font-bold text-zinc-600 dark:text-zinc-400">
                      {((1 - (ride.grossValue / ride.passengerPaid)) * 100).toFixed(1)}% 
                      ({formatCurrency(ride.passengerPaid - ride.grossValue)})
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
