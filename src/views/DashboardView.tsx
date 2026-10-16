import React from 'react';
import { Users, ShieldCheck, Package, MessageSquare, DollarSign, ArrowUpRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import { adminApi } from '../services/adminApi';

interface DashboardViewProps {
  onNavigate: (view: any) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate }) => {
  const [statsData, setStatsData] = React.useState({
    totalUsers: 0,
    activeVisits: 0,
    pendingParcels: 0,
    openPqrs: 0,
    totalPayments: '$0.00',
    collectionRate: 0,
  });
  const [recentVisits, setRecentVisits] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [errors, setErrors] = React.useState({ stats: false, users: false, summary: false, visits: false });

  React.useEffect(() => {
    fetchDashboardMetrics();
  }, []);

  const fetchDashboardMetrics = async () => {
    setIsLoading(true);
    try {
      const [statsRes, usersRes, summaryRes, visitsRes] = await Promise.all([
        adminApi.getDashboardStats().catch(() => null),
        adminApi.getUsers('').catch(() => null),
        adminApi.getFinancialSummary().catch(() => null),
        adminApi.getVisits().catch(() => null),
      ]);

      setErrors({
        stats: !statsRes?.success,
        users: !(usersRes?.success && Array.isArray(usersRes.users)),
        summary: !summaryRes?.success,
        visits: !visitsRes?.success,
      });

      setStatsData((prev) => ({
        // Mismo criterio que Control de Usuarios: usuarios activos sin cuentas de administración
        totalUsers: usersRes?.success && Array.isArray(usersRes.users) ? usersRes.users.filter((u) => u.isActive && !['ADMIN', 'RESIDENTIAL_ADMIN', 'SUPER_ADMIN', 'SECURITY_ADMIN'].includes(u.role)).length : prev.totalUsers,
        activeVisits: statsRes?.success ? statsRes.stats.activeVisits : prev.activeVisits,
        pendingParcels: statsRes?.success ? statsRes.stats.pendingParcels : prev.pendingParcels,
        openPqrs: statsRes?.success ? statsRes.stats.openPqrs : prev.openPqrs,
        totalPayments: summaryRes?.success ? `$${summaryRes.summary.totalCollected.toFixed(2)}` : prev.totalPayments,
        collectionRate: summaryRes?.success ? summaryRes.summary.collectionRate : prev.collectionRate,
      }));

      if (visitsRes?.success) {
        setRecentVisits((visitsRes.visits || []).slice(0, 5));
      }
    } catch (err) {
      console.warn('Dashboard fetch error:', err);
      setErrors({ stats: true, users: true, summary: true, visits: true });
    } finally {
      setIsLoading(false);
    }
  };

  const stats = [
    { title: 'Residentes Activos', value: `${statsData.totalUsers}`, change: 'Usuarios activos, igual que Control de Usuarios', hasError: errors.users, icon: Users, color: 'from-blue-600 to-indigo-600' },
    { title: 'Visitas en Curso', value: `${statsData.activeVisits}`, change: '', hasError: errors.stats, icon: ShieldCheck, color: 'from-emerald-600 to-teal-600' },
    { title: 'Paquetes en Garita', value: `${statsData.pendingParcels}`, change: 'Pendientes de retiro', hasError: errors.stats, icon: Package, color: 'from-amber-600 to-orange-600' },
    { title: 'PQRS Abiertas', value: `${statsData.openPqrs}`, change: '', hasError: errors.stats, icon: MessageSquare, color: 'from-purple-600 to-pink-600' },
    { title: 'Cobros Recaudados', value: statsData.totalPayments, change: `${Math.round(statsData.collectionRate)}% recolectado`, hasError: errors.summary, icon: DollarSign, color: 'from-blue-500 to-cyan-500' },
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
              {isLoading ? (
                <div className="mt-3 h-8 w-16 rounded-lg bg-slate-800 animate-pulse" />
              ) : item.hasError ? (
                <>
                  <p className="text-sm font-semibold text-rose-400 mt-3">No se pudo cargar</p>
                  <button onClick={fetchDashboardMetrics} className="text-xs font-semibold text-blue-400 hover:text-blue-300 mt-1">
                    Reintentar
                  </button>
                </>
              ) : (
                <>
                  <p className="text-2xl font-bold text-white mt-3">{item.value}</p>
                  {item.change && <p className="text-xs text-slate-400 mt-1">{item.change}</p>}
                </>
              )}
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
              <p className="text-xs text-slate-400">Últimos accesos registrados, con fecha y hora de entrada</p>
            </div>
            <button
              onClick={() => onNavigate('visits')}
              className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1"
            >
              Ver todo <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-800">
            {isLoading ? (
              <div className="py-8 text-center text-xs text-slate-500 animate-pulse">Cargando ingresos recientes...</div>
            ) : errors.visits ? (
              <div className="py-8 text-center text-xs text-rose-400">
                No se pudieron cargar los ingresos recientes.{' '}
                <button onClick={fetchDashboardMetrics} className="font-semibold text-blue-400 hover:text-blue-300">
                  Reintentar
                </button>
              </div>
            ) : recentVisits.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">
                No hay visitas registradas aún.
              </div>
            ) : (
              recentVisits.map((v) => {
                const visitorName = v.visitorName || v.visitor || 'Visitante';
                const residentName = v.resident?.fullName || v.resident || 'Residente';
                const plate = v.vehiclePlate || v.plate;
                const status = v.status || 'IN_PROGRESS';
                const enCurso = status === 'INGRESADA' || status === 'IN_PROGRESS';

                return (
                  <div key={v.id} className="py-3.5 flex items-center justify-between hover:bg-slate-800/30 px-2 rounded-xl transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 font-bold text-sm">
                        {visitorName.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">{visitorName}</p>
                        <p className="text-xs text-slate-400">Visita a: {residentName}{plate ? ` • Placa: ${plate}` : ''}</p>
                        {v.entryDate && (
                          <p className="text-xs text-slate-500">
                            Entrada: {new Date(v.entryDate).toLocaleString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <span
                        className={`inline-block px-2.5 py-1 text-xs font-bold rounded-full ${
                          enCurso
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {enCurso ? 'En Curso' : 'Completado'}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
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
