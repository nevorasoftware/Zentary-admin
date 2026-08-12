import React from 'react';
import { Users, ShieldCheck, Package, MessageSquare, DollarSign, ArrowUpRight, TrendingUp, AlertCircle, CheckCircle2 } from 'lucide-react';

interface DashboardViewProps {
  onNavigate: (view: any) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate }) => {
  const [statsData, setStatsData] = React.useState({
    totalUsers: 0,
    activeVisits: 0,
    pendingParcels: 0,
    openPqrs: 3,
    totalPayments: '$12,450.00',
  });
  const [recentVisits, setRecentVisits] = React.useState<any[]>([]);

  React.useEffect(() => {
    fetchDashboardMetrics();
  }, []);

  const fetchDashboardMetrics = async () => {
    try {
      const token = localStorage.getItem('zentary_admin_token') || 'admin_demo_token';
      const [usersRes, visitsRes, parcelsRes] = await Promise.all([
        fetch('https://zentary-backend-production.up.railway.app/api/admin/users', {
          headers: { 'Authorization': `Bearer ${token}` },
        }).then((r) => r.json()).catch(() => ({ users: [] })),
        fetch('https://zentary-backend-production.up.railway.app/api/admin/visits', {
          headers: { 'Authorization': `Bearer ${token}` },
        }).then((r) => r.json()).catch(() => ({ visits: [] })),
        fetch('https://zentary-backend-production.up.railway.app/api/admin/parcels', {
          headers: { 'Authorization': `Bearer ${token}` },
        }).then((r) => r.json()).catch(() => ({ parcels: [] })),
      ]);

      const users = usersRes.users || [];
      const visits = visitsRes.visits || [];
      const parcels = parcelsRes.parcels || [];

      setStatsData({
        totalUsers: users.length,
        activeVisits: visits.filter((v: any) => v.status === 'IN_PROGRESS').length,
        pendingParcels: parcels.filter((p: any) => p.status === 'PENDING').length,
        openPqrs: 3,
        totalPayments: '$12,450.00',
      });

      setRecentVisits(visits.slice(0, 5));
    } catch (err) {
      console.warn('Dashboard fetch error:', err);
    }
  };

  const stats = [
    { title: 'Residentes Activos', value: `${statsData.totalUsers}`, change: 'Base de Datos PostgreSQL', icon: Users, color: 'from-blue-600 to-indigo-600' },
    { title: 'Visitas en Curso', value: `${statsData.activeVisits}`, change: 'Pases Garita / QR', icon: ShieldCheck, color: 'from-emerald-600 to-teal-600' },
    { title: 'Paquetes en Garita', value: `${statsData.pendingParcels}`, change: 'Pendientes de retiro', icon: Package, color: 'from-amber-600 to-orange-600' },
    { title: 'PQRS Abiertas', value: `${statsData.openPqrs}`, change: 'Atención residente', icon: MessageSquare, color: 'from-purple-600 to-pink-600' },
    { title: 'Cobros del Mes', value: statsData.totalPayments, change: '84% recolectado', icon: DollarSign, color: 'from-blue-500 to-cyan-500' },
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
            {recentVisits.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">
                No hay visitas registradas aún en la base de datos de PostgreSQL.
              </div>
            ) : (
              recentVisits.map((v) => {
                const visitorName = v.visitorName || v.visitor || 'Visitante';
                const residentName = v.resident?.fullName || v.resident || 'Residente';
                const plate = v.vehiclePlate || v.plate || 'Sin Placa';
                const status = v.status || 'IN_PROGRESS';

                return (
                  <div key={v.id} className="py-3.5 flex items-center justify-between hover:bg-slate-800/30 px-2 rounded-xl transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 font-bold text-sm">
                        {visitorName.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">{visitorName}</p>
                        <p className="text-xs text-slate-400">Visita a: {residentName} • Placa: {plate}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span
                        className={`inline-block px-2.5 py-1 text-xs font-bold rounded-full ${
                          status === 'IN_PROGRESS'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {status === 'IN_PROGRESS' ? 'En Curso' : 'Completado'}
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
