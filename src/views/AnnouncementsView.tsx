import React, { useState, useEffect } from 'react';
import {
  Megaphone,
  Send,
  Trash2,
  BellRing,
  Sparkles,
  AlertTriangle,
  Calendar,
  Info,
  Flame,
  Image as ImageIcon,
  Users,
  Building,
} from 'lucide-react';
import { adminApi, AnnouncementItem } from '../services/adminApi';

export const AnnouncementsView: React.FC = () => {
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [category, setCategory] = useState<'MANTENIMIENTO' | 'URGENTE' | 'EVENTO' | 'GENERAL'>('GENERAL');
  const [priority, setPriority] = useState<'NORMAL' | 'IMPORTANTE' | 'URGENTE'>('NORMAL');
  const [targetAudience, setTargetAudience] = useState<'TODOS' | 'BLOQUE'>('TODOS');
  const [targetBlock, setTargetBlock] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [publishing, setPublishing] = useState(false);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const res = await adminApi.getAnnouncements();
      if (res.success && Array.isArray(res.announcements)) {
        setAnnouncements(res.announcements);
      }
    } catch (err) {
      console.warn('Error fetching announcements from API.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !body) return;

    try {
      setPublishing(true);
      const res = await adminApi.createAnnouncement({
        title: title.trim(),
        body: body.trim(),
        category,
        priority,
        targetAudience,
        targetBlock: targetAudience === 'BLOQUE' ? targetBlock : undefined,
        imageUrl: imageUrl.trim() || undefined,
      });

      if (res.success) {
        alert('📢 Comunicado transmitido y notificado a la comunidad.');
        setTitle('');
        setBody('');
        setImageUrl('');
        setTargetBlock('');
        setCategory('GENERAL');
        setPriority('NORMAL');
        setTargetAudience('TODOS');
        fetchAnnouncements();
      } else {
        alert('Error al publicar anuncio.');
      }
    } catch (err: any) {
      alert('Error al publicar: ' + err.message);
    } finally {
      setPublishing(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Estás seguro de eliminar este comunicado?')) {
      try {
        await adminApi.deleteAnnouncement(id);
        setAnnouncements(announcements.filter((a) => a.id !== id));
      } catch (err: any) {
        alert('Error al eliminar: ' + err.message);
      }
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

  const getPriorityBadge = (p?: string) => {
    switch (p) {
      case 'URGENTE':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-500/20 text-rose-400 border border-rose-500/40">🚨 URGENTE</span>;
      case 'IMPORTANTE':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-400 border border-amber-500/40">⚠️ IMPORTANTE</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">NORMAL</span>;
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Broadcast Creation Form */}
      <div className="glass-card p-6 rounded-3xl border border-slate-800 space-y-6">
        <div className="border-b border-slate-800 pb-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-blue-500" />
            Crear Comunicado Residencial (Fase 3)
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Los comunicados se difunden vía notificaciones push a la aplicación móvil y se fijan en la cartelera digital.
          </p>
        </div>

        <form onSubmit={handlePublish} className="space-y-4">
          {/* Categoría */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Categoría
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

          {/* Prioridad y Público Objetivo */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Prioridad
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full bg-slate-900 border border-slate-800 text-xs font-bold text-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-blue-500"
              >
                <option value="NORMAL">Normal</option>
                <option value="IMPORTANTE">Importante</option>
                <option value="URGENTE">Urgente</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Destinatarios
              </label>
              <select
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value as any)}
                className="w-full bg-slate-900 border border-slate-800 text-xs font-bold text-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-blue-500"
              >
                <option value="TODOS">Toda la Comunidad</option>
                <option value="BLOQUE">Bloque / Torre Específica</option>
              </select>
            </div>
          </div>

          {targetAudience === 'BLOQUE' && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Nombre del Bloque o Torre
              </label>
              <input
                type="text"
                placeholder="Ej. Torre A o Senda 3"
                value={targetBlock}
                onChange={(e) => setTargetBlock(e.target.value)}
                required
                className="w-full bg-slate-900 border border-slate-800 text-xs text-slate-100 rounded-xl px-3 py-2.5 focus:outline-none focus:border-blue-500"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Título del Comunicado *
            </label>
            <input
              type="text"
              placeholder="Ej. Limpieza de Cisterna de Agua"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-900/80 border border-slate-800 text-sm text-slate-100 placeholder-slate-500 rounded-xl px-4 py-2.5 focus:outline-none focus:border-blue-500 transition-all"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Contenido del Mensaje *
            </label>
            <textarea
              rows={4}
              placeholder="Escribe los detalles del anuncio que verán los residentes..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="w-full bg-slate-900/80 border border-slate-800 text-sm text-slate-100 placeholder-slate-500 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 transition-all resize-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Imagen de Cabecera (Opcional)
            </label>
            <input
              type="text"
              placeholder="https://images.unsplash.com/..."
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="w-full bg-slate-900/80 border border-slate-800 text-xs text-slate-100 rounded-xl px-3 py-2 focus:outline-none focus:border-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={publishing}
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-all"
          >
            {publishing ? (
              <span className="animate-spin">⏳</span>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Transmitir Comunicado a Residentes
              </>
            )}
          </button>
        </form>
      </div>

      {/* Announcements Feed */}
      <div className="lg:col-span-2 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <BellRing className="w-4 h-4 text-amber-400" />
            Cartelera Digital Vigente ({announcements.length})
          </h3>
          <span className="text-xs text-slate-500">Sincronizado con base de datos</span>
        </div>

        {loading ? (
          <div className="text-center py-12 text-slate-500 text-sm">Cargando comunicados...</div>
        ) : announcements.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-sm glass-card rounded-3xl p-8 border border-slate-800">
            No hay comunicados publicados aún.
          </div>
        ) : (
          <div className="space-y-4">
            {announcements.map((a) => {
              const badge = getCategoryBadge(a.category);
              const BadgeIcon = badge.icon;

              return (
                <div
                  key={a.id}
                  className="glass-card p-6 rounded-3xl border border-slate-800 hover:border-slate-700 transition-all space-y-3"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${badge.bg}`}
                      >
                        <BadgeIcon className="w-3.5 h-3.5" />
                        {badge.label}
                      </span>
                      {getPriorityBadge(a.priority)}
                      {a.targetBlock && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                          {a.targetBlock}
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => handleDelete(a.id)}
                      className="text-slate-500 hover:text-rose-400 transition-colors p-1"
                      title="Eliminar comunicado"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div>
                    <h4 className="text-base font-bold text-white mb-1.5">{a.title}</h4>
                    <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">{a.body}</p>
                  </div>

                  {a.imageUrl && (
                    <div className="rounded-2xl overflow-hidden max-h-48 border border-slate-800">
                      <img src={a.imageUrl} alt={a.title} className="w-full h-full object-cover" />
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-800/60">
                    <span>Publicado por: {a.author?.fullName || 'Administración Zentary'}</span>
                    <span>
                      {new Date(a.createdAt).toLocaleDateString('es-ES', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AnnouncementsView;
