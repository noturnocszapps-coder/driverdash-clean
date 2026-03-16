import React, { useState, useRef } from 'react';
import { useDriverStore } from '../store';
import { Card, CardContent, Button, Input, Select } from '../components/UI';
import { 
  User, Car, Target, Trash2, LogOut, Download, Database, 
  Upload, RefreshCw, AlertCircle, 
  Zap, ChevronRight, Shield, History, Smartphone, Layout, Globe, ChevronDown,
  DollarSign
} from 'lucide-react';
import { downloadFile, formatCurrency, calculateDailyFixedCost, calculateMonthlyFixedCost } from '../utils';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { cn } from '../utils';
import { motion, AnimatePresence } from 'motion/react';
import { SyncIndicator } from '../components/SyncIndicator';

export const Settings = () => {
  const navigate = useNavigate();
  const { 
    settings, updateSettings, clearData, clearCloudData, 
    cycles, importData, user, setUser, syncStatus, syncData 
  } = useDriverStore();
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    navigate('/');
  };

  const handleClearData = async () => {
    setIsDeleting(true);
    try {
      if (user) {
        const result = await clearCloudData();
        if (!result.success) {
          alert('Erro ao apagar dados da nuvem. Verifique sua conexão e tente novamente.');
          setIsDeleting(false);
          return;
        }
      }
      clearData();
      setShowDeleteConfirm(false);
      alert('Todos os seus dados foram apagados com sucesso.');
    } catch (error) {
      console.error('[Settings] Error clearing data:', error);
      alert('Ocorreu um erro ao apagar os dados.');
    } finally {
      setIsDeleting(false);
    }
  };

  const exportBackup = () => {
    const data = { cycles, settings };
    downloadFile(JSON.stringify(data, null, 2), `driverdash-backup-${new Date().toISOString().split('T')[0]}.json`, 'application/json');
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.cycles || data.settings) {
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

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8 pb-24 md:pb-8"
    >
      <header className="px-1">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-1">Configurações</p>
        <h1 className="text-3xl font-black tracking-tighter">Ajustes</h1>
      </header>

      {/* Profile Section */}
      <section className="space-y-4">
        <SectionHeader icon={User} title="Perfil" />
        <Card className="border-none bg-white dark:bg-zinc-900 shadow-sm overflow-hidden">
          <CardContent className="p-6 space-y-6">
            <div className="flex items-center gap-4 pb-6 border-b border-zinc-100 dark:border-zinc-800">
              <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center text-zinc-950 text-2xl font-black">
                {settings.name?.charAt(0) || '?'}
              </div>
              <div>
                <h3 className="font-black text-lg tracking-tight">{settings.name || 'Motorista'}</h3>
                <p className="text-xs text-zinc-500 font-medium">{user?.email}</p>
                <div className="mt-2">
                  <SyncIndicator />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Nome de Exibição</label>
                <Input 
                  value={settings.name} 
                  onChange={e => updateSettings({ name: e.target.value })}
                  className="h-12 bg-zinc-50 dark:bg-zinc-800/50 border-none rounded-2xl font-bold"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Meta Diária (R$)</label>
                <Input 
                  type="number"
                  value={settings.dailyGoal} 
                  onChange={e => updateSettings({ dailyGoal: Number(e.target.value) })}
                  className="h-12 bg-zinc-50 dark:bg-zinc-800/50 border-none rounded-2xl font-black text-xl"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Platforms Section */}
      <section className="space-y-4">
        <SectionHeader icon={Smartphone} title="Plataformas" />
        <Card className="border-none bg-white dark:bg-zinc-900 shadow-sm">
          <CardContent className="p-6 space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Modo de Transporte</label>
              <Select
                value={settings.transportMode}
                onChange={e => updateSettings({ transportMode: e.target.value as any })}
                className="h-12 bg-zinc-50 dark:bg-zinc-800/50 border-none rounded-2xl font-bold"
              >
                <option value="car">Uber / 99 Carro</option>
                <option value="motorcycle">Uber / 99 Moto</option>
              </Select>
            </div>
            <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800">
              <p className="text-[10px] text-zinc-500 font-bold leading-relaxed uppercase tracking-wider">
                O DriverDash foca em Uber, 99 e inDrive para garantir a melhor experiência de fechamento financeiro.
              </p>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Panel Preferences */}
      <section className="space-y-4">
        <SectionHeader icon={Layout} title="Preferências do Painel" />
        <Card className="border-none bg-white dark:bg-zinc-900 shadow-sm">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="text-sm font-bold">Tema do Aplicativo</p>
                <p className="text-[10px] text-zinc-500 font-medium">Sempre Escuro (Otimizado)</p>
              </div>
              <div className="w-10 h-6 bg-emerald-500 rounded-full relative">
                <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Vehicle Costs Section */}
      <section className="space-y-4">
        <SectionHeader icon={Car} title="Custos do Veículo" />
        <Card className="border-none bg-white dark:bg-zinc-900 shadow-sm">
          <CardContent className="p-6 space-y-6">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Tipo de Veículo</label>
              <Select
                value={settings.fixedCosts?.vehicleType || 'owned'}
                onChange={e => updateSettings({ 
                  fixedCosts: { 
                    ...(settings.fixedCosts || { vehicleType: 'owned' }), 
                    vehicleType: e.target.value as any 
                  } 
                })}
                className="h-12 bg-zinc-50 dark:bg-zinc-800/50 border-none rounded-2xl font-bold"
              >
                <option value="owned">Veículo Próprio</option>
                <option value="rented">Veículo Alugado</option>
              </Select>
            </div>

            {settings.fixedCosts?.vehicleType === 'owned' ? (
              <div className="grid grid-cols-2 gap-4">
                <CostInput 
                  label="Seguro" 
                  value={settings.fixedCosts?.insurance} 
                  onChange={val => updateSettings({ fixedCosts: { ...settings.fixedCosts!, insurance: val } })} 
                />
                <CostInput 
                  label="IPVA" 
                  value={settings.fixedCosts?.ipva} 
                  onChange={val => updateSettings({ fixedCosts: { ...settings.fixedCosts!, ipva: val } })} 
                />
                <CostInput 
                  label="Troca de Óleo" 
                  value={settings.fixedCosts?.oilChange} 
                  onChange={val => updateSettings({ fixedCosts: { ...settings.fixedCosts!, oilChange: val } })} 
                />
                <CostInput 
                  label="Pneus" 
                  value={settings.fixedCosts?.tires} 
                  onChange={val => updateSettings({ fixedCosts: { ...settings.fixedCosts!, tires: val } })} 
                />
                <CostInput 
                  label="Manutenção" 
                  value={settings.fixedCosts?.maintenance} 
                  onChange={val => updateSettings({ fixedCosts: { ...settings.fixedCosts!, maintenance: val } })} 
                />
                <CostInput 
                  label="Parcela" 
                  value={settings.fixedCosts?.financing} 
                  onChange={val => updateSettings({ fixedCosts: { ...settings.fixedCosts!, financing: val } })} 
                />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Tipo de Aluguel</label>
                  <Select
                    value={settings.fixedCosts?.rentalPeriod || 'weekly'}
                    onChange={e => updateSettings({ 
                      fixedCosts: { 
                        ...(settings.fixedCosts || { vehicleType: 'rented' }), 
                        rentalPeriod: e.target.value as any 
                      } 
                    })}
                    className="h-12 bg-zinc-50 dark:bg-zinc-800/50 border-none rounded-2xl font-bold"
                  >
                    <option value="weekly">Semanal</option>
                    <option value="monthly">Mensal</option>
                  </Select>
                </div>
                <CostInput 
                  label="Valor do Aluguel" 
                  value={settings.fixedCosts?.rentalValue} 
                  onChange={val => updateSettings({ fixedCosts: { ...settings.fixedCosts!, rentalValue: val } })} 
                />
              </div>
            )}

            <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
              <div>
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Custo Fixo Diário</p>
                <p className="text-xl font-black text-emerald-500">
                  {formatCurrency(calculateDailyFixedCost(settings.fixedCosts))}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Total Mensal</p>
                <p className="text-sm font-bold text-zinc-400">
                  {formatCurrency(calculateMonthlyFixedCost(settings.fixedCosts))}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Data Section */}
      <section className="space-y-4">
        <SectionHeader icon={Database} title="Dados" />
        <Card className="border-none bg-white dark:bg-zinc-900 shadow-sm">
          <CardContent className="p-6 space-y-4">
            <SettingsItem 
              icon={Download} 
              title="Exportar Backup" 
              description="Salvar seus dados em um arquivo JSON"
              onClick={exportBackup}
              color="text-blue-500"
            />
            <SettingsItem 
              icon={Upload} 
              title="Importar Backup" 
              description="Restaurar dados de um arquivo anterior"
              onClick={() => fileInputRef.current?.click()}
              color="text-emerald-500"
            />
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept=".json"
              onChange={handleImportBackup}
            />
            <SettingsItem 
              icon={RefreshCw} 
              title="Sincronizar Agora" 
              description="Forçar atualização com a nuvem"
              onClick={() => syncData()}
              color="text-zinc-400"
              loading={syncStatus === 'syncing'}
            />
          </CardContent>
        </Card>
      </section>

      {/* System Section (Patch Notes) */}
      <section className="space-y-4">
        <SectionHeader icon={History} title="Sistema" />
        <Card className="border-none bg-white dark:bg-zinc-900 shadow-sm overflow-hidden">
          <CardContent className="p-0">
            <PatchNotes />
          </CardContent>
        </Card>
      </section>

      {/* Danger Zone */}
      <section className="space-y-4">
        <SectionHeader icon={Shield} title="Zona de Perigo" />
        <Card className="border-none bg-red-50 dark:bg-red-500/5 border-red-100 dark:border-red-500/10">
          <CardContent className="p-6 space-y-4">
            <button 
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center justify-between w-full group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center text-red-500">
                  <Trash2 size={20} />
                </div>
                <div className="text-left">
                  <p className="text-sm font-black text-red-500">Limpar Todos os Dados</p>
                  <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Apagar histórico local e nuvem</p>
                </div>
              </div>
              <ChevronRight size={18} className="text-red-300 group-hover:text-red-500 transition-colors" />
            </button>
            <div className="h-px bg-red-100 dark:bg-red-500/10" />
            <button 
              onClick={handleLogout}
              className="flex items-center justify-between w-full group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500">
                  <LogOut size={20} />
                </div>
                <div className="text-left">
                  <p className="text-sm font-black text-zinc-900 dark:text-white">Sair da Conta</p>
                  <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Desconectar deste dispositivo</p>
                </div>
              </div>
              <ChevronRight size={18} className="text-zinc-300 group-hover:text-zinc-950 dark:group-hover:text-white transition-colors" />
            </button>
          </CardContent>
        </Card>
      </section>

      <div className="text-center py-8 space-y-2">
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-300 dark:text-zinc-800">DriverDash Beta</p>
        <p className="text-[10px] text-zinc-400 font-bold">v2.1.0 • Build 20260316</p>
        <p className="text-[10px] text-zinc-500 font-medium mt-2">Versão Beta — o aplicativo está em fase de testes. Atualmente é gratuito enquanto coletamos feedback e corrigimos possíveis bugs.</p>
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDeleteConfirm(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="fixed inset-0 m-auto w-full max-w-xs h-fit z-[110] p-6"
            >
              <Card className="border-none bg-white dark:bg-zinc-900 shadow-2xl rounded-[2.5rem] overflow-hidden">
                <CardContent className="p-8 space-y-6">
                  <div className="w-20 h-20 bg-red-100 dark:bg-red-500/10 rounded-[2rem] flex items-center justify-center text-red-500 mx-auto">
                    <AlertCircle size={40} />
                  </div>
                  
                  <div className="text-center space-y-2">
                    <h3 className="text-2xl font-black tracking-tighter">Apagar tudo?</h3>
                    <p className="text-sm text-zinc-500 font-medium leading-relaxed">
                      Essa ação é irreversível. Todos os seus ciclos e configurações serão removidos.
                    </p>
                  </div>

                  <div className="flex flex-col gap-3">
                    <Button 
                      variant="danger" 
                      onClick={handleClearData}
                      disabled={isDeleting}
                      className="w-full h-16 text-lg font-black rounded-2xl shadow-xl shadow-red-500/20"
                    >
                      {isDeleting ? 'Apagando...' : 'Confirmar'}
                    </Button>
                    <Button 
                      variant="ghost" 
                      onClick={() => setShowDeleteConfirm(false)}
                      disabled={isDeleting}
                      className="w-full h-12 text-sm font-bold text-zinc-400"
                    >
                      Cancelar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const SectionHeader = ({ icon: Icon, title }: any) => (
  <div className="flex items-center gap-2 px-1">
    <Icon size={16} className="text-emerald-500" />
    <h3 className="text-xs font-black uppercase tracking-widest text-zinc-500">{title}</h3>
  </div>
);

const CostInput = ({ label, value, onChange }: { label: string, value?: number, onChange: (val: number) => void }) => (
  <div className="space-y-1.5">
    <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest ml-1">{label}</label>
    <Input 
      type="number"
      value={value || ''} 
      onChange={e => onChange(Number(e.target.value))}
      className="h-10 bg-zinc-50 dark:bg-zinc-800/50 border-none rounded-xl font-bold text-sm"
      placeholder="0,00"
    />
  </div>
);

const SettingsItem = ({ icon: Icon, title, description, onClick, color, loading }: any) => (
  <button 
    onClick={onClick}
    className="flex items-center justify-between w-full group py-2"
  >
    <div className="flex items-center gap-4">
      <div className={cn("w-10 h-10 rounded-xl bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center transition-colors", color)}>
        <Icon size={20} className={cn(loading && "animate-spin")} />
      </div>
      <div className="text-left">
        <p className="text-sm font-bold tracking-tight">{title}</p>
        <p className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider">{description}</p>
      </div>
    </div>
    <ChevronRight size={18} className="text-zinc-200 group-hover:text-emerald-500 transition-colors" />
  </button>
);

const PatchNotes = () => {
  const [expanded, setExpanded] = useState<string | null>('2.1.0');

  const versions = [
    {
      id: '2.1.0',
      date: '16 Mar, 2026',
      notes: [
        'Novo sistema de ciclos financeiros de 24h.',
        'Dashboard focado em performance e progresso.',
        'Lançamento rápido com modal bottom-sheet.',
        'Relatórios semanais com mix de plataformas.',
        'Interface premium inspirada em SaaS modernos.'
      ]
    },
    {
      id: '2.0.5',
      date: '10 Mar, 2026',
      notes: [
        'Otimização de sincronização com Supabase.',
        'Correção de erros no login persistente.',
        'Melhoria na exportação de backup JSON.'
      ]
    }
  ];

  return (
    <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
      {versions.map((v) => (
        <div key={v.id} className="overflow-hidden">
          <button 
            onClick={() => setExpanded(expanded === v.id ? null : v.id)}
            className="w-full p-6 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                <Zap size={16} />
              </div>
              <div className="text-left">
                <p className="text-sm font-black tracking-tight">Versão {v.id}</p>
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">{v.date}</p>
              </div>
            </div>
            <ChevronDown 
              size={18} 
              className={cn("text-zinc-300 transition-transform duration-300", expanded === v.id && "rotate-180")} 
            />
          </button>
          <AnimatePresence>
            {expanded === v.id && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="px-6 pb-6 pt-2 space-y-3">
                  {v.notes.map((note, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                      <p className="text-xs text-zinc-600 dark:text-zinc-400 font-medium leading-relaxed">{note}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
};
