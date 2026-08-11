import React, { useState } from 'react';
import { MessageSquare, Send, CheckCircle2, Clock, User, Building2, AlertCircle } from 'lucide-react';

interface PqrsTicket {
  id: string;
  residentName: string;
  unitNumber: string;
  category: 'PETICION' | 'QUEJA' | 'RECLAMO' | 'SUGERENCIA';
  subject: string;
  description: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  createdAt: string;
  messages: { sender: string; isStaff: boolean; text: string; time: string }[];
}

const INITIAL_TICKETS: PqrsTicket[] = [
  {
    id: 'pq-1',
    residentName: 'María Camila Rodríguez',
    unitNumber: 'Apt 502 (Torre B)',
    category: 'PETICION',
    subject: 'Solicitud de tag de acceso electromagnético extra',
    description: 'Deseo solicitar un tag electromagnético adicional para mi segundo vehículo.',
    status: 'OPEN',
    createdAt: '10:15 AM',
    messages: [
      {
        sender: 'María Camila Rodríguez',
        isStaff: false,
        text: 'Hola administración, quisiera saber el costo de un tag extra para mi segundo carro.',
        time: '10:15 AM',
      },
    ],
  },
  {
    id: 'pq-2',
    residentName: 'Roberto Silva',
    unitNumber: 'Casa 14 (Manzana A)',
    category: 'QUEJA',
    subject: 'Reporte de ruido en horario nocturno',
    description: 'Música alta en la casa 12 pasada la medianoche del sábado.',
    status: 'IN_PROGRESS',
    createdAt: 'Ayer',
    messages: [
      {
        sender: 'Roberto Silva',
        isStaff: false,
        text: 'Buenas noches, reporto música muy fuerte en la casa 12.',
        time: '11:45 PM',
      },
      {
        sender: 'Administración Zentary',
        isStaff: true,
        text: 'Estimado Roberto, enviamos a la garita de seguridad a dar la advertencia correspondiente.',
        time: '11:55 PM',
      },
    ],
  },
];

export const PqrsSupportView: React.FC = () => {
  const [tickets, setTickets] = useState<PqrsTicket[]>(INITIAL_TICKETS);
  const [selectedTicketId, setSelectedTicketId] = useState<string>(INITIAL_TICKETS[0].id);
  const [replyText, setReplyText] = useState('');

  const activeTicket = tickets.find((t) => t.id === selectedTicketId) || tickets[0];

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !activeTicket) return;

    const newMessage = {
      sender: 'Administración Zentary',
      isStaff: true,
      text: replyText,
      time: 'Ahora',
    };

    setTickets((prev) =>
      prev.map((t) =>
        t.id === activeTicket.id
          ? {
              ...t,
              status: 'IN_PROGRESS' as const,
              messages: [...t.messages, newMessage],
            }
          : t
      )
    );

    setReplyText('');
  };

  const handleResolveTicket = () => {
    setTickets((prev) =>
      prev.map((t) => (t.id === activeTicket.id ? { ...t, status: 'RESOLVED' as const } : t))
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[calc(100vh-140px)]">
      {/* Ticket List Column */}
      <div className="glass-card p-5 rounded-3xl border border-slate-800 flex flex-col h-full space-y-4">
        <div className="border-b border-slate-800 pb-3">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-purple-400" />
            Tickets PQRS & Soporte
          </h2>
          <p className="text-xs text-slate-400">Solicitudes enviadas por los residentes</p>
        </div>

        <div className="overflow-y-auto space-y-3 flex-1 pr-1">
          {tickets.map((t) => {
            const isSelected = t.id === selectedTicketId;
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
                  <span className="text-[10px] text-slate-500">{t.createdAt}</span>
                </div>
                <h3 className="font-bold text-sm text-white truncate">{t.subject}</h3>
                <p className="text-xs text-slate-400 mt-1 truncate">{t.residentName} • {t.unitNumber}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Ticket Chat & Details Column */}
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
              Enviado por <strong className="text-slate-200">{activeTicket.residentName}</strong> ({activeTicket.unitNumber})
            </p>
          </div>

          {activeTicket.status !== 'RESOLVED' && (
            <button
              onClick={handleResolveTicket}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" /> Marcar Resuelto
            </button>
          )}
        </div>

        {/* Chat Conversation Body */}
        <div className="flex-1 overflow-y-auto space-y-4 p-4 rounded-2xl bg-slate-950/60 border border-slate-900 mb-4">
          {activeTicket.messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex flex-col ${m.isStaff ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-lg rounded-2xl p-4 text-sm leading-relaxed ${
                  m.isStaff
                    ? 'bg-blue-600 text-white rounded-br-none shadow-md'
                    : 'bg-slate-800 text-slate-100 border border-slate-700 rounded-bl-none'
                }`}
              >
                <p className="text-[11px] font-bold opacity-75 mb-1">{m.sender}</p>
                <p>{m.text}</p>
                <p className="text-[10px] text-right opacity-60 mt-2">{m.time}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Reply Box */}
        <form onSubmit={handleSendReply} className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Escribe tu respuesta oficial como administración Zentary..."
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            className="flex-1 bg-slate-900 border border-slate-800 text-sm text-slate-100 placeholder-slate-500 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500"
          />
          <button
            type="submit"
            className="px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-md flex items-center gap-2"
          >
            <Send className="w-4 h-4" /> Responder
          </button>
        </form>
      </div>
    </div>
  );
};

export default PqrsSupportView;
