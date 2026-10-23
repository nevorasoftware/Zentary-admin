import React, { useState, useEffect } from 'react';
import { Settings, Save, Trash2 } from 'lucide-react';
import { adminApi } from '../services/adminApi';
import { useToast } from '../components/Toast';
import { useConfirm } from '../components/ConfirmDialog';
import { TenantFormFields, TenantFormValues, EMPTY_TENANT_FORM, tenantToForm } from '../components/TenantFormFields';

const HOUSE_TYPE_OPTIONS = [
  { value: 'CASA', label: 'Casa' },
  { value: 'APARTAMENTO', label: 'Apartamento' },
  { value: 'LOCAL', label: 'Local' },
];

// Sección "Prefijos": códigos que anteceden al número de vivienda (ej. "A-", "Apt ")
const PrefijosSection: React.FC = () => {
  const toast = useToast();
  const confirm = useConfirm();
  const [prefixes, setPrefixes] = useState<any[]>([]);
  const [loadError, setLoadError] = useState('');
  const [code, setCode] = useState('');
  const [label, setLabel] = useState('');
  const [houseType, setHouseType] = useState('CASA');
  const [saving, setSaving] = useState(false);

  const fetchPrefixes = async () => {
    try {
      setLoadError('');
      const res = await adminApi.getHousePrefixes();
      if (res.success) {
        setPrefixes(res.prefixes || []);
      } else {
        setLoadError('No se pudo cargar la lista de prefijos.');
      }
    } catch (err) {
      setLoadError('No se pudo cargar la lista de prefijos.');
    }
  };

  useEffect(() => {
    fetchPrefixes();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    setSaving(true);
    try {
      const res = await adminApi.createHousePrefix({ code, label: label.trim() || undefined, houseType });
      if (res.success) {
        toast.success('Prefijo creado.');
        setCode('');
        setLabel('');
        fetchPrefixes();
      } else {
        toast.error(res.message || 'No se pudo crear el prefijo.');
      }
    } catch (err: any) {
      toast.error('No se pudo crear el prefijo: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (p: any) => {
    try {
      const res = await adminApi.updateHousePrefix(p.id, { isActive: !p.isActive });
      if (res.success) {
        fetchPrefixes();
      } else {
        toast.error(res.message || 'No se pudo actualizar el prefijo.');
      }
    } catch (err: any) {
      toast.error('No se pudo actualizar el prefijo: ' + err.message);
    }
  };

  const handleDelete = async (p: any) => {
    if (!(await confirm({ message: `¿Eliminar el prefijo "${p.code}"? Si tiene viviendas asociadas, solo se desactivará.` }))) return;
    try {
      const res = await adminApi.deleteHousePrefix(p.id);
      if (res.success) {
        toast.success(res.message || 'Prefijo eliminado.');
        fetchPrefixes();
      } else {
        toast.error(res.message || 'No se pudo eliminar el prefijo.');
      }
    } catch (err: any) {
      toast.error('No se pudo eliminar el prefijo: ' + err.message);
    }
  };

  const INPUT = 'w-full bg-slate-900/80 border border-slate-800 text-xs text-slate-100 rounded-xl px-3 py-2.5 focus:outline-none focus:border-blue-500';
  const LABEL = 'block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5';

  return (
    <section aria-labelledby="config-prefijos-titulo" className="glass-card p-6 rounded-3xl border border-slate-800 space-y-6">
      <div className="border-b border-slate-800 pb-4">
        <h2 id="config-prefijos-titulo" className="text-lg font-bold text-white">Prefijos de vivienda</h2>
        <p className="text-xs text-slate-400 mt-1">
          Si defines prefijos, las viviendas nuevas se crean como prefijo + número (ej. A-12). Sin prefijos, el número se escribe libremente.
        </p>
      </div>

      {loadError && <p className="text-xs text-rose-300" role="alert">{loadError}</p>}

      {prefixes.length > 0 && (
        <ul className="divide-y divide-slate-800">
          {prefixes.map((p) => (
            <li key={p.id} className="py-2 flex items-center justify-between gap-3 text-sm">
              <span className={p.isActive ? 'text-white' : 'text-slate-500 line-through'}>
                <strong>{p.code}</strong>
                {p.label ? <span className="text-slate-400"> · {p.label}</span> : null}
                <span className="text-slate-500 text-xs"> · {HOUSE_TYPE_OPTIONS.find((o) => o.value === p.houseType)?.label || p.houseType}</span>
              </span>
              <span className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleToggle(p)}
                  className="text-xs text-blue-400 hover:text-blue-300"
                >
                  {p.isActive ? 'Desactivar' : 'Activar'}
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(p)}
                  aria-label={`Eliminar prefijo ${p.code}`}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-300 hover:bg-slate-800"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={handleAdd} className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
        <div>
          <label htmlFor="config-prefijo-codigo" className={LABEL}>Prefijo</label>
          <input id="config-prefijo-codigo" type="text" value={code} onChange={(e) => setCode(e.target.value)} placeholder="Ej. A-" maxLength={20} className={INPUT} required />
        </div>
        <div>
          <label htmlFor="config-prefijo-etiqueta" className={LABEL}>Descripción</label>
          <input id="config-prefijo-etiqueta" type="text" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Ej. Torre A" className={INPUT} />
        </div>
        <div>
          <label htmlFor="config-prefijo-tipo" className={LABEL}>Tipo</label>
          <select id="config-prefijo-tipo" value={houseType} onChange={(e) => setHouseType(e.target.value)} className={INPUT}>
            {HOUSE_TYPE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="max-sm:min-h-11 py-2.5 px-5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white font-bold text-sm"
        >
          {saving ? 'Agregando...' : 'Agregar'}
        </button>
      </form>
    </section>
  );
};

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

      <PrefijosSection />
    </div>
  );
};

export default ConfiguracionView;
