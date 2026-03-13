import React, { useState } from 'react';
import { useDriverStore } from '../store';
import { Card, CardContent, Button, Input, Select } from './UI';
import { Plus, X, Zap, DollarSign, Navigation } from 'lucide-react';
import { format } from 'date-fns';

export const QuickRideButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { addRide, settings } = useDriverStore();
  const [ride, setRide] = useState({
    grossValue: '',
    kmDriven: settings.avgRideKm?.toString() || '5',
    app: 'Uber'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ride.grossValue || !ride.kmDriven) return;

    addRide({
      date: new Date().toISOString(),
      app: ride.app,
      grossValue: Number(ride.grossValue),
      kmDriven: Number(ride.kmDriven),
      onlineHours: 0.3, // Assume 20 mins average
      tips: 0,
      bonus: 0
    });

    setRide({ grossValue: '', kmDriven: settings.avgRideKm?.toString() || '5', app: 'Uber' });
    setIsOpen(false);
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 right-6 w-14 h-14 bg-emerald-600 text-white rounded-full shadow-2xl flex items-center justify-center hover:bg-emerald-700 transition-all active:scale-95 z-40 md:bottom-10"
      >
        <Plus size={28} />
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end justify-center z-50 p-4 md:items-center">
          <Card className="w-full max-w-md animate-in slide-in-from-bottom duration-300">
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <Zap size={20} className="text-emerald-600" />
                  Corrida Rápida (Opcional)
                </h3>
                <button onClick={() => setIsOpen(false)} className="text-zinc-400 hover:text-zinc-600">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase">Valor (R$)</label>
                    <div className="relative">
                      <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                      <Input 
                        autoFocus
                        type="number" 
                        className="pl-8"
                        placeholder="0,00"
                        value={ride.grossValue}
                        onChange={e => setRide({...ride, grossValue: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase">Distância (KM)</label>
                    <div className="relative">
                      <Navigation size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                      <Input 
                        type="number" 
                        className="pl-8"
                        placeholder="0.0"
                        value={ride.kmDriven}
                        onChange={e => setRide({...ride, kmDriven: e.target.value})}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase">Aplicativo</label>
                  <Select value={ride.app} onChange={e => setRide({...ride, app: e.target.value})}>
                    <option value="Uber">Uber</option>
                    <option value="99">99</option>
                    <option value="Particular">Particular</option>
                  </Select>
                </div>

                <Button type="submit" className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 font-bold">
                  Salvar Corrida
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
};
