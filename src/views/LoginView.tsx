import React, { useState } from 'react';
import { Building2, Lock, Mail, ShieldCheck, ArrowRight, Sparkles } from 'lucide-react';

interface LoginViewProps {
  onLoginSuccess: (user: any, token: string) => void;
  communityName?: string;
}

export const LoginView: React.FC<LoginViewProps> = ({
  onLoginSuccess,
  communityName = 'Residencial Zentary',
}) => {
  const [email, setEmail] = useState('admin@zentary.com');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setIsLoading(true);
    setErrorMessage('');

    try {
      const response = await fetch('https://zentary-backend-production.up.railway.app/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await response.json();
      setIsLoading(false);

      if (response.ok && data.success && data.token) {
        onLoginSuccess(data.user, data.token);
      } else {
        setErrorMessage(data.message || 'Credenciales administrativas inválidas.');
      }
    } catch (err: any) {
      setIsLoading(false);
      setErrorMessage('Error de conexión con el servidor de autenticación en Railway.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Lighting Orbs */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full glass-card p-8 rounded-3xl border border-slate-800 shadow-2xl relative z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 p-0.5 mx-auto shadow-xl shadow-blue-500/20 flex items-center justify-center">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <Building2 className="w-8 h-8 text-blue-400" />
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-wide">ZENTARY ADMIN</h1>
            <p className="text-xs text-blue-400 font-semibold tracking-wider uppercase mt-1">
              {communityName}
            </p>
          </div>
        </div>

        {/* Error Alert Banner */}
        {errorMessage && (
          <div className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-semibold text-center">
            ⚠️ {errorMessage}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLoginSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Correo de Administrador
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                placeholder="admin@zentary.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-900/90 border border-slate-800 text-sm text-slate-100 placeholder-slate-500 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-blue-500 transition-all"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Contraseña
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-900/90 border border-slate-800 text-sm text-slate-100 placeholder-slate-500 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-blue-500 transition-all"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm shadow-xl shadow-blue-600/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50 mt-2"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 animate-spin" /> Verificando credenciales...
              </span>
            ) : (
              <>
                <span>Iniciar Sesión Administrativa</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="pt-2 text-center text-[11px] text-slate-500 border-t border-slate-800/80 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
          <span>Acceso cifrado y protegido por PostgreSQL en Railway</span>
        </div>
      </div>
    </div>
  );
};

export default LoginView;
