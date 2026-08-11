import React from 'react';
import { Users, ShieldCheck, Package, MessageSquare, DollarSign, ArrowUpRight, TrendingUp, AlertCircle, CheckCircle2 } from 'lucide-react';

interface DashboardViewProps {
  onNavigate: (view: any) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate }) => {
  const stats = [
    { title: 'Residentes Activos', value: '142', change: '+12% este mes', icon: Users, color: 'from-blue-600 to-indigo-600' },
    { title: 'Visitas en Curso', value: '18', change: '8 ingresaron hoy', icon: ShieldCheck, color: 'from-emerald-600 to-teal-600' },
    { title: 'Paquetes en Garita', value: '7', change: '3 retirados hoy', icon: Package, color: 'from-amber-600 to-orange-600' },
    { title: 'PQRS Abiertas', value: '4', change: '2 de alta prioridad', icon: MessageSquare, color: 'from-purple-600 to-pink-600' },
    { title: 'Cobros del Mes', value: '$12,450.00', change: '84% recolectado', icon: DollarSign, color: 'from-blue-500 to-cyan-500' },
  ];

  const recentVisits = [
    { id: 'v1', visitor: 'Carlos Eduardo Mendoza', resident: 'María Camila (Apt 502)', plate: 'P 452-910', status: 'IN_PROGRESS', time: '10:42 AM' },
    { id: 'v2', visitor: 'Uber Eats - Repartidor', resident: 'Roberto Silva (Torre B 104)', plate: 'M 182-300', status: 'IN_PROGRESS', time: '10:15 AM' },
    { id: 'v3', visitor: 'Técnico de Cable / Internet', resident: 'Ana Gutiérrez (Casa 12)', plate: 'P 992-104', status: 'COMPLETED', time: '09:00 AM' },
  ];

  return (
    <div className="space-y-8">
      {/* Top Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 p-8 shadow-xl">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-white/10 rounded-full blur-2xl" />
        <div className="relative z-10">
          <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full bg-white/20 text-white border border-white/20">
            Módulo de Administración Zentary
          </span>
          <h1 className="text-3xl font-extrabold text-white mt-3">
            Gestión Residencial & Control de Accesos
          </h1>
          <p className="text-blue-100 mt-1 max-w-2xl text-sm leading-relaxed">
            Controla y gestiona el acceso a la aplicación móvil para residentes, envía anuncios en tiempo real, verifica visitas en garita y supervisa los pagos.
          </p>
          <div className="mt-6 flex flex-wrap gap-4">
            <button
              onClick={() => onNavigate('access')}
              className="px-5 py-2.5 rounded-xl bg-white text-blue-700 font-bold text-sm hover:bg-blue-50 transition-colors shadow-md"
            >
              Gestionar Accesos
            </button>
            <button
              onClick={() => onNavigate('announcements')}
              className="px-5 py-2.5 rounded-xl bg-blue-800/60 text-white border border-white/20 font-semibold text-sm hover:bg-blue-800 transition-colors"
            >
              Publicar Anuncio
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-5">
        {stats.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div key={idx} className="glass-card p-5 rounded-2xl border border-slate-800 hover:border-slate-700 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400">{item.title}</span>
                <div className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${item.color} flex items-center justify-center shadow-md`}>
                  <Icon className="w-4 h-4 text-white" />
                </div>
              </div>
              <p className="text-2xl font-bold text-white mt-3">{item.value}</p>
              <p className="text-xs text-emerald-400 mt-1 flex items-center gap-1 font-medium">
                <TrendingUp className="w-3 h-3" /> {item.change}
              </p>
            </div>
          );
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Real-time Visit Arrivals */}
        <div className="lg:col-span-2 glass-card p-6 rounded-3xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-lg font-bold text-white">Ingresos Recientes en Garita</h3>
              <p className="text-xs text-slate-400">Pases QR y accesos validados hoy</p>
            </div>
            <button
              onClick={() => onNavigate('visits')}
              className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1"
            >
              Ver todo <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-800">
            {recentVisits.map((v) => (
              <div key={v.id} className="py-3.5 flex items-center justify-between hover:bg-slate-800/30 px-2 rounded-xl transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 font-bold text-sm">
                    {v.visitor.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{v.visitor}</p>
                    <p className="text-xs text-slate-400">Visita a: {v.resident} • Placa: {v.plate}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span
                    className={`inline-block px-2.5 py-1 text-xs font-bold rounded-full ${
                      v.status === 'IN_PROGRESS'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {v.status === 'IN_PROGRESS' ? 'En Curso' : 'Completado'}
                  </span>
                  <p className="text-[11px] text-slate-500 mt-1">{v.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Action Shortcuts */}
        <div className="glass-card p-6 rounded-3xl border border-slate-800 space-y-4">
          <h3 className="text-lg font-bold text-white border-b border-slate-800 pb-4">
            Acciones Administrativas
          </h3>

          <div className="space-y-3">
            <button
              onClick={() => onNavigate('access')}
              className="w-full text-left p-4 rounded-2xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 transition-all flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Habilitar / Bloquear Residentes</p>
                <p className="text-xs text-slate-400">Activar accesos a la app móvil</p>
              </div>
            </button>

            <button
              onClick={() => onNavigate('announcements')}
              className="w-full text-left p-4 rounded-2xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 transition-all flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-xl bg-amber-600/20 text-amber-400 flex items-center justify-center font-bold">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Difundir Comunicados</p>
                <p className="text-xs text-slate-400">Notificar a todos los usuarios</p>
              </div>
            </button>

            <button
              onClick={() => onNavigate('parcels')}
              className="w-full text-left p-4 rounded-2xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 transition-all flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center font-bold">
                <Package className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Registrar Paquete en Garita</p>
                <p className="text-xs text-slate-400">DHL, FedEx, UPS, Cargo Express</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardView;
