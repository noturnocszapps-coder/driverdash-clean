import React, { useState } from 'react';
import { useDriverStore } from '../store';
import { formatCurrency } from '../utils';
import { Card, CardContent, Button, Input } from '../components/UI';
import { Plus, Fuel, Calendar, Gauge } from 'lucide-react';
import { format, parseISO } from 'date-fns';

export const FuelingPage = () => {
  const { fuelings, addFueling } = useDriverStore();
  const [isAdding, setIsAdding] = useState(false);

  const [formData, setFormData] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    liters: '',
    value: '',
    odometer: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addFueling({
      date: formData.date,
      liters: Number(formData.liters),
      value: Number(formData.value),
      odometer: Number(formData.odometer),
    });
    setIsAdding(false);
    setFormData({
      date: format(new Date(), 'yyyy-MM-dd'),
      liters: '',
      value: '',
      odometer: '',
    });
  };

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Abastecimento</h1>
          <p className="text-zinc-500">Controle de combustível</p>
        </div>
        <Button onClick={() => setIsAdding(!isAdding)} variant="outline">
          {isAdding ? 'Cancelar' : <><Plus size={20} /> Novo Abastecimento</>}
        </Button>
      </header>

      {isAdding && (
        <Card className="border-blue-500">
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-500 uppercase">Data</label>
                <Input 
                  type="date" 
                  value={formData.date} 
                  onChange={e => setFormData({...formData, date: e.target.value})}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-500 uppercase">Litros</label>
                  <Input 
                    type="number" 
                    step="0.01"
                    placeholder="0,00"
                    value={formData.liters} 
                    onChange={e => setFormData({...formData, liters: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-500 uppercase">Valor Total (R$)</label>
                  <Input 
                    type="number" 
                    step="0.01"
                    placeholder="0,00"
                    value={formData.value} 
                    onChange={e => setFormData({...formData, value: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-500 uppercase">Odômetro Atual (KM)</label>
                <Input 
                  type="number" 
                  placeholder="0"
                  value={formData.odometer} 
                  onChange={e => setFormData({...formData, odometer: e.target.value})}
                  required
                />
              </div>

              <Button type="submit" className="w-full h-12 bg-blue-600 hover:bg-blue-700">Salvar Abastecimento</Button>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {fuelings.length === 0 ? (
          <div className="text-center py-12 text-zinc-500">
            <Fuel size={48} className="mx-auto mb-4 opacity-20" />
            <p>Nenhum abastecimento cadastrado.</p>
          </div>
        ) : (
          fuelings.sort((a, b) => b.date.localeCompare(a.date)).map((fuel) => (
            <Card key={fuel.id}>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-500">
                    <Fuel size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold">{fuel.liters} Litros</h3>
                    <div className="flex gap-2 items-center text-xs text-zinc-500">
                      <span className="flex items-center gap-1"><Calendar size={12} /> {format(parseISO(fuel.date), 'dd/MM/yyyy')}</span>
                      <span className="flex items-center gap-1"><Gauge size={12} /> {fuel.odometer} km</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-blue-600">
                    {formatCurrency(fuel.value)}
                  </p>
                  <p className="text-[10px] text-zinc-500 font-bold">
                    {formatCurrency(fuel.value / fuel.liters)}/L
                  </p>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
