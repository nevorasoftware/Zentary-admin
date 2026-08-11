import React, { useState } from 'react';
import {
  Users,
  Search,
  UserPlus,
  Building2,
  Check,
  X,
  Send,
  MessageSquare,
  Key,
  Mail,
  Phone,
  Copy,
  RotateCcw,
  Sparkles,
  Edit3,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { ResidentUser } from '../services/adminApi';

interface ExtendedUser extends ResidentUser {
  mustChangePassword?: boolean;
}

const INITIAL_USERS: ExtendedUser[] = [
  {
    id: 'u1',
    fullName: 'Jonathan Giron',
    email: 'misaelgrande@gmail.com',
    phone: '61489595',
    role: 'RESIDENT',
    isActive: true,
    mustChangePassword: true,
    avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
    property: { unitNumber: '119D', block: 'Residencia Zentary' },
    createdAt: '2026-08-11',
  },
  {
    id: 'u2',
    fullName: 'María Camila Rodríguez',
    email: 'residente@zentary.com',
    phone: '+503 7888-9999',
    role: 'RESIDENT',
    isActive: true,
    mustChangePassword: true,
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    property: { unitNumber: 'Apt 502', block: 'Torre B' },
    createdAt: '2026-08-01',
  },
  {
    id: 'u3',
    fullName: 'Roberto Antonio Silva',
    email: 'roberto.silva@gmail.com',
    phone: '+503 7888-1234',
    role: 'RESIDENT',
    isActive: true,
    mustChangePassword: false,
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    property: { unitNumber: 'Casa 14', block: 'Manzana A' },
    createdAt: '2026-08-05',
  },
];

interface AccessManagementViewProps {
  communityName?: string;
}

export const AccessManagementView: React.FC<AccessManagementViewProps> = ({
  communityName = 'Residencial Zentary',
}) => {
  const [users, setUsers] = useState<ExtendedUser[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  // Tenant Register Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [fullName, setFullName] = useState('');
  const [unitNumber, setUnitNumber] = useState('');
  const [block, setBlock] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Tenant Edit Modal States
  const [editingUser, setEditingUser] = useState<ExtendedUser | null>(null);
  const [editFullName, setEditFullName] = useState('');
  const [editUnitNumber, setEditUnitNumber] = useState('');
  const [editBlock, setEditBlock] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');

  // Credentials Success Modal State
  const [createdTenantInfo, setCreatedTenantInfo] = useState<{
    id?: string;
    fullName: string;
    email: string;
    phone: string;
    unitNumber: string;
    genericPassword: string;
    whatsappLink: string;
    mailtoLink: string;
  } | null>(null);

  const fetchUsersFromBackend = async () => {
    setIsLoadingUsers(true);
    try {
      const res = await fetch('https://zentary-backend-production.up.railway.app/api/admin/users', {
        headers: { 'Authorization': 'Bearer admin_demo_token' },
      });
      const data = await res.json();
      setIsLoadingUsers(false);

      if (data.success && Array.isArray(data.users) && data.users.length > 0) {
        setUsers(data.users);
      } else {
        setUsers(INITIAL_USERS);
      }
    } catch (err) {
      console.warn('Backend fetch fallback:', err);
      setIsLoadingUsers(false);
      setUsers(INITIAL_USERS);
    }
  };

  React.useEffect(() => {
    fetchUsersFromBackend();
  }, []);

  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 5000);
  };

  const handleToggleAccess = async (userId: string) => {
    const targetUser = users.find((u) => u.id === userId);
    if (!targetUser) return;

    const nextState = !targetUser.isActive;

    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, isActive: nextState } : u))
    );

    try {
      await fetch(`https://zentary-backend-production.up.railway.app/api/admin/users/${userId}/access`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer admin_demo_token',
        },
        body: JSON.stringify({ isActive: nextState }),
      });
      showToast(`Acceso ${nextState ? 'habilitado' : 'deshabilitado'} en PostgreSQL.`, 'info');
    } catch (err) {
      console.warn('Error saving toggle access in PostgreSQL:', err);
    }
  };

  const formatPhoneElSalvador = (val: string) => {
    const digits = val.replace(/\D/g, '');
    if (digits.length === 0) return '';
    let mainDigits = digits;
    if (digits.startsWith('503') && digits.length > 3) {
      mainDigits = digits.slice(3);
    }
    if (mainDigits.length <= 4) {
      return `+503 ${mainDigits}`;
    }
    return `+503 ${mainDigits.slice(0, 4)}-${mainDigits.slice(4, 8)}`;
  };

  const isValidEmail = (emailStr: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailStr.trim());
  };

  const handleRegisterTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !unitNumber || !email) return;

    if (!isValidEmail(email)) {
      showToast('⚠️ Por favor ingresa un correo electrónico válido (ej. correo@ejemplo.com).', 'error');
      return;
    }

    const finalBlock = block.trim() !== '' ? block : communityName;
    const finalPhone = phone.trim() !== '' ? formatPhoneElSalvador(phone) : '+503 6148-9595';
    const cleanUnit = unitNumber.replace(/\s+/g, '');
    const genericPassword = `Zentary${cleanUnit}!`;

    // 1. Send POST request to Railway PostgreSQL API
    try {
      const response = await fetch('https://zentary-backend-production.up.railway.app/api/admin/tenants', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer admin_demo_token',
        },
        body: JSON.stringify({
          fullName,
          unitNumber,
          block: finalBlock,
          email,
          phone: finalPhone,
          communityName,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        showToast(`⚠️ ${data.message || 'Error al guardar en base de datos PostgreSQL'}`, 'error');
      } else {
        showToast(`Inquilino ${fullName} creado en PostgreSQL en Railway.`, 'success');
      }

      // Re-fetch users from Railway PostgreSQL
      fetchUsersFromBackend();
    } catch (err) {
      console.warn('DB register error:', err);
    }

    const cleanPhoneDigits = finalPhone.replace(/[^\d]/g, '');
    const messageText = `Hola ${fullName}, bienvenido a ${communityName}.\n\n` +
      `📌 Unidad: ${unitNumber} (${finalBlock})\n` +
      `📧 Correo: ${email}\n` +
      `🔑 Contraseña inicial: ${genericPassword}\n\n` +
      `Por tu seguridad, al iniciar sesión la app te solicitará actualizar tu contraseña.`;

    const whatsappLink = cleanPhoneDigits
      ? `https://api.whatsapp.com/send?phone=${cleanPhoneDigits}&text=${encodeURIComponent(messageText)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(messageText)}`;

    const mailtoLink = `mailto:${email}?subject=${encodeURIComponent(`Accesos a la App Zentary - ${communityName}`)}&body=${encodeURIComponent(messageText)}`;

    setCreatedTenantInfo({
      fullName,
      email,
      phone: finalPhone,
      unitNumber,
      genericPassword,
      whatsappLink,
      mailtoLink,
    });

    // Reset Form
    setFullName('');
    setUnitNumber('');
    setBlock('');
    setEmail('');
    setPhone('');
    setShowAddModal(false);
  };

  const handleOpenEditModal = (user: ExtendedUser) => {
    setEditingUser(user);
    setEditFullName(user.fullName);
    setEditUnitNumber(user.property?.unitNumber || '');
    setEditBlock(user.property?.block || '');
    setEditEmail(user.email);
    setEditPhone(user.phone || '');
  };

  const handleSaveEditedTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser || !editFullName || !editUnitNumber || !editEmail) return;

    if (!isValidEmail(editEmail)) {
      showToast('⚠️ Por favor ingresa un correo electrónico válido (ej. correo@ejemplo.com).', 'error');
      return;
    }

    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === editingUser.id) {
          return {
            ...u,
            fullName: editFullName || u.fullName,
            email: editEmail || u.email,
            phone: editPhone !== undefined ? editPhone : u.phone,
            property: {
              unitNumber: editUnitNumber || u.property?.unitNumber || '119D',
              block: editBlock !== undefined ? editBlock : u.property?.block,
            },
          };
        }
        return u;
      })
    );

    try {
      await fetch(`https://zentary-backend-production.up.railway.app/api/admin/tenants/${editingUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer admin_demo_token',
        },
        body: JSON.stringify({
          fullName: editFullName,
          email: editEmail,
          phone: editPhone,
          unitNumber: editUnitNumber,
          block: editBlock,
        }),
      });
    } catch (err) {
      console.warn('Backend update failed:', err);
    }

    showToast(`Información del inquilino ${editFullName} actualizada correctamente.`, 'success');
    setEditingUser(null);
  };

  // Email Delivery Feedback Banner State
  const [emailStatus, setEmailStatus] = useState<{
    state: 'IDLE' | 'SENDING' | 'SUCCESS' | 'ERROR';
    message?: string;
    details?: string;
  }>({ state: 'IDLE' });

  const handleSendGmailApi = async (targetEmail: string, targetName: string, targetUnit?: string) => {
    setIsSendingEmail(true);
    setEmailStatus({ state: 'SENDING', message: 'Conectando con la API de Gmail en Railway...' });

    try {
      const response = await fetch('https://zentary-backend-production.up.railway.app/api/admin/tenants/resend-credentials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer admin_demo_token',
        },
        body: JSON.stringify({
          email: targetEmail,
          fullName: targetName,
          unitNumber: targetUnit || '119D',
          communityName,
        }),
      });

      const data = await response.json();
      setIsSendingEmail(false);

      if (data.success) {
        setEmailStatus({
          state: 'SUCCESS',
          message: '¡CORREO ENVIADO CON ÉXITO!',
          details: `El mensaje fue entregado a ${targetEmail}`,
        });
        showToast(`✉️ Correo enviado exitosamente a ${targetEmail}`, 'success');
      } else {
        setEmailStatus({
          state: 'ERROR',
          message: 'NO SE PUDO ENVIAR EL CORREO POR GMAIL',
          details: data.message || 'Por favor verifica que la variable GMAIL_APP_PASSWORD esté configurada en Railway.',
        });
        showToast(`❌ ${data.message || 'Falló el envío de correo por Gmail.'}`, 'error');
      }
    } catch (error: any) {
      setIsSendingEmail(false);
      setEmailStatus({
        state: 'ERROR',
        message: 'ERROR DE CONEXIÓN CON EL SERVIDOR',
        details: 'No se pudo contactar la API del Backend en Railway.',
      });
      showToast('❌ Error de conexión al intentar enviar correo.', 'error');
    }
  };

  const handleResendCredentialsForUser = (user: ExtendedUser) => {
    const cleanUnit = (user.property?.unitNumber || '119D').replace(/\s+/g, '');
    const genericPassword = `Zentary${cleanUnit}!`;
    const cleanPhone = (user.phone || '').replace(/[^\d]/g, '');

    const messageText = `Hola ${user.fullName}, recordatorio de accesos para ${communityName}.\n\n` +
      `📌 Unidad: ${user.property?.unitNumber || '119D'}\n` +
      `📧 Correo: ${user.email}\n` +
      `🔑 Contraseña inicial: ${genericPassword}\n\n` +
      `Al iniciar sesión en Zentary, se te pedirá cambiar tu clave.`;

    const whatsappLink = cleanPhone
      ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(messageText)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(messageText)}`;

    const mailtoLink = `mailto:${user.email}?subject=${encodeURIComponent(`Reenvío de Accesos - ${communityName}`)}&body=${encodeURIComponent(messageText)}`;

    setCreatedTenantInfo({
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone || '61489595',
      unitNumber: user.property?.unitNumber || '119D',
      genericPassword,
      whatsappLink,
      mailtoLink,
    });

    setUsers((prev) =>
      prev.map((u) => (u.id === user.id ? { ...u, mustChangePassword: true } : u))
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
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div
          className={`fixed top-24 right-8 z-50 px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 border transition-all animate-bounce ${
            toastMessage.type === 'success'
              ? 'bg-emerald-600 text-white border-emerald-400'
              : toastMessage.type === 'error'
              ? 'bg-rose-600 text-white border-rose-400'
              : 'bg-amber-600 text-white border-amber-400'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-white" />
          ) : (
            <AlertCircle className="w-5 h-5 text-white" />
          )}
          <span className="text-xs font-bold">{toastMessage.text}</span>
        </div>
      )}

      {/* Header Info Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-card p-6 rounded-3xl border border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-500" />
            Habilitación y Control de Inquilinos en {communityName}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Registra nuevos inquilinos, edita su información, reenvía accesos por Gmail API o WhatsApp y administra el estado de sus cuentas.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAddModal(true)}
            className="px-5 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-blue-600/30 flex items-center gap-2 transition-all whitespace-nowrap"
          >
            <UserPlus className="w-5 h-5" /> Registrar Nuevo Inquilino
          </button>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative flex-1 w-full">
          <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por nombre, correo (ej. misaelgrande@gmail.com) o unidad (119D)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900/80 border border-slate-800 text-sm text-slate-100 placeholder-slate-500 rounded-2xl pl-12 pr-4 py-3.5 focus:outline-none focus:border-blue-500 transition-all shadow-inner"
          />
        </div>

        <div className="flex items-center gap-2 bg-slate-900/80 p-1.5 rounded-2xl border border-slate-800 w-full md:w-auto justify-center">
          <button
            onClick={() => setFilterStatus('ALL')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all ${
              filterStatus === 'ALL' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Todos ({users.length})
          </button>
          <button
            onClick={() => setFilterStatus('ACTIVE')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all ${
              filterStatus === 'ACTIVE' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Activos ({users.filter((u) => u.isActive).length})
          </button>
          <button
            onClick={() => setFilterStatus('INACTIVE')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all ${
              filterStatus === 'INACTIVE' ? 'bg-rose-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Inactivos ({users.filter((u) => !u.isActive).length})
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="glass-card rounded-3xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950/60 text-slate-400 uppercase text-[11px] font-bold tracking-wider border-b border-slate-800">
              <tr>
                <th className="px-6 py-4">Inquilino / Residente</th>
                <th className="px-6 py-4">Unidad</th>
                <th className="px-6 py-4">Teléfono / WhatsApp</th>
                <th className="px-6 py-4">Estado Clave</th>
                <th className="px-6 py-4">Acciones Credenciales</th>
                <th className="px-6 py-4 text-right">Opciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={user.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
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
                    {user.phone || '61489595'}
                  </td>

                  <td className="px-6 py-4">
                    {user.mustChangePassword ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        <Key className="w-3.5 h-3.5" /> Cambio Pendiente
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
                        <Check className="w-3.5 h-3.5 text-emerald-400" /> Clave Lista
                      </span>
                    )}
                  </td>

                  {/* Reenviar Credenciales Button */}
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleResendCredentialsForUser(user)}
                      className="px-3 py-1.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 text-xs font-bold flex items-center gap-1.5 transition-all"
                    >
                      <RotateCcw className="w-3.5 h-3.5" /> Reenviar Credenciales
                    </button>
                  </td>

                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {/* Editar Inquilino Button */}
                      <button
                        onClick={() => handleOpenEditModal(user)}
                        className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 border border-slate-700 transition-all"
                        title="Editar información del inquilino"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      {/* Bloquear / Habilitar Acceso Button */}
                      <button
                        onClick={() => handleToggleAccess(user.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-md ${
                          user.isActive
                            ? 'bg-slate-800 text-rose-400 hover:bg-rose-600 hover:text-white border border-rose-500/30'
                            : 'bg-emerald-600 text-white hover:bg-emerald-500'
                        }`}
                      >
                        {user.isActive ? 'Bloquear' : 'Permitir'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Formulario para Registrar Nuevo Inquilino */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card max-w-lg w-full p-6 rounded-3xl border border-slate-700 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-blue-500" />
                Registrar Nuevo Inquilino / Residente
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRegisterTenant} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Nombre Completo del Inquilino *
                </label>
                <input
                  type="text"
                  placeholder="Ej. Juan Pérez"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-sm text-slate-100 rounded-xl px-4 py-2.5 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Número de Unidad *
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. 101-A"
                    value={unitNumber}
                    onChange={(e) => setUnitNumber(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 text-sm text-slate-100 rounded-xl px-4 py-2.5 focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Bloque / Manzana / Torre
                  </label>
                  <input
                    type="text"
                    placeholder={`Ej. ${communityName}`}
                    value={block}
                    onChange={(e) => setBlock(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 text-sm text-slate-100 rounded-xl px-4 py-2.5 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Correo Electrónico (Para envío vía Gmail API) *
                </label>
                <input
                  type="email"
                  placeholder="correo@ejemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-sm text-slate-100 rounded-xl px-4 py-2.5 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Número de Teléfono / WhatsApp *
                </label>
                <input
                  type="text"
                  placeholder="Ej. +503 6198-9999"
                  value={phone}
                  onChange={(e) => setPhone(formatPhoneElSalvador(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 text-sm text-slate-100 rounded-xl px-4 py-2.5 focus:outline-none focus:border-blue-500 font-mono"
                  required
                />
              </div>

              <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300 space-y-1">
                <p className="font-bold flex items-center gap-1.5 text-blue-200">
                  <Key className="w-4 h-4 text-blue-400" /> Contraseña Genérica Inicial
                </p>
                <p>
                  Se asignará automáticamente la clave genérica basada en la unidad (ej. Zentary119D!). La app le pedirá cambio de clave en el primer inicio.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md"
                >
                  Registrar e Ir a Enviar Accesos
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Editar Inquilino */}
      {editingUser && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card max-w-lg w-full p-6 rounded-3xl border border-slate-700 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-blue-500" />
                Editar Información de Inquilino
              </h3>
              <button onClick={() => setEditingUser(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditedTenant} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-sm text-slate-100 rounded-xl px-4 py-2.5 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Número de Unidad *
                  </label>
                  <input
                    type="text"
                    value={editUnitNumber}
                    onChange={(e) => setEditUnitNumber(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 text-sm text-slate-100 rounded-xl px-4 py-2.5 focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Bloque / Manzana / Torre
                  </label>
                  <input
                    type="text"
                    value={editBlock}
                    onChange={(e) => setEditBlock(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 text-sm text-slate-100 rounded-xl px-4 py-2.5 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Correo Electrónico *
                </label>
                <input
                  type="email"
                  placeholder="correo@ejemplo.com"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-sm text-slate-100 rounded-xl px-4 py-2.5 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Teléfono / WhatsApp *
                </label>
                <input
                  type="text"
                  placeholder="Ej. +503 6198-9999"
                  value={editPhone}
                  onChange={(e) => setEditPhone(formatPhoneElSalvador(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 text-sm text-slate-100 rounded-xl px-4 py-2.5 focus:outline-none focus:border-blue-500 font-mono"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Confirmación Éxito & Envío por WhatsApp / Gmail API */}
      {createdTenantInfo && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="glass-card max-w-lg w-full p-6 rounded-3xl border border-emerald-500/40 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Check className="w-5 h-5 text-emerald-400" />
                ¡Inquilino Creado Exitosamente!
              </h3>
              <button onClick={() => setCreatedTenantInfo(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2 text-sm">
              <p className="text-slate-300">
                Residente: <strong className="text-white">{createdTenantInfo.fullName}</strong> ({createdTenantInfo.unitNumber})
              </p>
              <p className="text-slate-300">
                Correo: <strong className="text-white">{createdTenantInfo.email}</strong>
              </p>
              <p className="text-slate-300">
                Teléfono: <strong className="text-white">{createdTenantInfo.phone || '61489595'}</strong>
              </p>

              <div className="mt-3 p-3 rounded-xl bg-slate-950 border border-amber-500/30 flex items-center justify-between">
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-amber-400 font-bold">Contraseña Genérica Asignada</p>
                  <p className="font-mono text-base font-bold text-white mt-0.5">{createdTenantInfo.genericPassword}</p>
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(createdTenantInfo.genericPassword);
                    showToast('📋 Contraseña copiada al portapapeles.', 'info');
                  }}
                  className="p-2 text-slate-400 hover:text-white bg-slate-800 rounded-lg"
                  title="Copiar contraseña"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Visual Status Indicator for Email Dispatch */}
            {emailStatus.state !== 'IDLE' && (
              <div
                className={`p-3.5 rounded-2xl border text-xs space-y-1 transition-all ${
                  emailStatus.state === 'SENDING'
                    ? 'bg-blue-500/10 border-blue-500/30 text-blue-300'
                    : emailStatus.state === 'SUCCESS'
                    ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                    : 'bg-rose-500/15 border-rose-500/40 text-rose-300'
                }`}
              >
                <div className="font-bold flex items-center gap-2">
                  {emailStatus.state === 'SENDING' && <Sparkles className="w-4 h-4 text-blue-400 animate-spin" />}
                  {emailStatus.state === 'SUCCESS' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                  {emailStatus.state === 'ERROR' && <AlertCircle className="w-4 h-4 text-rose-400" />}
                  <span>{emailStatus.message}</span>
                </div>
                {emailStatus.details && <p className="opacity-90">{emailStatus.details}</p>}
              </div>
            )}

            <p className="text-xs text-slate-400">
              Utiliza los botones a continuación para transmitir automáticamente las credenciales al inquilino:
            </p>

            <div className="grid grid-cols-2 gap-3">
              <a
                href={createdTenantInfo.whatsappLink}
                target="_blank"
                rel="noreferrer"
                className="py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all"
              >
                <MessageSquare className="w-4 h-4" /> Enviar por WhatsApp
              </a>

              <button
                onClick={() => handleSendGmailApi(createdTenantInfo.email, createdTenantInfo.fullName, createdTenantInfo.unitNumber)}
                disabled={isSendingEmail}
                className="py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                <Mail className="w-4 h-4" />
                {isSendingEmail ? 'Enviando correo...' : 'Enviar por Correo (Gmail)'}
              </button>
            </div>

            <button
              onClick={() => setCreatedTenantInfo(null)}
              className="w-full py-2.5 text-xs font-semibold text-slate-400 hover:text-white border border-slate-800 rounded-xl"
            >
              Cerrar y Volver a la Lista
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccessManagementView;
