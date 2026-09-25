import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Send,
  CheckCircle2,
  Clock,
  User,
  Building2,
  AlertCircle,
  RefreshCw,
  UserCheck,
  Flame,
} from 'lucide-react';
import { adminApi, PqrsTicketItem, ResidentUser } from '../services/adminApi';

export const PqrsSupportView: React.FC = () => {
  const [tickets, setTickets] = useState<PqrsTicketItem[]>([]);
  const [staffUsers, setStaffUsers] = useState<ResidentUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicketId, setSelectedTicketId] = useState<string>('');
  const [replyText, setReplyText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isResolving, setIsResolving] = useState(false);
  const [notificationStatus, setNotificationStatus] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getPqrsList();
      if (res.success && Array.isArray(res.pqrsList)) {
        setTickets(res.pqrsList);
        if (res.pqrsList.length > 0) {
          setSelectedTicketId((prev) => (prev && res.pqrsList.some((t) => t.id === prev) ? prev : res.pqrsList[0].id));
        } else {
          setSelectedTicketId('');
        }
      }
    } catch (e) {
      console.warn('Could not load PQRS from backend:', e);
      setTickets([]);
      setSelectedTicketId('');
    } finally {
      setLoading(false);
    }
  };

  const fetchStaff = async () => {
    try {
      const res = await adminApi.getUsers('ADMIN');
      if (res.success && Array.isArray(res.users)) {
        setStaffUsers(res.users);
      }
    } catch (e) {
      console.warn('Could not load staff users:', e);
    }
  };

  useEffect(() => {
    fetchTickets();
    fetchStaff();
    const interval = setInterval(() => {
      fetchTickets();
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const activeTicket = tickets.find((t) => t.id === selectedTicketId) || tickets[0];

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !activeTicket || isSending) return;

    setIsSending(true);
    setNotificationStatus(null);

    const messageContent = replyText.trim();
    setReplyText('');

    try {
      const res = await adminApi.sendPqrsMessage(activeTicket.id, messageContent);
      if (res.success && res.message) {
        setTickets((prev) =>
          prev.map((t) =>
            t.id === activeTicket.id
              ? {
                  ...t,
                  status: t.status === 'OPEN' ? 'IN_PROGRESS' : t.status,
                  messages: [...(t.messages || []), res.message],
                }
              : t
          )
        );
        setNotificationStatus('📲 Respuesta enviada y notificación push emitida al residente.');
      }
    } catch (err) {
      console.error('Error sending reply:', err);
      setNotificationStatus('⚠️ Error al enviar respuesta.');
    } finally {
      setIsSending(false);
      setTimeout(() => setNotificationStatus(null), 5000);
    }
  };

  const handleUpdateStatus = async (newStatus: 'OPEN' | 'IN_PROGRESS' | 'WAITING_USER' | 'RESOLVED' | 'CLOSED' | 'CANCELLED') => {
    if (!activeTicket || isResolving) return;

    setIsResolving(true);
    setNotificationStatus(null);

    try {
      const res = await adminApi.updatePqrsStatus(activeTicket.id, newStatus);
      if (res.success) {
        setTickets((prev) =>
          prev.map((t) => (t.id === activeTicket.id ? { ...t, status: newStatus } : t))
        );
        setNotificationStatus(`✅ Estado actualizado a ${newStatus}. Notificación enviada al residente.`);
      }
    } catch (err) {
      console.error('Error updating ticket status:', err);
      setNotificationStatus('Error al actualizar estado.');
    } finally {
      setIsResolving(false);
      setTimeout(() => setNotificationStatus(null), 5000);
    }
  };

  const handleAssignStaff = async (staffId: string) => {
    if (!activeTicket) return;

    try {
      const res = await adminApi.assignPqrsStaff(activeTicket.id, staffId);
      if (res.success) {
        setTickets((prev) =>
          prev.map((t) =>
            t.id === activeTicket.id
              ? {
                  ...t,
                  assignedToUserId: staffId || undefined,
                  assignedToUser: staffUsers.find((s) => s.id === staffId),
                }
              : t
          )
        );
        setNotificationStatus(`✓ ${res.message}`);
        setTimeout(() => setNotificationStatus(null), 4000);
      }
    } catch (err: any) {
      alert('Error al asignar staff: ' + err.message);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'OPEN':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">ABIERTA</span>;
      case 'IN_PROGRESS':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/30">EN PROCESO</span>;
      case 'WAITING_USER':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/30">ESPERA RESIDENTE</span>;
      case 'RESOLVED':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">RESUELTA</span>;
      case 'CLOSED':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-500/10 text-slate-400 border border-slate-500/30">CERRADA</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">{status}</span>;
    }
  };

  const getPriorityBadge = (p?: string) => {
    switch (p) {
      case 'URGENTE':
        return <span className="px-2 py-0.5 rounded text-[9px] font-black bg-rose-500/20 text-rose-400 border border-rose-500/30">URGENTE</span>;
      case 'ALTA':
        return <span className="px-2 py-0.5 rounded text-[9px] font-black bg-amber-500/20 text-amber-400 border border-amber-500/30">ALTA</span>;
      case 'BAJA':
        return <span className="px-2 py-0.5 rounded text-[9px] font-medium bg-slate-800 text-slate-400 border border-slate-700">BAJA</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[9px] font-semibold bg-blue-500/20 text-blue-400 border border-blue-500/30">MEDIA</span>;
    }
  };

  const filteredTickets = tickets.filter((t) => {
    if (statusFilter === 'ALL') return true;
    return t.status === statusFilter;
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[calc(100vh-140px)]">
      {/* Ticket List Column */}
      <div className="glass-card p-5 rounded-3xl border border-slate-800 flex flex-col h-full space-y-3">
        <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-purple-400" />
              PQRS & Soporte (Fase 3)
            </h2>
            <p className="text-xs text-slate-400">Peticiones, quejas, reclamos y sugerencias</p>
          </div>
          <button
            onClick={fetchTickets}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title="Recargar tickets"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1">
          {['ALL', 'OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all whitespace-nowrap ${
                statusFilter === s
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-900 text-slate-400 hover:text-white'
              }`}
            >
              {s === 'ALL' ? 'Todos' : s}
            </button>
          ))}
        </div>

        {notificationStatus && (
          <div className="p-3 text-xs rounded-xl bg-blue-900/40 border border-blue-500/40 text-blue-200">
            {notificationStatus}
          </div>
        )}

        <div className="overflow-y-auto space-y-3 flex-1 pr-1">
          {filteredTickets.length === 0 ? (
            <div className="text-center py-10 text-slate-500 text-sm">No hay tickets registrados</div>
          ) : (
            filteredTickets.map((t) => {
              const isSelected = activeTicket && t.id === activeTicket.id;
              const unit = t.house?.unitNumber
                ? `Casa ${t.house.unitNumber}${t.house.block ? ` (${t.house.block})` : ''}`
                : t.resident?.property
                ? `${t.resident.property.unitNumber}${t.resident.property.block ? ` (${t.resident.property.block})` : ''}`
                : 'Sin vivienda';
              const residentName = t.resident?.fullName || 'Residente';

              return (
                <button
                  key={t.id}
                  onClick={() => setSelectedTicketId(t.id)}
                  className={`w-full text-left p-4 rounded-2xl border transition-all ${
                    isSelected
                      ? 'bg-blue-600/20 border-blue-500 shadow-md'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5 gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20">
                        {t.category}
                      </span>
                      {getPriorityBadge(t.priority)}
                    </div>
                    {getStatusBadge(t.status)}
                  </div>
                  <h3 className="font-bold text-sm text-white truncate mt-1">{t.subject}</h3>
                  <p className="text-xs text-slate-400 mt-1 truncate">
                    {residentName} • {unit}
                  </p>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Ticket Chat & Details Column */}
      {activeTicket ? (
        <div className="lg:col-span-2 glass-card p-6 rounded-3xl border border-slate-800 flex flex-col h-full">
          {/* Ticket Top Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4 mb-4">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-purple-500/10 text-purple-400 border border-purple-500/30">
                  {activeTicket.category}
                </span>
                {getPriorityBadge(activeTicket.priority)}
                <h3 className="text-lg font-bold text-white">{activeTicket.subject}</h3>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Enviado por <strong className="text-slate-200">{activeTicket.resident?.fullName || 'Residente'}</strong>{' '}
                {activeTicket.house && (
                  <span className="text-blue-400 font-bold ml-1">
                    (Casa {activeTicket.house.unitNumber} {activeTicket.house.block || ''})
                  </span>
                )}
                {activeTicket.resident?.email && <span className="ml-2 text-slate-500">• {activeTicket.resident.email}</span>}
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {getStatusBadge(activeTicket.status)}

              {/* Status Change Selector */}
              <select
                value={activeTicket.status}
                onChange={(e) => handleUpdateStatus(e.target.value as any)}
                disabled={isResolving}
                className="bg-slate-900 border border-slate-700 text-xs font-bold text-slate-200 rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-blue-500"
              >
                <option value="OPEN">ABIERTA</option>
                <option value="IN_PROGRESS">EN PROCESO</option>
                <option value="WAITING_USER">ESPERA RESIDENTE</option>
                <option value="RESOLVED">RESUELTA</option>
                <option value="CLOSED">CERRADA</option>
              </select>
            </div>
          </div>

          {/* Staff Assignment & Description Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
            <div className="sm:col-span-2 bg-slate-900/80 border border-slate-800 rounded-2xl p-3 text-xs text-slate-300">
              <span className="font-bold text-purple-300 block mb-1">Descripción de la solicitud:</span>
              <p className="leading-relaxed">{activeTicket.description}</p>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3 text-xs text-slate-300 flex flex-col justify-between">
              <span className="font-bold text-slate-400 flex items-center gap-1.5 mb-1.5">
                <UserCheck className="w-4 h-4 text-blue-400" />
                Personal Asignado:
              </span>
              <select
                value={activeTicket.assignedToUserId || ''}
                onChange={(e) => handleAssignStaff(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-xs text-slate-200 rounded-xl px-2.5 py-1.5 focus:outline-none"
              >
                <option value="">Sin Asignar</option>
                {staffUsers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.fullName} ({s.role})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Chat Conversation Body */}
          <div className="flex-1 overflow-y-auto space-y-4 p-4 rounded-2xl bg-slate-950/60 border border-slate-900 mb-4">
            {activeTicket.messages && activeTicket.messages.length > 0 ? (
              activeTicket.messages.map((m, idx) => {
                const senderName = m.sender?.fullName || (m.isStaff ? 'Administración Zentary' : activeTicket.resident?.fullName || 'Residente');
                const formattedTime = new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                return (
                  <div key={m.id || idx} className={`flex flex-col ${m.isStaff ? 'items-end' : 'items-start'}`}>
                    <div
                      className={`max-w-lg rounded-2xl p-4 text-sm leading-relaxed ${
                        m.isStaff
                          ? 'bg-blue-600 text-white rounded-br-none shadow-md'
                          : 'bg-slate-800 text-slate-100 border border-slate-700 rounded-bl-none'
                      }`}
                    >
                      <p className="text-[11px] font-bold opacity-75 mb-1">{senderName}</p>
                      <p className="whitespace-pre-wrap">{m.message || (m as any).text}</p>
                      <p className="text-[10px] text-right opacity-60 mt-2">{formattedTime}</p>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-slate-500 text-xs">Sin respuestas aún</div>
            )}
          </div>

          {/* Reply Box */}
          <form onSubmit={handleSendReply} className="flex items-center gap-3">
            <input
              type="text"
              placeholder="Escribe tu respuesta oficial como administración Zentary..."
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              disabled={isSending}
              className="flex-1 bg-slate-900 border border-slate-800 text-sm text-slate-100 placeholder-slate-500 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={isSending || !replyText.trim()}
              className="px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-md flex items-center gap-2 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              {isSending ? 'Enviando...' : 'Responder'}
            </button>
          </form>
        </div>
      ) : (
        <div className="lg:col-span-2 glass-card p-6 rounded-3xl border border-slate-800 flex items-center justify-center">
          <p className="text-slate-400">Selecciona un ticket para ver la conversación</p>
        </div>
      )}
    </div>
  );
};

export default PqrsSupportView;
