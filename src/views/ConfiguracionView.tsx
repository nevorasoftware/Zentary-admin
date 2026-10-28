import React, { useState, useEffect } from 'react';
import { Settings, Save } from 'lucide-react';
import { adminApi } from '../services/adminApi';
import { useToast } from '../components/Toast';
import { TenantFormFields, TenantFormValues, EMPTY_TENANT_FORM, tenantToForm } from '../components/TenantFormFields';

export const ConfiguracionView: React.FC = () => {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [needsTenant, setNeedsTenant] = useState(false);
  const [form, setForm] = useState<TenantFormValues>(EMPTY_TENANT_FORM);
  const [saving, setSaving] = useState(false);

  const fetchTenant = async () => {
    try {
      setLoading(true);
      setLoadError('');
      setNeedsTenant(false);
      const res = await adminApi.getCurrentTenant();
      if (res.success && res.tenant) {
        setForm(tenantToForm(res.tenant));
      } else if (res.code === 'TENANT_REQUIRED') {
        setNeedsTenant(true);
      } else {
        setLoadError(res.message || 'No se pudo cargar la configuración de la residencial.');
      }
    } catch (err) {
      setLoadError('No se pudo cargar la configuración de la residencial.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTenant();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await adminApi.updateCurrentTenant(form);
      if (res.success) {
        toast.success('Configuración actualizada.');
        if (res.tenant) setForm(tenantToForm(res.tenant));
      } else {
        toast.error('Error al guardar: ' + (res.message || 'No se pudo actualizar la configuración.'));
      }
    } catch (err: any) {
      toast.error('Error al guardar: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="text-sm text-slate-400" role="status">Cargando configuración...</p>;
  }

  if (needsTenant) {
    return (
      <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/60 text-sm text-slate-300" role="status">
        Selecciona una residencial en el selector superior para ver su configuración.
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="p-6 rounded-2xl border border-rose-500/30 bg-rose-500/10 text-sm text-rose-300 space-y-3" role="alert">
        <p>{loadError}</p>
        <button
          type="button"
          onClick={fetchTenant}
          className="max-sm:min-h-11 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Las siguientes secciones de configuración se agregan debajo, cada una en su propia tarjeta */}
      <section aria-labelledby="config-general-titulo" className="glass-card p-6 rounded-3xl border border-slate-800 space-y-6">
        <div className="border-b border-slate-800 pb-4">
          <h2 id="config-general-titulo" className="text-lg font-bold text-white flex items-center gap-2">
            <Settings className="w-5 h-5 text-blue-500" />
            Datos generales
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Contacto, país y zona horaria de la residencial. El nombre se cambia desde el encabezado.
          </p>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <TenantFormFields idPrefix="config" values={form} onChange={setForm} />
          <button
            type="submit"
            disabled={saving}
            className="max-sm:min-h-11 w-full sm:w-auto py-3 px-6 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-60 text-white font-bold text-sm shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-all"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </form>
      </section>
    </div>
  );
};

export default ConfiguracionView;
