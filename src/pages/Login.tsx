import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useDriverStore } from '../store';
import { Card, CardContent, Button, Input } from '../components/UI';
import { LogIn, Mail, Lock, AlertCircle, Loader2, ArrowLeft } from 'lucide-react';

export const Login = () => {
  const navigate = useNavigate();
  const { setUser } = useDriverStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEmailValid = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const isFormValid = isEmailValid(email) && password.length >= 6;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;

      if (data.user) {
        setUser({
          id: data.user.id,
          email: data.user.email!,
          name: data.user.user_metadata.name,
        });
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {!isSupabaseConfigured && (
          <Card className="bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-900/30">
            <CardContent className="p-4 flex items-start gap-3">
              <AlertCircle className="text-amber-600 shrink-0 mt-0.5" size={20} />
              <div>
                <h3 className="text-sm font-bold text-amber-800 dark:text-amber-400">Sincronização Indisponível</h3>
                <p className="text-xs text-amber-700 dark:text-amber-500 mt-1">
                  O login requer configuração do Supabase. Use o modo visitante ou configure as chaves de API.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="text-center">
          <Link to="/" className="inline-flex items-center gap-2 text-zinc-500 hover:text-emerald-600 transition-colors mb-8">
            <ArrowLeft size={16} />
            <span>Voltar</span>
          </Link>
          <h1 className="text-3xl font-bold text-emerald-600">DriverDash</h1>
          <p className="text-zinc-500 mt-2">Acesse sua conta para sincronizar dados</p>
        </div>

        <Card>
          <CardContent className="p-6">
            <form onSubmit={handleLogin} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-xl flex items-center gap-2 text-red-600 dark:text-red-400 text-sm">
                  <AlertCircle size={18} />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-500 uppercase">E-mail</label>
                <div className="relative">
                  <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <Input 
                    type="email" 
                    className="pl-10" 
                    placeholder="seu@email.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-500 uppercase">Senha</label>
                <div className="relative">
                  <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <Input 
                    type="password" 
                    className="pl-10" 
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 font-bold" 
                disabled={loading || !isFormValid}
              >
                {loading ? <Loader2 className="animate-spin" /> : <><LogIn size={20} className="mr-2" /> Entrar</>}
              </Button>
            </form>

            <div className="mt-6 text-center space-y-2">
              <p className="text-sm text-zinc-500">
                Não tem uma conta? <Link to="/register" className="text-emerald-600 font-bold hover:underline">Cadastre-se</Link>
              </p>
              <Link to="/forgot-password" size="sm" className="text-xs text-zinc-400 hover:text-emerald-600 transition-colors">
                Esqueci minha senha
              </Link>
            </div>
          </CardContent>
        </Card>

        <div className="text-center">
          <Button variant="outline" onClick={() => navigate('/dashboard')} className="text-zinc-500 border-zinc-200">
            Continuar como Visitante (Offline)
          </Button>
        </div>
      </div>
    </div>
  );
};
