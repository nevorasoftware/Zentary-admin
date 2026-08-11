import React from 'react';
import {
  LayoutDashboard,
  Users,
  Megaphone,
  ShieldCheck,
  Package,
  MessageSquare,
  CreditCard,
  Building2,
  LogOut,
} from 'lucide-react';

export type AdminViewType =
  | 'dashboard'
  | 'access'
  | 'announcements'
  | 'visits'
  | 'parcels'
  | 'pqrs'
  | 'payments';

interface MenuItem {
  id: AdminViewType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  badgeNum?: number;
}

interface SidebarProps {
  currentView: AdminViewType;
  onSelectView: (view: AdminViewType) => void;
  openPqrsCount?: number;
  pendingParcelsCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onSelectView,
  openPqrsCount = 3,
  pendingParcelsCount = 4,
}) => {
  const menuItems: MenuItem[] = [
    { id: 'dashboard', label: 'Panel Principal', icon: LayoutDashboard },
    { id: 'access', label: 'Control de Usuarios y Accesos', icon: Users, badge: 'Pro' },
    { id: 'announcements', label: 'Envío de Anuncios', icon: Megaphone },
    { id: 'visits', label: 'Accesos de Garita / QR', icon: ShieldCheck },
    { id: 'parcels', label: 'Recepcionar Paquetes', icon: Package, badgeNum: pendingParcelsCount },
    { id: 'pqrs', label: 'Soporte y PQRS', icon: MessageSquare, badgeNum: openPqrsCount },
    { id: 'payments', label: 'Gestión de Pagos', icon: CreditCard },
  ];

  return (
    <aside className="w-72 glass-sidebar flex flex-col justify-between h-screen sticky top-0 z-30 select-none">
      <div>
        {/* Brand Header */}
        <div className="p-6 flex items-center gap-3 border-b border-slate-800">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/30">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-white tracking-wide">ZENTARY</h1>
            <p className="text-xs text-blue-400 font-semibold uppercase tracking-wider">Web Admin Console</p>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="p-4 space-y-1.5 mt-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectView(item.id)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200 ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 font-semibold translate-x-1'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>

                {item.badgeNum !== undefined && item.badgeNum > 0 && (
                  <span
                    className={`px-2 py-0.5 text-xs font-bold rounded-full ${
                      isActive ? 'bg-white text-blue-600' : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                    }`}
                  >
                    {item.badgeNum}
                  </span>
                )}

                {item.badge && (
                  <span className="px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Admin Profile Footer */}
      <div className="p-4 m-4 rounded-2xl bg-slate-800/40 border border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"
              alt="Admin"
              className="w-10 h-10 rounded-full object-cover ring-2 ring-blue-500/50"
            />
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full ring-2 ring-slate-900" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">Administración Zentary</p>
            <p className="text-xs text-slate-400 truncate">admin@zentary.com</p>
          </div>
          <button className="text-slate-400 hover:text-rose-400 p-1.5 transition-colors" title="Cerrar sesión">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
