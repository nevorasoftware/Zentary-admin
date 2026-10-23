import React, { useState } from 'react';
import { Building2, X } from 'lucide-react';
import { adminApi } from '../services/adminApi';
import ModalShell from './ModalShell';
import { TenantFormFields, TenantFormValues, EMPTY_TENANT_FORM } from './TenantFormFields';

interface NuevaResidencialModalProps {
  onClose: () => void;
  onCreated: (tenantId: string) => void;
}

// Alta de residencial (solo SUPER_ADMIN). No crea administrador inicial.
export const NuevaResidencialModal: React.FC<NuevaResidencialModalProps> = ({ onClose, onCreated }) => {
  const [name, setName] = useState('');
  const [form, setForm] = useState<TenantFormValues>(EMPTY_TENANT_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('El nombre de la residencial es obligatorio.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const res = await adminApi.createTenant({
        name: name.trim(),
        address: form.address.trim() || undefined,
        city: form.city.trim() || undefined,
        phone: form.phone.trim() || undefined,
        email: form.email.trim() || undefined,
        whatsapp: form.whatsapp.trim() || undefined,
        country: form.country,
        timezone: form.timezone,
      });
      if (res.success && res.tenant) {
        onCreated(res.tenant.id);
        return;
      }
      setError(res.message || 'No se pudo crear la residencial.');
    } catch (err) {
      setError('No se pudo crear la residencial.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell onClose={onClose} labelledBy="nueva-residencial-titulo" className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="glass-card max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 md:p-8 rounded-3xl border border-slate-700 shadow-2xl space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <h3 id="nueva-residencial-titulo" className="text-xl font-bold text-white flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-500" />
            Nueva residencial
          </h3>
          <button aria-label="Cerrar" onClick={onClose} className="max-sm:min-h-11 max-sm:min-w-11 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="nueva-residencial-nombre" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Nombre *
            </label>
            <input
              id="nueva-residencial-nombre"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
              className="w-full bg-slate-900/80 border border-slate-800 text-xs text-slate-100 rounded-xl px-3 py-2.5 focus:outline-none focus:border-blue-500"
            />
          </div>

          <TenantFormFields idPrefix="nueva-residencial" values={form} onChange={setForm} />

          {error && <p role="alert" className="text-xs text-rose-400">{error}</p>}

          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="max-sm:min-h-11 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-bold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="max-sm:min-h-11 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-60 text-white font-bold text-sm"
            >
              {saving ? 'Creando...' : 'Crear residencial'}
            </button>
          </div>
        </form>
      </div>
    </ModalShell>
  );
};

export default NuevaResidencialModal;
