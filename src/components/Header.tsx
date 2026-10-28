import React, { useState, useEffect } from 'react';
import { Building2, Edit3, Check, Menu, Plus } from 'lucide-react';
import { getAdminToken, API_BASE_URL, getTenantHeaders, getSelectedTenantId, TENANT_STORAGE_KEY } from '../services/adminApi';
import NuevaResidencialModal from './NuevaResidencialModal';

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
  const [isNewTenantOpen, setIsNewTenantOpen] = useState(false);
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

  // Tras crear una residencial se trabaja de inmediato con ella
  const handleTenantCreated = (tenantId: string) => {
    handleTenantChange(tenantId);
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

  const avatar = adminUser?.avatarUrl || 'data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 24 24%27%3E%3Crect width=%2724%27 height=%2724%27 fill=%27%231e293b%27/%3E%3Ccircle cx=%2712%27 cy=%279%27 r=%274%27 fill=%27%2394a3b8%27/%3E%3Cpath d=%27M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7z%27 fill=%27%2394a3b8%27/%3E%3C/svg%3E';

  return (
    <header className="min-h-20 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md px-4 md:px-8 py-2 md:py-3 flex flex-wrap items-center justify-between sticky top-0 z-20 gap-2 md:gap-4">
      {/* Title & Mobile Hamburger Button */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="max-sm:min-h-11 max-sm:min-w-11 lg:hidden p-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 hover:text-white"
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
                    aria-label="Nombre de la residencial"
                  />
                  <button
                    onClick={handleSaveName}
                    className="max-sm:min-h-11 max-sm:min-w-11 p-1 hover:text-emerald-400"
                    title="Guardar nombre"
                    aria-label="Guardar nombre de la residencial"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                  {nameError && <span className="text-red-400 text-xs ml-1">{nameError}</span>}
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <span className="truncate max-w-[150px] md:max-w-none">{communityName}</span>
                  {adminUser?.role !== 'GUARD' && <button
                    onClick={() => {
                      setTempName(communityName);
                      setNameError(null);
                      setIsEditingName(true);
                    }}
                    className="max-sm:min-h-11 max-sm:min-w-11 text-slate-400 hover:text-white transition-colors"
                    title="Cambiar nombre del condominio/residencial"
                    aria-label="Editar nombre de la residencial"
                  >
                    <Edit3 className="w-3 h-3" />
                  </button>}
                </div>
              )}
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-0.5 hidden sm:block">{subtitle}</p>
        </div>
      </div>

      {/* Quick Search & Actions */}
      <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
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
        {isSuperAdmin && (
          <button
            type="button"
            onClick={() => setIsNewTenantOpen(true)}
            className="max-sm:min-h-11 max-sm:min-w-11 flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700/80 text-xs md:text-sm text-slate-200 hover:text-white hover:border-blue-500 transition-all"
            aria-label="Nueva residencial"
            title="Nueva residencial"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden md:inline">Nueva residencial</span>
          </button>
        )}

        <div className="hidden md:block h-8 w-px bg-slate-800" />

        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          <span>Conectado</span>
        </div>

        {/* Admin Avatar Button to edit profile */}
        <button aria-label="Editar Perfil de Administrador"
          onClick={onOpenEditProfile}
          className="max-sm:min-h-11 max-sm:min-w-11 p-1 rounded-full border border-blue-500/30 hover:border-blue-400 transition-all"
          title="Editar Perfil de Administrador"
        >
          <img src={avatar} alt="Admin Avatar" className="w-8 h-8 rounded-full object-cover" />
        </button>
      </div>
      {isNewTenantOpen && (
        <NuevaResidencialModal onClose={() => setIsNewTenantOpen(false)} onCreated={handleTenantCreated} />
      )}
    </header>
  );
};

export default Header;
