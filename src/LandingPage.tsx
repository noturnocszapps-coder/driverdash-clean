import React from 'react';
import { Link } from 'react-router-dom';
import { Car, ArrowRight, Shield, TrendingUp, Clock, Smartphone } from 'lucide-react';
import { Button } from './components/UI';

export const LandingPage = () => {
  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Car className="text-emerald-600" />
            <span className="text-xl font-bold">DriverDash</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/login" className="hidden sm:block text-sm font-bold text-zinc-500 hover:text-emerald-600 transition-colors">
              Entrar
            </Link>
            <Link to="/dashboard">
              <Button variant="secondary">Entrar no Painel</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
            Assuma o controle total dos seus <span className="text-emerald-600">ganhos no volante.</span>
          </h1>
          <p className="text-xl text-zinc-500 mb-10 max-w-2xl mx-auto">
            A ferramenta definitiva para motoristas de Uber, 99 e particulares. 
            Gerencie corridas, despesas e manutenção em um só lugar.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register">
              <Button className="h-14 px-8 text-lg w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700">
                Criar Conta Grátis <ArrowRight size={20} />
              </Button>
            </Link>
            <Link to="/dashboard">
              <Button variant="outline" className="h-14 px-8 text-lg w-full sm:w-auto border-zinc-200">
                Acessar Painel
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-zinc-50 dark:bg-zinc-900/50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={TrendingUp}
              title="Dashboard Financeiro"
              description="Visualize seu faturamento, lucro líquido e custo por km em tempo real."
            />
            <FeatureCard 
              icon={Clock}
              title="Gestão de Tempo"
              description="Acompanhe suas horas online e descubra seus horários mais lucrativos."
            />
            <FeatureCard 
              icon={Shield}
              title="Manutenção Preventiva"
              description="Nunca mais perca o prazo da troca de óleo ou revisão do seu veículo."
            />
          </div>
        </div>
      </section>

      {/* Mobile First Section */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-12">
          <div className="flex-1">
            <h2 className="text-4xl font-bold mb-6">Acesse de qualquer lugar.</h2>
            <p className="text-lg text-zinc-500 mb-8">
              O DriverDash é uma plataforma web moderna e responsiva. 
              Interface rápida, intuitiva e sincronizada em tempo real com a nuvem.
            </p>
            <ul className="space-y-4">
              <li className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center text-emerald-600">✓</div>
                <span>Sincronização em tempo real</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center text-emerald-600">✓</div>
                <span>Exportação em CSV e JSON</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center text-emerald-600">✓</div>
                <span>Privacidade total dos seus dados</span>
              </li>
            </ul>
          </div>
          <div className="flex-1 flex justify-center">
            <div className="relative w-64 h-[500px] bg-zinc-900 rounded-[3rem] border-8 border-zinc-800 shadow-2xl overflow-hidden">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-zinc-800 rounded-b-2xl z-10"></div>
              <div className="p-4 pt-10">
                <div className="h-32 bg-emerald-600 rounded-2xl mb-4 animate-pulse"></div>
                <div className="space-y-3">
                  <div className="h-4 bg-zinc-800 rounded w-3/4"></div>
                  <div className="h-4 bg-zinc-800 rounded w-1/2"></div>
                  <div className="h-20 bg-zinc-800 rounded-xl"></div>
                  <div className="h-20 bg-zinc-800 rounded-xl"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-zinc-200 dark:border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 text-center text-zinc-500">
          <p>© 2026 DriverDash. O seu parceiro na estrada.</p>
        </div>
      </footer>
    </div>
  );
};

const FeatureCard = ({ icon: Icon, title, description }: any) => (
  <div className="p-8 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 hover:border-emerald-500 transition-colors">
    <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-500/20 rounded-2xl flex items-center justify-center text-emerald-600 mb-6">
      <Icon size={24} />
    </div>
    <h3 className="text-xl font-bold mb-3">{title}</h3>
    <p className="text-zinc-500 leading-relaxed">{description}</p>
  </div>
);
