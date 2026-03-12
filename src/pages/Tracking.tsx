import React, { useState, useEffect, useRef } from 'react';
import { useDriverStore } from '../store';
import { Card, CardContent, Button } from '../components/UI';
import { Play, Square, Navigation, Zap, Clock, Fuel, Gauge } from 'lucide-react';
import { formatCurrency } from '../utils';

export const Tracking = () => {
  const { tracking, updateTracking, settings } = useDriverStore();
  const [isTracking, setIsTracking] = useState(tracking.isActive);
  const [currentPos, setCurrentPos] = useState<GeolocationPosition | null>(null);
  const watchId = useRef<number | null>(null);
  const startTime = useRef<number | null>(tracking.startTime);

  const startTracking = () => {
    if (!navigator.geolocation) {
      alert('Geolocalização não suportada pelo seu navegador.');
      return;
    }

    const start = Date.now();
    startTime.current = start;
    setIsTracking(true);
    updateTracking({
      isActive: true,
      startTime: start,
      distance: 0,
      avgSpeed: 0,
      duration: 0
    });

    watchId.current = navigator.geolocation.watchPosition(
      (position) => {
        setCurrentPos(position);
        // Logic to calculate distance between points would go here
        // For simplicity in this demo, we'll simulate distance based on speed if available
        if (position.coords.speed) {
          const speedKmh = position.coords.speed * 3.6;
          updateTracking({
            avgSpeed: speedKmh,
            // distance: tracking.distance + (speedKmh * (interval / 3600))
          });
        }
      },
      (error) => console.error(error),
      { enableHighAccuracy: true }
    );
  };

  const stopTracking = () => {
    if (watchId.current !== null) {
      navigator.geolocation.clearWatch(watchId.current);
    }
    setIsTracking(false);
    updateTracking({ isActive: false });
  };

  useEffect(() => {
    let interval: any;
    if (isTracking) {
      interval = setInterval(() => {
        const now = Date.now();
        const duration = (now - (startTime.current || now)) / 1000; // seconds
        updateTracking({ duration });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTracking]);

  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const estimatedFuel = (tracking.distance / (Number(settings.kmPerLiter) || 10)) * (Number(settings.fuelPrice) || 5.8);

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Rastreamento</h1>
          <p className="text-zinc-500">Monitoramento em tempo real</p>
        </div>
        <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${isTracking ? "bg-emerald-100 text-emerald-600 animate-pulse" : "bg-zinc-100 text-zinc-500"}`}>
          {isTracking ? "Gravando" : "Inativo"}
        </div>
      </header>

      <Card className={isTracking ? "border-emerald-500 bg-emerald-50/30 dark:bg-emerald-500/5" : ""}>
        <CardContent className="p-8 text-center">
          <div className="mb-8">
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-2">Tempo de Atividade</p>
            <h2 className="text-5xl font-mono font-bold tracking-tighter">
              {formatDuration(tracking.duration)}
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-8 mb-8">
            <div>
              <p className="text-[10px] text-zinc-500 font-bold uppercase mb-1">Distância</p>
              <p className="text-2xl font-bold">{tracking.distance.toFixed(2)} <span className="text-sm font-normal text-zinc-400">km</span></p>
            </div>
            <div>
              <p className="text-[10px] text-zinc-500 font-bold uppercase mb-1">Vel. Média</p>
              <p className="text-2xl font-bold">{tracking.avgSpeed.toFixed(1)} <span className="text-sm font-normal text-zinc-400">km/h</span></p>
            </div>
          </div>

          <Button 
            size="lg" 
            className={`w-full h-16 rounded-2xl text-lg font-bold gap-3 ${isTracking ? "bg-red-500 hover:bg-red-600" : "bg-emerald-600 hover:bg-emerald-700"}`}
            onClick={isTracking ? stopTracking : startTracking}
          >
            {isTracking ? <><Square size={24} /> Parar Rastreamento</> : <><Play size={24} /> Iniciar Rastreamento</>}
          </Button>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-4">
        <StatCard 
          icon={Fuel} 
          label="Custo Est. Combustível" 
          value={formatCurrency(estimatedFuel)} 
          color="text-orange-500" 
        />
        <StatCard 
          icon={Gauge} 
          label="Consumo Médio" 
          value={`${settings.kmPerLiter || 10} km/L`} 
          color="text-blue-500" 
        />
      </div>

      <Card>
        <CardContent className="p-6">
          <h3 className="font-bold mb-4 flex items-center gap-2">
            <Navigation size={20} className="text-emerald-600" />
            Informações de GPS
          </h3>
          {currentPos ? (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-zinc-500">Latitude</span>
                <span className="font-mono">{currentPos.coords.latitude.toFixed(6)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Longitude</span>
                <span className="font-mono">{currentPos.coords.longitude.toFixed(6)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Precisão</span>
                <span className="font-mono">{currentPos.coords.accuracy.toFixed(1)}m</span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-zinc-500 italic text-center py-4">
              Aguardando sinal de GPS...
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

const StatCard = ({ icon: Icon, label, value, color }: any) => (
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
