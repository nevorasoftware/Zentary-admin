import React, { useState } from 'react';
import { Users, Search, UserCheck, UserX, Shield, Building2, Check, X, Filter } from 'lucide-react';
import { ResidentUser } from '../services/adminApi';

const INITIAL_USERS: ResidentUser[] = [
  {
    id: 'u1',
    fullName: 'María Camila Rodríguez',
    email: 'residente@zentary.com',
    phone: '+503 7000-0000',
    role: 'RESIDENT',
    isActive: true,
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    property: { unitNumber: 'Apt 502', block: 'Torre B' },
    createdAt: '2026-08-01',
  },
  {
    id: 'u2',
    fullName: 'Roberto Antonio Silva',
    email: 'roberto.silva@gmail.com',
    phone: '+503 7888-1234',
    role: 'RESIDENT',
    isActive: true,
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    property: { unitNumber: 'Casa 14', block: 'Manzana A' },
    createdAt: '2026-08-05',
  },
  {
    id: 'u3',
    fullName: 'Ana Patricia Gutiérrez',
    email: 'ana.gutierrez@outlook.com',
    phone: '+503 7555-4321',
    role: 'RESIDENT',
    isActive: false, // Pending approval / Access Disabled
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
    property: { unitNumber: 'Apt 301', block: 'Torre A' },
    createdAt: '2026-08-10',
  },
];

export const AccessManagementView: React.FC = () => {
  const [users, setUsers] = useState<ResidentUser[]>(INITIAL_USERS);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  const handleToggleAccess = (userId: string) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          const nextState = !u.isActive;
          return { ...u, isActive: nextState };
        }
        return u;
      })
    );
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.property?.unitNumber.toLowerCase().includes(searchTerm.toLowerCase());

    if (filterStatus === 'ACTIVE') return matchesSearch && u.isActive;
    if (filterStatus === 'INACTIVE') return matchesSearch && !u.isActive;
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-card p-6 rounded-3xl border border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-500" />
            Habilitación y Control de Accesos
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Desde este panel puedes aprobar, activar o suspender el acceso de residentes a la aplicación móvil Zentary.
          </p>
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-2 bg-slate-900/80 p-1.5 rounded-2xl border border-slate-800">
          <button
            onClick={() => setFilterStatus('ALL')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all ${
              filterStatus === 'ALL' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Todos ({users.length})
          </button>
          <button
            onClick={() => setFilterStatus('ACTIVE')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all ${
              filterStatus === 'ACTIVE' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Activos ({users.filter((u) => u.isActive).length})
          </button>
          <button
            onClick={() => setFilterStatus('INACTIVE')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all ${
              filterStatus === 'INACTIVE' ? 'bg-rose-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Inactivos ({users.filter((u) => !u.isActive).length})
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Buscar por nombre, correo electrónico o número de apartamento/unidad..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-slate-900/80 border border-slate-800 text-sm text-slate-100 placeholder-slate-500 rounded-2xl pl-12 pr-4 py-3.5 focus:outline-none focus:border-blue-500 transition-all shadow-inner"
        />
      </div>

      {/* Users Table */}
      <div className="glass-card rounded-3xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950/60 text-slate-400 uppercase text-[11px] font-bold tracking-wider border-b border-slate-800">
              <tr>
                <th className="px-6 py-4">Residente</th>
                <th className="px-6 py-4">Propiedad / Unidad</th>
                <th className="px-6 py-4">Teléfono</th>
                <th className="px-6 py-4">Estado de Acceso</th>
                <th className="px-6 py-4 text-right">Acción de Control</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={user.avatarUrl || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150'}
                        alt={user.fullName}
                        className="w-10 h-10 rounded-full object-cover ring-2 ring-slate-800"
                      />
                      <div>
                        <p className="font-semibold text-white">{user.fullName}</p>
                        <p className="text-xs text-slate-400">{user.email}</p>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4 font-medium">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-blue-400" />
                      <span>
                        {user.property?.unitNumber} {user.property?.block ? `(${user.property.block})` : ''}
                      </span>
                    </div>
                  </td>

                  <td className="px-6 py-4 text-slate-400 font-mono text-xs">
                    {user.phone || 'No registrado'}
                  </td>

                  <td className="px-6 py-4">
                    {user.isActive ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <Check className="w-3.5 h-3.5" /> Acceso Permitido
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                        <X className="w-3.5 h-3.5" /> Acceso Suspendido
                      </span>
                    )}
                  </td>

                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleToggleAccess(user.id)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md ${
                        user.isActive
                          ? 'bg-slate-800 text-rose-400 hover:bg-rose-600 hover:text-white border border-rose-500/30'
                          : 'bg-emerald-600 text-white hover:bg-emerald-500'
                      }`}
                    >
                      {user.isActive ? 'Deshabilitar Acceso' : 'Habilitar Acceso'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AccessManagementView;
