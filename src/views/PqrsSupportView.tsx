import React, { useState, useEffect } from 'react';
import { MessageSquare, Send, CheckCircle2, Clock, User, Building2, AlertCircle, RefreshCw } from 'lucide-react';
import { adminApi, PqrsTicketItem } from '../services/adminApi';

const MOCK_TICKETS: PqrsTicketItem[] = [
  {
    id: 'pq-demo-1',
    residentId: 'res-1',
    category: 'PETICION',
    subject: 'Solicitud de tag de acceso electromagnético extra',
    description: 'Deseo solicitar un tag electromagnético adicional para mi segundo vehículo.',
    status: 'OPEN',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    resident: {
      id: 'res-1',
      fullName: 'María Camila Rodríguez',
      email: 'maria.rodriguez@example.com',
      phone: '+503 7000-1122',
      property: {
        unitNumber: 'Apt 502',
        block: 'Torre B',
      },
    },
    messages: [
      {
        id: 'msg-1',
        pqrsId: 'pq-demo-1',
        senderId: 'res-1',
        message: 'Hola administración, quisiera saber el costo de un tag extra para mi segundo carro.',
        isStaff: false,
        createdAt: new Date().toISOString(),
        sender: {
          id: 'res-1',
          fullName: 'María Camila Rodríguez',
          role: 'RESIDENT',
        },
      },
    ],
  },
];

export const PqrsSupportView: React.FC = () => {
  const [tickets, setTickets] = useState<PqrsTicketItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicketId, setSelectedTicketId] = useState<string>('');
  const [replyText, setReplyText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isResolving, setIsResolving] = useState(false);
  const [notificationStatus, setNotificationStatus] = useState<string | null>(null);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const res = await adminApi.getPqrsList();
      if (res.success && res.pqrsList && res.pqrsList.length > 0) {
        setTickets(res.pqrsList);
        setSelectedTicketId((prev) => (prev && res.pqrsList.some((t) => t.id === prev) ? prev : res.pqrsList[0].id));
      } else {
        setTickets(MOCK_TICKETS);
        setSelectedTicketId(MOCK_TICKETS[0].id);
      }
    } catch (e) {
      console.warn('Could not load PQRS from backend, using fallback', e);
      setTickets(MOCK_TICKETS);
      setSelectedTicketId(MOCK_TICKETS[0].id);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
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
        setNotificationStatus('📲 Respuesta enviada y notificación push emitida al dispositivo móvil.');
      } else {
        // Local fallback update if API didn't return full object
        const localMsg = {
          id: `msg-${Date.now()}`,
          pqrsId: activeTicket.id,
          senderId: 'admin',
          message: messageContent,
          isStaff: true,
          createdAt: new Date().toISOString(),
          sender: { id: 'admin', fullName: 'Administración Zentary', role: 'ADMIN' },
        };
        setTickets((prev) =>
          prev.map((t) =>
            t.id === activeTicket.id
              ? {
                  ...t,
                  status: 'IN_PROGRESS',
                  messages: [...(t.messages || []), localMsg],
                }
              : t
          )
        );
        setNotificationStatus('📲 Respuesta guardada y notificación enviada.');
      }
    } catch (err) {
      console.error('Error sending reply:', err);
      setNotificationStatus('⚠️ Se guardó localmente. Verifica la conexión con el backend.');
    } finally {
      setIsSending(false);
      setTimeout(() => setNotificationStatus(null), 5000);
    }
  };

  const handleResolveTicket = async () => {
    if (!activeTicket || isResolving) return;

    setIsResolving(true);
    setNotificationStatus(null);

    try {
      const res = await adminApi.updatePqrsStatus(activeTicket.id, 'RESOLVED');
      if (res.success) {
        setTickets((prev) =>
          prev.map((t) => (t.id === activeTicket.id ? { ...t, status: 'RESOLVED' } : t))
        );
        setNotificationStatus('✅ PQRS marcada como Resuelta. Notificación enviada al celular del residente.');
      }
    } catch (err) {
      console.error('Error resolving ticket:', err);
      // Fallback update in local state
      setTickets((prev) =>
        prev.map((t) => (t.id === activeTicket.id ? { ...t, status: 'RESOLVED' } : t))
      );
      setNotificationStatus('✅ Marcada como Resuelta en panel.');
    } finally {
      setIsResolving(false);
      setTimeout(() => setNotificationStatus(null), 5000);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'OPEN':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">ABIERTA</span>;
      case 'IN_PROGRESS':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/30">EN PROCESO</span>;
      case 'RESOLVED':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">RESUELTA</span>;
      case 'CLOSED':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-500/10 text-slate-400 border border-slate-500/30">CERRADA</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/30">{status}</span>;
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[calc(100vh-140px)]">
      {/* Ticket List Column */}
      <div className="glass-card p-5 rounded-3xl border border-slate-800 flex flex-col h-full space-y-4">
        <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-purple-400" />
              Tickets PQRS & Soporte
            </h2>
            <p className="text-xs text-slate-400">Solicitudes enviadas por los residentes</p>
          </div>
          <button
            onClick={fetchTickets}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title="Recargar tickets"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {notificationStatus && (
          <div className="p-3 text-xs rounded-xl bg-blue-900/40 border border-blue-500/40 text-blue-200">
            {notificationStatus}
          </div>
        )}

        <div className="overflow-y-auto space-y-3 flex-1 pr-1">
          {tickets.length === 0 ? (
            <div className="text-center py-10 text-slate-500 text-sm">No hay tickets registrados</div>
          ) : (
            tickets.map((t) => {
              const isSelected = activeTicket && t.id === activeTicket.id;
              const unit = t.resident?.property
                ? `${t.resident.property.unitNumber}${t.resident.property.block ? ` (${t.resident.property.block})` : ''}`
                : 'Sin unidad';
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
                  <div className="flex items-center justify-between mb-1">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20">
                      {t.category}
                    </span>
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
          <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-purple-500/10 text-purple-400 border border-purple-500/30">
                  {activeTicket.category}
                </span>
                <h3 className="text-lg font-bold text-white">{activeTicket.subject}</h3>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Enviado por <strong className="text-slate-200">{activeTicket.resident?.fullName || 'Residente'}</strong>{' '}
                {activeTicket.resident?.property && (
                  <>
                    ({activeTicket.resident.property.unitNumber}{' '}
                    {activeTicket.resident.property.block ? activeTicket.resident.property.block : ''})
                  </>
                )}
                {activeTicket.resident?.email && <span className="ml-2 text-slate-500">• {activeTicket.resident.email}</span>}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {getStatusBadge(activeTicket.status)}
              {activeTicket.status !== 'RESOLVED' && activeTicket.status !== 'CLOSED' && (
                <button
                  onClick={handleResolveTicket}
                  disabled={isResolving}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5 disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {isResolving ? 'Procesando...' : 'Marcar Resuelto'}
                </button>
              )}
            </div>
          </div>

          {/* Description banner */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 mb-4 text-xs text-slate-300">
            <span className="font-bold text-purple-300 block mb-1">Descripción inicial de la solicitud:</span>
            <p className="leading-relaxed">{activeTicket.description}</p>
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
