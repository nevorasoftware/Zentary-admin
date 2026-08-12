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
  X,
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
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
  adminUser?: {
    id: string;
    fullName: string;
    email: string;
    avatarUrl?: string;
  } | null;
  onOpenEditProfile?: () => void;
  onLogout?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onSelectView,
  openPqrsCount = 3,
  pendingParcelsCount = 4,
  isOpenMobile = false,
  onCloseMobile,
  adminUser,
  onOpenEditProfile,
  onLogout,
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

  const handleSelect = (view: AdminViewType) => {
    onSelectView(view);
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  const avatar = adminUser?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150';
  const name = adminUser?.fullName || 'Administración Zentary';
  const email = adminUser?.email || 'admin@zentary.com';

  return (
    <>
      {/* Mobile Backdrop Blur Overlay */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 h-screen w-72 glass-sidebar flex flex-col justify-between select-none transition-transform duration-300 ease-in-out ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div>
          {/* Brand Header */}
          <div className="p-6 flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/30">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-lg text-white tracking-wide">ZENTARY</h1>
                <p className="text-xs text-blue-400 font-semibold uppercase tracking-wider">Web Admin Console</p>
              </div>
            </div>

            {/* Mobile Close Button */}
            <button
              onClick={onCloseMobile}
              className="lg:hidden p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Menu */}
          <nav className="p-4 space-y-1.5 mt-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelect(item.id)}
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
            <button
              onClick={onOpenEditProfile}
              className="relative group focus:outline-none"
              title="Editar Perfil"
            >
              <img
                src={avatar}
                alt="Admin"
                className="w-10 h-10 rounded-full object-cover ring-2 ring-blue-500/50 group-hover:ring-blue-400 transition-all"
              />
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full ring-2 ring-slate-900" />
            </button>
            <div
              onClick={onOpenEditProfile}
              className="flex-1 min-w-0 cursor-pointer group"
            >
              <p className="text-sm font-semibold text-white truncate group-hover:text-blue-300 transition-colors">
                {name}
              </p>
              <p className="text-xs text-slate-400 truncate">{email}</p>
            </div>
            <button
              onClick={onLogout}
              className="text-slate-400 hover:text-rose-400 p-1.5 transition-colors rounded-lg hover:bg-slate-800"
              title="Cerrar sesión"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
