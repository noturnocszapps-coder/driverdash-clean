import React, { useState } from 'react';
import { useDriverStore } from '../store';
import { formatCurrency } from '../utils';
import { Card, CardContent, Button, Input } from '../components/UI';
import { Plus, Wrench, Calendar, Gauge, AlertCircle } from 'lucide-react';
import { format, parseISO } from 'date-fns';

export const MaintenancePage = () => {
  const { maintenances, addMaintenance } = useDriverStore();
  const [isAdding, setIsAdding] = useState(false);

  const [formData, setFormData] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    type: '',
    value: '',
    currentKm: '',
    nextChangeKm: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addMaintenance({
      date: formData.date,
      type: formData.type,
      value: Number(formData.value),
      currentKm: Number(formData.currentKm),
      nextChangeKm: Number(formData.nextChangeKm),
    });
    setIsAdding(false);
    setFormData({
      date: format(new Date(), 'yyyy-MM-dd'),
      type: '',
      value: '',
      currentKm: '',
      nextChangeKm: '',
    });
  };

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Manutenção</h1>
          <p className="text-zinc-500">Oficina e revisões</p>
        </div>
        <Button onClick={() => setIsAdding(!isAdding)} variant="outline">
          {isAdding ? 'Cancelar' : <><Plus size={20} /> Nova Manutenção</>}
        </Button>
      </header>

      {isAdding && (
        <Card className="border-orange-500">
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

              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-500 uppercase">Tipo de Serviço</label>
                <Input 
                  placeholder="Ex: Troca de Óleo, Pastilhas..."
                  value={formData.type} 
                  onChange={e => setFormData({...formData, type: e.target.value})}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-500 uppercase">Valor (R$)</label>
                <Input 
                  type="number" 
                  step="0.01"
                  placeholder="0,00"
                  value={formData.value} 
                  onChange={e => setFormData({...formData, value: e.target.value})}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-500 uppercase">KM Atual</label>
                  <Input 
                    type="number" 
                    placeholder="0"
                    value={formData.currentKm} 
                    onChange={e => setFormData({...formData, currentKm: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-zinc-500 uppercase">Próxima Troca (KM)</label>
                  <Input 
                    type="number" 
                    placeholder="0"
                    value={formData.nextChangeKm} 
                    onChange={e => setFormData({...formData, nextChangeKm: e.target.value})}
                    required
                  />
                </div>
              </div>

              <Button type="submit" className="w-full h-12 bg-orange-600 hover:bg-orange-700">Salvar Manutenção</Button>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {maintenances.length === 0 ? (
          <div className="text-center py-12 text-zinc-500">
            <Wrench size={48} className="mx-auto mb-4 opacity-20" />
            <p>Nenhuma manutenção cadastrada.</p>
          </div>
        ) : (
          maintenances.sort((a, b) => b.date.localeCompare(a.date)).map((maint) => (
            <Card key={maint.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-500/10 flex items-center justify-center text-orange-500">
                      <Wrench size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold">{maint.type}</h3>
                      <p className="text-xs text-zinc-500 flex items-center gap-1">
                        <Calendar size={12} /> {format(parseISO(maint.date), 'dd/MM/yyyy')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-orange-600">
                      {formatCurrency(maint.value)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                  <div className="flex-1">
                    <p className="text-[10px] text-zinc-500 uppercase font-bold">KM Atual</p>
                    <p className="text-sm font-medium">{maint.currentKm.toLocaleString()} km</p>
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] text-zinc-500 uppercase font-bold">Próxima Troca</p>
                    <p className="text-sm font-medium text-emerald-600">{maint.nextChangeKm.toLocaleString()} km</p>
                  </div>
                  <div className="flex-1 text-right">
                    <p className="text-[10px] text-zinc-500 uppercase font-bold">Faltam</p>
                    <p className="text-sm font-medium text-orange-500">{(maint.nextChangeKm - maint.currentKm).toLocaleString()} km</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
