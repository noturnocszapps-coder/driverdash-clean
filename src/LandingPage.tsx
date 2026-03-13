import React from 'react';
import { Link } from 'react-router-dom';
import { Car, TrendingUp, Fuel, BarChart3, Shield } from 'lucide-react';
import { Button } from './components/UI';

export const LandingPage = () => {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col">

      {/* HEADER */}
      <header className="w-full border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-emerald-600 font-bold text-xl">
            <Car size={26} />
            DriverDash
          </div>

          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button variant="outline">Entrar</Button>
            </Link>

            <Link to="/register">
              <Button className="bg-emerald-600 hover:bg-emerald-700">
                Criar Conta
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="flex-1 flex items-center">
        <div className="max-w-6xl mx-auto px-4 py-16 grid md:grid-cols-2 gap-12 items-center">

          <div>
            <h1 className="text-4xl font-bold leading-tight">
              Controle financeiro para
              <span className="text-emerald-600"> motoristas de aplicativo</span>
            </h1>

            <p className="text-zinc-500 mt-6 text-lg">
              Gerencie ganhos, combustível, manutenção e despesas do seu carro
              em um único painel inteligente.
            </p>

            <div className="mt-8 flex gap-4">
              <Link to="/register">
                <Button className="h-12 px-6 bg-emerald-600 hover:bg-emerald-700 font-bold">
                  Começar Agora
                </Button>
              </Link>

              <Link to="/login">
                <Button variant="outline" className="h-12 px-6">
                  Fazer Login
                </Button>
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">

            <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800">
              <TrendingUp className="text-emerald-600 mb-3" />
              <h3 className="font-bold">Controle de ganhos</h3>
              <p className="text-sm text-zinc-500 mt-2">
                Registre corridas e acompanhe seus lucros.
              </p>
            </div>

            <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800">
              <Fuel className="text-emerald-600 mb-3" />
              <h3 className="font-bold">Consumo de combustível</h3>
              <p className="text-sm text-zinc-500 mt-2">
                Calcule o custo real do seu carro.
              </p>
            </div>

            <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800">
              <BarChart3 className="text-emerald-600 mb-3" />
              <h3 className="font-bold">Relatórios inteligentes</h3>
              <p className="text-sm text-zinc-500 mt-2">
                Veja quanto realmente sobra no fim do dia.
              </p>
            </div>

            <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800">
              <Shield className="text-emerald-600 mb-3" />
              <h3 className="font-bold">Dados seguros</h3>
              <p className="text-sm text-zinc-500 mt-2">
                Sincronização protegida com Supabase.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-zinc-200 dark:border-zinc-800">
        <div className="max-w-6xl mx-auto px-4 py-6 text-sm text-zinc-500 text-center">
          DriverDash © {new Date().getFullYear()} • Plataforma para motoristas de aplicativo
        </div>
      </footer>

    </div>
  );
};