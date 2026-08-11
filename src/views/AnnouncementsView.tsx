import React, { useState } from 'react';
import { Megaphone, Send, Trash2, BellRing, Sparkles, AlertTriangle, Calendar, Info } from 'lucide-react';
import { AnnouncementItem } from '../services/adminApi';

const INITIAL_ANNOUNCEMENTS: AnnouncementItem[] = [
  {
    id: 'a1',
    title: 'Mantenimiento de Piscina Principal',
    body: 'Estimados residentes, el área de la piscina permanecerá cerrada el próximo jueves por labores de limpieza general.',
    category: 'MANTENIMIENTO',
    createdAt: '2026-08-11T09:30:00Z',
    author: { fullName: 'Administración Zentary' },
  },
  {
    id: 'a2',
    title: 'Asamblea General Ordinaria de Residentes',
    body: 'Se convoca a todos los propietarios a la asamblea anual en el salón social el sábado 20 de agosto a las 05:00 PM.',
    category: 'EVENTO',
    createdAt: '2026-08-08T14:00:00Z',
    author: { fullName: 'Administración Zentary' },
  },
];

export const AnnouncementsView: React.FC = () => {
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>(INITIAL_ANNOUNCEMENTS);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [category, setCategory] = useState<'MANTENIMIENTO' | 'URGENTE' | 'EVENTO' | 'GENERAL'>('GENERAL');
  const [publishing, setPublishing] = useState(false);

  const handlePublish = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !body) return;

    setPublishing(true);

    setTimeout(() => {
      const newAnnouncement: AnnouncementItem = {
        id: `ann-${Date.now()}`,
        title,
        body,
        category,
        createdAt: new Date().toISOString(),
        author: { fullName: 'Administración Zentary' },
      };

      setAnnouncements([newAnnouncement, ...announcements]);
      setTitle('');
      setBody('');
      setCategory('GENERAL');
      setPublishing(false);
      alert('¡Anuncio transmitido exitosamente a la aplicación móvil Zentary!');
    }, 600);
  };

  const handleDelete = (id: string) => {
    if (confirm('¿Estás seguro de eliminar este comunicado?')) {
      setAnnouncements(announcements.filter((a) => a.id !== id));
    }
  };

  const getCategoryBadge = (cat: string) => {
    switch (cat) {
      case 'MANTENIMIENTO':
        return { label: 'MANTENIMIENTO', bg: 'bg-blue-500/10 text-blue-400 border-blue-500/30', icon: Info };
      case 'URGENTE':
        return { label: 'URGENTE', bg: 'bg-rose-500/10 text-rose-400 border-rose-500/30', icon: AlertTriangle };
      case 'EVENTO':
        return { label: 'EVENTO', bg: 'bg-purple-500/10 text-purple-400 border-purple-500/30', icon: Calendar };
      default:
        return { label: 'GENERAL', bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30', icon: Sparkles };
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Broadcast Creation Form */}
      <div className="glass-card p-6 rounded-3xl border border-slate-800 space-y-6">
        <div className="border-b border-slate-800 pb-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-blue-500" />
            Crear Anuncio Residencial
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Los anuncios publicados se mostrarán inmediatamente en la pantalla de inicio de la aplicación de los residentes.
          </p>
        </div>

        <form onSubmit={handlePublish} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Categoría del Comunicado
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(['GENERAL', 'MANTENIMIENTO', 'URGENTE', 'EVENTO'] as const).map((cat) => (
                <button
                  type="button"
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border ${
                    category === cat
                      ? 'bg-blue-600 text-white border-blue-500 shadow-md'
                      : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Título del Anuncio *
            </label>
            <input
              type="text"
              placeholder="Ej. Limpieza de Cisterna de Agua"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-900/80 border border-slate-800 text-sm text-slate-100 placeholder-slate-500 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 transition-all"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Contenido del Mensaje *
            </label>
            <textarea
              rows={5}
              placeholder="Escribe los detalles del anuncio que verán todos los residentes..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="w-full bg-slate-900/80 border border-slate-800 text-sm text-slate-100 placeholder-slate-500 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 transition-all resize-none"
              required
            />
          </div>

          <button
            type="submit"
            disabled={publishing}
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-all"
          >
            <Send className="w-4 h-4" />
            {publishing ? 'Transmitiendo...' : 'Publicar a la App Móvil'}
          </button>
        </form>
      </div>

      {/* Broadcast Feed */}
      <div className="lg:col-span-2 glass-card p-6 rounded-3xl border border-slate-800 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <BellRing className="w-5 h-5 text-emerald-400" />
              Historial de Anuncios Publicados
            </h2>
            <p className="text-xs text-slate-400 mt-1">Anuncios activos visibles en los celulares de los residentes</p>
          </div>
          <span className="px-3 py-1 text-xs font-bold rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
            {announcements.length} Anuncios
          </span>
        </div>

        <div className="space-y-4">
          {announcements.map((item) => {
            const badge = getCategoryBadge(item.category);
            const Icon = badge.icon;
            return (
              <div key={item.id} className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all space-y-3">
                <div className="flex items-center justify-between">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold border ${badge.bg}`}>
                    <Icon className="w-3 h-3" />
                    {badge.label}
                  </span>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="text-slate-500 hover:text-rose-400 p-1 transition-colors"
                    title="Eliminar comunicado"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div>
                  <h3 className="text-base font-bold text-white">{item.title}</h3>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">{item.body}</p>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-800/60">
                  <span>Publicado por: {item.author?.fullName}</span>
                  <span>{new Date(item.createdAt).toLocaleDateString('es-ES')}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AnnouncementsView;
