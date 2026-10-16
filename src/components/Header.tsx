import React, { useState, useEffect } from 'react';
import { Search, Bell, Building2, Edit3, Check, Menu } from 'lucide-react';
import { getAdminToken, API_BASE_URL, getTenantHeaders, getSelectedTenantId, TENANT_STORAGE_KEY } from '../services/adminApi';

interface HeaderProps {
  title: string;
  subtitle: string;
  communityName?: string;
  onUpdateCommunityName?: (newName: string) => void;
  onOpenMobileMenu?: () => void;
  adminUser?: {
    id: string;
    fullName: string;
    role?: string;
    email: string;
    avatarUrl?: string;
  } | null;
  onOpenEditProfile?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  communityName = 'Residencial Zentary',
  onUpdateCommunityName,
  onOpenMobileMenu,
  adminUser,
  onOpenEditProfile,
}) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(communityName);
  const [nameError, setNameError] = useState<string | null>(null);
  const [tenants, setTenants] = useState<{ id: string; name: string }[]>([]);
  const isSuperAdmin = adminUser?.role === 'SUPER_ADMIN';

  // El super administrador elige la residencial con la que trabaja (o todas)
  useEffect(() => {
    if (!isSuperAdmin) return;
    fetch(`${API_BASE_URL}/tenants`, {
      headers: { 'Authorization': `Bearer ${getAdminToken()}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.tenants)) setTenants(data.tenants);
      })
      .catch((err) => console.warn('Failed to fetch tenants:', err));
  }, [isSuperAdmin]);

  const handleTenantChange = (tenantId: string) => {
    try {
      if (tenantId) localStorage.setItem(TENANT_STORAGE_KEY, tenantId);
      else localStorage.removeItem(TENANT_STORAGE_KEY);
    } catch {
      // almacenamiento no disponible
    }
    window.location.reload();
  };

  const handleSaveName = async () => {
    if (tempName.trim() && onUpdateCommunityName) {
      const updatedName = tempName.trim();
      setNameError(null);

      try {
        const res = await fetch(`${API_BASE_URL}/admin/community`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${getAdminToken()}`,
            ...getTenantHeaders(),
          },
          body: JSON.stringify({ name: updatedName }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || data.success === false) {
          setNameError(data.message || 'No se pudo actualizar el nombre de la residencial.');
          return;
        }
        onUpdateCommunityName(updatedName);
      } catch (err) {
        console.warn('Failed to update community name in backend:', err);
        setNameError('No se pudo actualizar el nombre de la residencial.');
        return;
      }
    }
    setIsEditingName(false);
  };

  const avatar = adminUser?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150';

  return (
    <header className="min-h-20 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md px-4 md:px-8 py-3 flex flex-wrap items-center justify-between sticky top-0 z-20 gap-4">
      {/* Title & Mobile Hamburger Button */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 hover:text-white"
          aria-label="Abrir menú"
        >
          <Menu className="w-6 h-6" />
        </button>

        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg md:text-xl font-bold text-white flex items-center gap-2">
              {title}
            </h2>

            {/* Editable Community Badge */}
            <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs font-semibold">
              <Building2 className="w-3.5 h-3.5 text-blue-400" />
              {isEditingName ? (
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                    className="bg-slate-950 text-white text-xs px-2 py-0.5 rounded border border-blue-500 focus:outline-none"
                    autoFocus
                  />
                  <button
                    onClick={handleSaveName}
                    className="p-1 hover:text-emerald-400"
                    title="Guardar nombre"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                  {nameError && <span className="text-red-400 text-[11px] ml-1">{nameError}</span>}
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <span className="truncate max-w-[150px] md:max-w-none">{communityName}</span>
                  <button
                    onClick={() => {
                      setTempName(communityName);
                      setNameError(null);
                      setIsEditingName(true);
                    }}
                    className="text-slate-400 hover:text-white transition-colors"
                    title="Cambiar nombre del condominio/residencial"
                  >
                    <Edit3 className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-0.5 hidden sm:block">{subtitle}</p>
        </div>
      </div>

      {/* Quick Search & Actions */}
      <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
        <div className="relative flex-1 sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar residentes, pases..."
            className="w-full bg-slate-800/80 border border-slate-700/80 text-xs md:text-sm text-slate-200 placeholder-slate-400 rounded-xl pl-9 pr-3 py-2 focus:outline-none focus:border-blue-500 transition-all"
          />
        </div>

        <button className="p-2 md:p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/80 text-slate-300 hover:text-white transition-all relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full ring-2 ring-slate-900 animate-pulse" />
        </button>

        {isSuperAdmin && (
          <select
            value={getSelectedTenantId()}
            onChange={(e) => handleTenantChange(e.target.value)}
            className="bg-slate-800/80 border border-slate-700/80 text-xs md:text-sm text-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-blue-500 transition-all max-w-[180px]"
            title="Residencial activa"
          >
            <option value="">Todas</option>
            {tenants.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        )}

        <div className="hidden md:block h-8 w-px bg-slate-800" />

        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          <span>Railway API</span>
        </div>

        {/* Admin Avatar Button to edit profile */}
        <button
          onClick={onOpenEditProfile}
          className="p-1 rounded-full border border-blue-500/30 hover:border-blue-400 transition-all"
          title="Editar Perfil de Administrador"
        >
          <img src={avatar} alt="Admin Avatar" className="w-8 h-8 rounded-full object-cover" />
        </button>
      </div>
    </header>
  );
};

export default Header;
