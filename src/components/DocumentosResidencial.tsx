import React, { useState, useEffect } from 'react';
import { FileText, Plus, Trash2 } from 'lucide-react';
import { adminApi, isSafeUrl, TenantDocumentItem } from '../services/adminApi';
import { useToast } from './Toast';
import { useConfirm } from './ConfirmDialog';

const LABEL = 'block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5';
const INPUT = 'w-full bg-slate-900/80 border border-slate-800 text-xs text-slate-100 rounded-xl px-3 py-2.5 focus:outline-none focus:border-blue-500';

// Sección "Documentos y normas" de Configuración: documentos publicados por enlace
export const DocumentosResidencial: React.FC = () => {
  const toast = useToast();
  const confirm = useConfirm();
  const [loading, setLoading] = useState(true);
  // El backend puede no tener todavía los endpoints de documentos (404)
  const [unavailable, setUnavailable] = useState(false);
  const [documents, setDocuments] = useState<TenantDocumentItem[]>([]);
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [creating, setCreating] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const fetchDocuments = async () => {
    try {
      const res = await adminApi.getDocuments();
      if (res.success) {
        setDocuments(res.documents || []);
        setUnavailable(false);
      } else {
        setUnavailable(true);
      }
    } catch (err) {
      setUnavailable(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await adminApi.createDocument({ title: title.trim(), url: url.trim() });
      if (res.success) {
        toast.success('Documento publicado.');
        setTitle('');
        setUrl('');
        await fetchDocuments();
      } else {
        toast.error(res.message || 'No se pudo publicar el documento.');
      }
    } catch (err: any) {
      toast.error('Error al publicar el documento: ' + err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (doc: TenantDocumentItem) => {
    if (!(await confirm({ title: 'Eliminar documento', message: `¿Eliminar el documento "${doc.title}"?`, confirmLabel: 'Eliminar' }))) return;
    setBusyId(doc.id);
    try {
      const res = await adminApi.deleteDocument(doc.id);
      if (res.success) {
        toast.success('Documento eliminado.');
        await fetchDocuments();
      } else {
        toast.error(res.message || 'No se pudo eliminar el documento.');
      }
    } catch (err: any) {
      toast.error('Error al eliminar: ' + err.message);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section aria-labelledby="config-documentos-titulo" className="glass-card p-6 rounded-3xl border border-slate-800 space-y-6">
      <div className="border-b border-slate-800 pb-4">
        <h2 id="config-documentos-titulo" className="text-lg font-bold text-white flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-500" />
          Documentos y normas
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Enlaces a las normas y documentos de la residencial. Los residentes los ven desde la app.
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-slate-400" role="status">Cargando documentos...</p>
      ) : unavailable ? (
        <p className="text-sm text-slate-400" role="status">
          La gestión de documentos aún no está disponible en el servidor.
        </p>
      ) : (
        <>
          <form onSubmit={handleCreate} className="flex flex-col sm:flex-row sm:items-end gap-3">
            <div className="sm:w-56">
              <label htmlFor="documento-titulo" className={LABEL}>Título</label>
              <input id="documento-titulo" type="text" required maxLength={120} value={title}
                onChange={(e) => setTitle(e.target.value)} placeholder="Reglamento interno" className={INPUT} />
            </div>
            <div className="flex-1">
              <label htmlFor="documento-url" className={LABEL}>Enlace (https://)</label>
              <input id="documento-url" type="url" required maxLength={2000} pattern="https://.*" value={url}
                onChange={(e) => setUrl(e.target.value)} placeholder="https://..." className={INPUT} />
            </div>
            <button
              type="submit"
              disabled={creating}
              className="max-sm:min-h-11 py-2.5 px-5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-60 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all"
            >
              <Plus className="w-4 h-4" />
              {creating ? 'Publicando...' : 'Agregar'}
            </button>
          </form>

          {documents.length === 0 ? (
            <p className="text-sm text-slate-400">Aún no has publicado documentos.</p>
          ) : (
            <ul className="space-y-3">
              {documents.map((doc) => (
                <li key={doc.id} className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-white text-sm truncate">{doc.title}</p>
                    {isSafeUrl(doc.url) && (
                      <a href={doc.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-400 hover:underline truncate block">
                        {doc.url}
                      </a>
                    )}
                  </div>
                  <button
                    type="button"
                    disabled={busyId === doc.id}
                    onClick={() => handleDelete(doc)}
                    aria-label={`Eliminar ${doc.title}`}
                    className="max-sm:min-h-11 p-2 rounded-xl text-rose-400 hover:bg-rose-500/10 disabled:opacity-60"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  );
};
