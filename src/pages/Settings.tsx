import React, { useEffect, useState, useRef } from 'react';
import { useDriverStore } from '../store';
import { Card, CardContent, Button, Input, Select } from '../components/UI';
import { Settings as SettingsIcon, User, Car, Target, Trash2, LogOut, Download, Smartphone, Database, Upload, FileJson, Cloud, CloudOff, RefreshCw, CheckCircle, AlertCircle, Info, Zap, Package, MapPin, LayoutGrid, Layers } from 'lucide-react';
import { downloadFile } from '../utils';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { PlatformType, TransportMode } from '../types';

const PLATFORMS: { id: PlatformType; label: string; icon: any }[] = [
  { id: 'uber_car', label: 'Uber (Carro)', icon: Car },
  { id: 'noventanove_car', label: '99 (Carro)', icon: Car },
  { id: 'indrive_car', label: 'inDrive (Carro)', icon: Car },
  { id: 'uber_moto', label: 'Uber Moto', icon: Zap },
  { id: 'noventanove_moto', label: '99 Moto', icon: Zap },
  { id: 'indrive_moto', label: 'inDrive Moto', icon: Zap },
  { id: 'ifood', label: 'iFood', icon: MapPin },
  { id: 'shopee', label: 'Shopee', icon: Package },
  { id: 'mercadolivre', label: 'Mercado Livre', icon: Package },
];

const TRANSPORT_MODES: { id: TransportMode; label: string }[] = [
  { id: 'car', label: 'Carro' },
  { id: 'motorcycle', label: 'Moto' },
  { id: 'bicycle', label: 'Bicicleta' },
  { id: 'scooter', label: 'Patinete/Scooter' },
  { id: 'walking', label: 'A pé' },
];

export const Settings = () => {
  const navigate = useNavigate();
  const { settings, updateSettings, clearData, rides, workLogs, faturamentoLogs, expenses, fuelings, maintenances, importData, user, setUser, syncStatus, setSyncStatus, syncData } = useDriverStore();
  const [isMigrating, setIsMigrating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const togglePlatform = (platformId: PlatformType) => {
    const current = settings.activePlatforms || [];
    const updated = current.includes(platformId)
      ? current.filter(id => id !== platformId)
      : [...current, platformId];
    
    if (updated.length === 0) return; // Must have at least one
    updateSettings({ activePlatforms: updated });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    navigate('/');
  };

  const handleClearData = () => {
    if (confirm('Tem certeza que deseja apagar todos os dados? Esta ação não pode ser desfeita.')) {
      clearData();
      alert('Dados apagados com sucesso.');
    }
  };

  const exportBackup = () => {
    const data = { rides, workLogs, expenses, fuelings, maintenances, settings };
    downloadFile(JSON.stringify(data, null, 2), `driverdash-backup-${new Date().toISOString().split('T')[0]}.json`, 'application/json');
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.rides || data.expenses || data.workLogs) {
          importData(data);
          alert('Backup importado com sucesso!');
        } else {
          alert('Arquivo de backup inválido.');
        }
      } catch (err) {
        alert('Erro ao ler o arquivo de backup.');
      }
    };
    reader.readAsText(file);
  };

  const migrateToCloud = async () => {
    if (!user) return;
    setIsMigrating(true);
    setSyncStatus('syncing');
    console.log('[Settings] Starting manual migration to cloud...');

    try {
      // Migrate Trips
      if (rides.length > 0) {
        console.log(`[Settings] Migrating ${rides.length} rides...`);
        const tripsToInsert = rides.map(r => ({
          id: r.id,
          user_id: user.id,
          date: r.date,
          app: r.app,
          gross: r.grossValue,
          tips: r.tips,
          bonus: r.bonus,
          hours_online: r.onlineHours,
          km_driven: r.kmDriven,
          passenger_paid_amount: r.passengerPaid
        }));
        await supabase.from('trips').upsert(tripsToInsert);
      }

      // Migrate Work Logs
      if (workLogs.length > 0) {
        const logsToInsert = workLogs.map(l => ({
          id: l.id,
          user_id: user.id,
          platform_type: l.platform_type,
          date: l.date,
          gross_amount: l.gross_amount,
          passenger_cash_amount: l.passenger_cash_amount,
          tips_amount: l.tips_amount,
          bonus_amount: l.bonus_amount,
          hours_worked: l.hours_worked,
          km_driven: l.km_driven,
          deliveries_count: l.deliveries_count,
          rides_count: l.rides_count,
          packages_count: l.packages_count,
          routes_count: l.routes_count,
          notes: l.notes
        }));
        await supabase.from('work_logs').upsert(logsToInsert);
      }

      // Migrate Faturamento Logs
      if (faturamentoLogs.length > 0) {
        const fatToInsert = faturamentoLogs.map(l => ({
          id: l.id,
          user_id: user.id,
          date: l.date,
          vehicle_mode: l.vehicle_mode,
          uber_amount: l.uber_amount,
          noventanove_amount: l.noventanove_amount,
          indriver_amount: l.indriver_amount,
          extra_amount: l.extra_amount,
          km_total: l.km_total,
          active_hours_total: l.active_hours_total,
          fuel_total: l.fuel_total,
          fuel_price: l.fuel_price,
          fuel_type: l.fuel_type,
          additional_expense: l.additional_expense,
          notes: l.notes
        }));
        await supabase.from('faturamento_logs').upsert(fatToInsert);
      }

      // Migrate Expenses
      if (expenses.length > 0) {
        const expensesToInsert = expenses.map(e => ({
          id: e.id,
          user_id: user.id,
          date: e.date,
          category: e.category,
          value: e.value,
          description: e.description
        }));
        await supabase.from('expenses').upsert(expensesToInsert);
      }

      // Migrate Fuel
      if (fuelings.length > 0) {
        const fuelToInsert = fuelings.map(f => ({
          id: f.id,
          user_id: user.id,
          date: f.date,
          liters: f.liters,
          cost: f.value,
          odometer: f.odometer
        }));
        await supabase.from('fuel_logs').upsert(fuelToInsert);
      }

      // Migrate Maintenance
      if (maintenances.length > 0) {
        const maintToInsert = maintenances.map(m => ({
          id: m.id,
          user_id: user.id,
          date: m.date,
          type: m.type,
          cost: m.value,
          odometer: m.currentKm,
          next_change_km: m.nextChangeKm
        }));
        await supabase.from('maintenance_logs').upsert(maintToInsert);
      }

      // Migrate Settings
      console.log('[Settings] Migrating profile settings...');
      await supabase.from('profiles').upsert({
        id: user.id,
        name: settings.name,
        vehicle: settings.vehicle,
        daily_goal: settings.dailyGoal,
        km_per_liter: settings.kmPerLiter,
        fuel_price: settings.fuelPrice,
        active_platforms: settings.activePlatforms,
        transport_mode: settings.transportMode,
        dashboard_mode: settings.dashboardMode
      });

      console.log('[Settings] Migration completed successfully');
      alert('Dados sincronizados com sucesso na nuvem!');
      setSyncStatus('synced');
      setTimeout(() => setSyncStatus('idle'), 3000);
    } catch (err) {
      console.error('[Settings] Migration error:', err);
      alert('Erro ao sincronizar dados. Verifique sua conexão.');
      setSyncStatus('offline');
    } finally {
      setIsMigrating(false);
    }
  };

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      <header>
        <h1 className="text-2xl font-bold">Configurações</h1>
        <p className="text-zinc-500">Personalize sua experiência Multi-Plataforma</p>
      </header>

      {user ? (
        <Card className="bg-blue-600 text-white border-none">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <Cloud size={20} />
                </div>
                <div>
                  <h3 className="font-bold">Sincronização Ativa</h3>
                  <p className="text-xs text-blue-100">{user.email}</p>
                </div>
              </div>
              <div className="px-3 py-1 bg-white/20 rounded-full text-[10px] font-bold uppercase">
                {syncStatus === 'synced' ? 'Sincronizado' : 
                 syncStatus === 'syncing' ? 'Sincronizando...' : 
                 syncStatus === 'idle' ? 'Conectado' : 'Offline'}
              </div>
            </div>
            
            {(rides.length > 0 || workLogs.length > 0 || expenses.length > 0) && (
              <div className="p-3 bg-white/10 rounded-xl mb-4">
                <p className="text-xs mb-2">Existem dados locais que podem não estar na nuvem.</p>
                <Button 
                  onClick={migrateToCloud} 
                  disabled={isMigrating}
                  className="w-full bg-white text-blue-600 hover:bg-blue-50 h-9 text-sm font-bold"
                >
                  {isMigrating ? <RefreshCw className="animate-spin" size={18} /> : 'Sincronizar Dados Locais Agora'}
                </Button>
              </div>
            )}

            <Button onClick={handleLogout} variant="outline" className="w-full border-white/30 text-white hover:bg-white/10 h-9 text-sm">
              Sair da Conta
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-zinc-100 dark:bg-zinc-900 border-none">
          <CardContent className="p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600 rounded-xl flex items-center justify-center shrink-0">
                <CloudOff size={24} />
              </div>
              <div>
                <h3 className="font-bold">Modo Visitante</h3>
                <p className="text-xs text-zinc-500">Seus dados estão sendo armazenados localmente no navegador.</p>
              </div>
            </div>
            <Button onClick={() => navigate('/login')} className="w-full bg-emerald-600 hover:bg-emerald-700 font-bold">
              Entrar ou Criar Conta
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-6 space-y-6">
          <div className="space-y-4">
            <h3 className="font-bold flex items-center gap-2">
              <LayoutGrid size={20} className="text-emerald-600" />
              Plataformas Ativas
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {PLATFORMS.map(p => {
                const isActive = settings.activePlatforms?.includes(p.id);
                return (
                  <button
                    key={p.id}
                    onClick={() => togglePlatform(p.id)}
                    className={cn(
                      "flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all text-center gap-2",
                      isActive 
                        ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600" 
                        : "border-zinc-100 dark:border-zinc-800 text-zinc-500 hover:border-zinc-200"
                    )}
                  >
                    <p.icon size={20} />
                    <span className="text-[10px] font-bold uppercase leading-tight">{p.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-bold flex items-center gap-2">
              <Layers size={20} className="text-emerald-600" />
              Preferências do Painel
            </h3>
            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-500 uppercase">Modo de Visualização</label>
              <Select
                value={settings.dashboardMode}
                onChange={e => updateSettings({ dashboardMode: e.target.value as 'merged' | 'segmented' })}
              >
                <option value="merged">Combinado (Total de todas plataformas)</option>
                <option value="segmented">Segmentado (Por plataforma)</option>
              </Select>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-bold flex items-center gap-2">
              <User size={20} className="text-emerald-600" />
              Perfil e Transporte
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-500 uppercase">Nome do Motorista</label>
                <Input 
                  value={settings.name} 
                  onChange={e => updateSettings({ name: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-500 uppercase">Modo de Transporte</label>
                <Select
                  value={settings.transportMode}
                  onChange={e => updateSettings({ transportMode: e.target.value as TransportMode })}
                >
                  {TRANSPORT_MODES.map(m => (
                    <option key={m.id} value={m.id}>{m.label}</option>
                  ))}
                </Select>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-bold flex items-center gap-2">
              <Car size={20} className="text-emerald-600" />
              Veículo e Custos
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-500 uppercase">Modelo do Veículo</label>
                <Input 
                  value={settings.vehicle} 
                  onChange={e => updateSettings({ vehicle: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-500 uppercase">Consumo Médio (KM/L)</label>
                <Input 
                  type="number"
                  value={settings.kmPerLiter} 
                  onChange={e => updateSettings({ kmPerLiter: Number(e.target.value) })}
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-bold flex items-center gap-2">
              <Target size={20} className="text-emerald-600" />
              Metas
            </h3>
            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-500 uppercase">Meta Diária (R$)</label>
              <Input 
                type="number"
                value={settings.dailyGoal} 
                onChange={e => updateSettings({ dailyGoal: Number(e.target.value) })}
              />
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
            <Button 
              onClick={() => syncData()} 
              disabled={syncStatus === 'syncing'}
              className="w-full h-14 text-lg font-bold rounded-2xl shadow-xl shadow-emerald-500/20 gap-2"
            >
              {syncStatus === 'syncing' ? (
                <>
                  <RefreshCw className="animate-spin" size={20} />
                  Sincronizando...
                </>
              ) : (
                <>
                  <CheckCircle size={20} />
                  Salvar Configurações
                </>
              )}
            </Button>
            <p className="text-[10px] text-center text-zinc-500 uppercase font-bold tracking-widest">
              Sincroniza automaticamente com a nuvem
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6 space-y-4">
          <h3 className="font-bold flex items-center gap-2">
            <Database size={20} className="text-emerald-600" />
            Backup e Dados
          </h3>
          <p className="text-sm text-zinc-500">
            Exporte seus dados para segurança ou importe de outro dispositivo.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <Button variant="outline" onClick={exportBackup} className="gap-2">
              <Download size={18} /> Exportar
            </Button>
            <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="gap-2">
              <Upload size={18} /> Importar
            </Button>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept=".json"
              onChange={handleImportBackup}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border-red-200 dark:border-red-900/30">
        <CardContent className="p-6 space-y-4">
          <h3 className="font-bold text-red-500 flex items-center gap-2">
            <Trash2 size={20} />
            Zona de Perigo
          </h3>
          <p className="text-sm text-zinc-500">
            Apagar todos os dados de corridas, despesas e abastecimentos salvos localmente.
          </p>
          <Button variant="danger" onClick={handleClearData} className="w-full">
            Limpar Todos os Dados
          </Button>
        </CardContent>
      </Card>

      <div className="text-center py-8">
        <p className="text-xs text-zinc-500">DriverDash MultiPlataforma v2.0.0</p>
        <p className="text-xs text-zinc-400 mt-1">Desenvolvido para motoristas e entregadores parceiros</p>
      </div>
    </div>
  );
};

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
