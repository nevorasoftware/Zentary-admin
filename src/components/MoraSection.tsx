import React, { useEffect, useState } from 'react';
import { Clock, Save } from 'lucide-react';
import { adminApi } from '../services/adminApi';
import { useToast } from './Toast';

const LABEL = 'block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5';
const INPUT = 'w-full bg-slate-900/80 border border-slate-800 text-xs text-slate-100 rounded-xl px-3 py-2.5 focus:outline-none focus:border-blue-500';

// Mora: días de gracia y recargo que el servidor aplica cada día a los cobros vencidos de la residencial
export const MoraSection: React.FC = () => {
  const toast = useToast();
  const [graceDays, setGraceDays] = useState('3');
  const [lateFeePercent, setLateFeePercent] = useState('5');
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await adminApi.getCurrentTenant();
        const s = res.success ? res.tenant?.settings : null;
        if (s) {
          setGraceDays(String(s.defaultGraceDays));
          setLateFeePercent(String(s.defaultLateFeePercent));
          setLoaded(true);
        }
      } catch {
        // sin configuración cargada la sección queda oculta
      }
    };
    load();
  }, []);

  if (!loaded) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const days = Number(graceDays);
    const percent = Number(lateFeePercent);
    if (!Number.isInteger(days) || days < 0 || days > 60) {
      toast.error('Los días de gracia deben ser un número entero entre 0 y 60.');
      return;
    }
    if (!Number.isFinite(percent) || lateFeePercent.trim() === '' || percent < 0 || percent > 100) {
      toast.error('El recargo por mora debe estar entre 0 y 100.');
      return;
    }
    try {
      setSaving(true);
      const res = await adminApi.updateTenantSettings({ defaultGraceDays: days, defaultLateFeePercent: percent });
      if (res.success) toast.success('Configuración de mora guardada.');
      else toast.error(res.message || 'No se pudo guardar la configuración de mora.');
    } catch {
      toast.error('No se pudo guardar la configuración de mora.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section aria-labelledby="config-mora-titulo" className="glass-card p-6 rounded-3xl border border-slate-800 space-y-6">
      <div className="border-b border-slate-800 pb-4">
        <h2 id="config-mora-titulo" className="text-lg font-bold text-white flex items-center gap-2">
          <Clock className="w-5 h-5 text-blue-500" />
          Mora
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Los cobros vencidos reciben el recargo después de los días de gracia, y la vivienda no puede reservar amenidades hasta ponerse al día.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="mora-gracia" className={LABEL}>Días de gracia</label>
            <input id="mora-gracia" type="number" min={0} max={60} step={1} value={graceDays}
              onChange={(e) => setGraceDays(e.target.value)} className={INPUT} />
          </div>
          <div>
            <label htmlFor="mora-recargo" className={LABEL}>% de recargo por mora</label>
            <input id="mora-recargo" type="number" min={0} max={100} step="any" value={lateFeePercent}
              onChange={(e) => setLateFeePercent(e.target.value)} className={INPUT} />
          </div>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="max-sm:min-h-11 w-full sm:w-auto py-3 px-6 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-60 text-white font-bold text-sm shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-all"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Guardando...' : 'Guardar mora'}
        </button>
      </form>
    </section>
  );
};
