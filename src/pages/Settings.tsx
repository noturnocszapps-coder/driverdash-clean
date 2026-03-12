import React, { useEffect, useState, useRef } from 'react';
import { useDriverStore } from '../store';
import { Card, CardContent, Button, Input } from '../components/UI';
import { Settings as SettingsIcon, User, Car, Target, Trash2, LogOut, Download, Smartphone, Database, Upload, FileJson, Cloud, CloudOff, RefreshCw, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { downloadFile } from '../utils';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

export const Settings = () => {
  const navigate = useNavigate();
  const { settings, updateSettings, clearData, rides, expenses, fuelings, maintenances, importData, user, setUser, syncStatus, setSyncStatus } = useDriverStore();
  const [isMigrating, setIsMigrating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    const data = { rides, expenses, fuelings, maintenances, settings };
    downloadFile(JSON.stringify(data, null, 2), `driverdash-backup-${new Date().toISOString().split('T')[0]}.json`, 'application/json');
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.rides || data.expenses) {
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

    try {
      // Migrate Trips
      if (rides.length > 0) {
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
      await supabase.from('profiles').upsert({
        id: user.id,
        name: settings.name,
        vehicle: settings.vehicle,
        daily_goal: settings.dailyGoal,
        km_per_liter: settings.kmPerLiter,
        fuel_price: settings.fuelPrice
      });

      alert('Dados sincronizados com sucesso na nuvem!');
      setSyncStatus('synced');
    } catch (err) {
      console.error(err);
      alert('Erro ao sincronizar dados.');
      setSyncStatus('offline');
    } finally {
      setIsMigrating(false);
    }
  };

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      <header>
        <h1 className="text-2xl font-bold">Configurações</h1>
        <p className="text-zinc-500">Personalize sua experiência</p>
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
                {syncStatus === 'synced' ? 'Sincronizado' : syncStatus === 'syncing' ? 'Sincronizando...' : 'Offline'}
              </div>
            </div>
            
            {(rides.length > 0 || expenses.length > 0) && (
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
              <User size={20} className="text-emerald-600" />
              Perfil
            </h3>
            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-500 uppercase">Nome do Motorista</label>
              <Input 
                value={settings.name} 
                onChange={e => updateSettings({ name: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-bold flex items-center gap-2">
              <Car size={20} className="text-emerald-600" />
              Veículo
            </h3>
            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-500 uppercase">Modelo do Veículo</label>
              <Input 
                value={settings.vehicle} 
                onChange={e => updateSettings({ vehicle: e.target.value })}
              />
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
        <p className="text-xs text-zinc-500">DriverDash v1.2.0</p>
        <p className="text-xs text-zinc-400 mt-1">Desenvolvido para motoristas parceiros</p>
      </div>
    </div>
  );
};
