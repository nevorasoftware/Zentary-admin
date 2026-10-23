import React, { useState, useEffect } from 'react';
import { Car, Plus, Save, Trash2 } from 'lucide-react';
import { adminApi, ParkingZoneItem } from '../services/adminApi';
import { useToast } from './Toast';
import { useConfirm } from './ConfirmDialog';

const LABEL = 'block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5';
const INPUT = 'w-full bg-slate-900/80 border border-slate-800 text-xs text-slate-100 rounded-xl px-3 py-2.5 focus:outline-none focus:border-blue-500';

// Sección "Parqueos de visita" de Configuración: zonas, capacidad y minutos de espera
export const ParkingZonesSection: React.FC = () => {
  const toast = useToast();
  const confirm = useConfirm();
  const [loading, setLoading] = useState(true);
  // El backend puede no tener todavía los endpoints de parqueos (404)
  const [unavailable, setUnavailable] = useState(false);
  const [zones, setZones] = useState<ParkingZoneItem[]>([]);
  const [holdMinutes, setHoldMinutes] = useState('60');
  const [savingConfig, setSavingConfig] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCapacity, setNewCapacity] = useState('2');
  const [creating, setCreating] = useState(false);
  const [capacityDraft, setCapacityDraft] = useState<Record<string, string>>({});
  const [busyZoneId, setBusyZoneId] = useState<string | null>(null);

  const fetchZones = async () => {
    try {
      const res = await adminApi.getParkingZones();
      if (res.success) {
        setZones(res.zones || []);
        setHoldMinutes(String(res.holdMinutes ?? 60));
        setCapacityDraft({});
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
    fetchZones();
  }, []);

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingConfig(true);
    try {
      const res = await adminApi.updateParkingConfig(Number(holdMinutes));
      if (res.success) {
        toast.success('Minutos de espera actualizados.');
      } else {
        toast.error(res.message || 'No se pudieron guardar los minutos de espera.');
      }
    } catch (err: any) {
      toast.error('Error al guardar: ' + err.message);
    } finally {
      setSavingConfig(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await adminApi.createParkingZone({ name: newName.trim(), capacity: Number(newCapacity) });
      if (res.success) {
        toast.success('Zona de parqueo creada.');
        setNewName('');
        setNewCapacity('2');
        await fetchZones();
      } else {
        toast.error(res.message || 'No se pudo crear la zona.');
      }
    } catch (err: any) {
      toast.error('Error al crear la zona: ' + err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleSaveCapacity = async (zone: ParkingZoneItem) => {
    setBusyZoneId(zone.id);
    try {
      const res = await adminApi.updateParkingZone(zone.id, { capacity: Number(capacityDraft[zone.id]) });
      if (res.success) {
        toast.success('Capacidad actualizada.');
        await fetchZones();
      } else {
        toast.error(res.message || 'No se pudo actualizar la capacidad.');
      }
    } catch (err: any) {
      toast.error('Error al guardar: ' + err.message);
    } finally {
      setBusyZoneId(null);
    }
  };

  const handleToggle = async (zone: ParkingZoneItem) => {
    setBusyZoneId(zone.id);
    try {
      const res = await adminApi.updateParkingZone(zone.id, { isActive: !zone.isActive });
      if (res.success) {
        await fetchZones();
      } else {
        toast.error(res.message || 'No se pudo actualizar la zona.');
      }
    } catch (err: any) {
      toast.error('Error al guardar: ' + err.message);
    } finally {
      setBusyZoneId(null);
    }
  };

  const handleDelete = async (zone: ParkingZoneItem) => {
    if (!(await confirm({ title: 'Eliminar zona', message: `¿Eliminar la zona "${zone.name}"? Si tiene reservas registradas se desactivará.`, confirmLabel: 'Eliminar' }))) return;
    setBusyZoneId(zone.id);
    try {
      const res = await adminApi.deleteParkingZone(zone.id);
      if (res.success) {
        toast.success(res.deactivated ? 'La zona tiene reservas y se desactivó.' : 'Zona eliminada.');
        await fetchZones();
      } else {
        toast.error(res.message || 'No se pudo eliminar la zona.');
      }
    } catch (err: any) {
      toast.error('Error al eliminar: ' + err.message);
    } finally {
      setBusyZoneId(null);
    }
  };

  return (
    <section aria-labelledby="config-parqueos-titulo" className="glass-card p-6 rounded-3xl border border-slate-800 space-y-6">
      <div className="border-b border-slate-800 pb-4">
        <h2 id="config-parqueos-titulo" className="text-lg font-bold text-white flex items-center gap-2">
          <Car className="w-5 h-5 text-blue-500" />
          Parqueos de visita
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Zonas de parqueo para visitas con vehículo, su capacidad y los minutos que se guarda el espacio a partir de la hora de la visita.
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-slate-400" role="status">Cargando parqueos...</p>
      ) : unavailable ? (
        <p className="text-sm text-slate-400" role="status">
          La gestión de parqueos de visita aún no está disponible en el servidor.
        </p>
      ) : (
        <>
          <form onSubmit={handleSaveConfig} className="flex flex-col sm:flex-row sm:items-end gap-3">
            <div className="sm:w-56">
              <label htmlFor="parking-hold-minutes" className={LABEL}>Minutos de espera</label>
              <input id="parking-hold-minutes" type="number" min={5} max={720} required value={holdMinutes}
                onChange={(e) => setHoldMinutes(e.target.value)} className={INPUT} />
            </div>
            <button
              type="submit"
              disabled={savingConfig}
              className="max-sm:min-h-11 py-2.5 px-5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-60 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all"
            >
              <Save className="w-4 h-4" />
              {savingConfig ? 'Guardando...' : 'Guardar minutos'}
            </button>
          </form>

          {zones.length === 0 ? (
            <p className="text-sm text-slate-400">No hay zonas configuradas. Mientras no exista una, las visitas no reservan parqueo.</p>
          ) : (
            <ul className="space-y-3">
              {zones.map((zone) => {
                const draft = capacityDraft[zone.id] ?? String(zone.capacity);
                const changed = draft !== String(zone.capacity);
                return (
                  <li key={zone.id} className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-white text-sm truncate">{zone.name}</p>
                      <p className={zone.isActive ? 'text-xs text-emerald-400' : 'text-xs text-slate-400'}>
                        {zone.isActive ? 'Activa' : 'Inactiva'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <label htmlFor={`parking-capacity-${zone.id}`} className="text-xs text-slate-400">Capacidad</label>
                      <input id={`parking-capacity-${zone.id}`} type="number" min={1} max={500} value={draft}
                        onChange={(e) => setCapacityDraft({ ...capacityDraft, [zone.id]: e.target.value })}
                        className={`${INPUT} w-24`} />
                      {changed && (
                        <button
                          type="button"
                          disabled={busyZoneId === zone.id}
                          onClick={() => handleSaveCapacity(zone)}
                          className="max-sm:min-h-11 px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white text-xs font-bold"
                        >
                          Guardar
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={busyZoneId === zone.id}
                        onClick={() => handleToggle(zone)}
                        className="max-sm:min-h-11 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-60 text-slate-200 text-xs font-bold"
                      >
                        {zone.isActive ? 'Desactivar' : 'Activar'}
                      </button>
                      <button
                        type="button"
                        disabled={busyZoneId === zone.id}
                        onClick={() => handleDelete(zone)}
                        aria-label={`Eliminar zona ${zone.name}`}
                        className="max-sm:min-h-11 max-sm:min-w-11 p-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-60 text-rose-400 flex items-center justify-center"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-[1fr_8rem_auto] gap-3 sm:items-end">
            <div>
              <label htmlFor="parking-new-name" className={LABEL}>Nueva zona</label>
              <input id="parking-new-name" type="text" required maxLength={60} placeholder="Ej. Entrada principal" value={newName}
                onChange={(e) => setNewName(e.target.value)} className={INPUT} />
            </div>
            <div>
              <label htmlFor="parking-new-capacity" className={LABEL}>Capacidad</label>
              <input id="parking-new-capacity" type="number" min={1} max={500} required value={newCapacity}
                onChange={(e) => setNewCapacity(e.target.value)} className={INPUT} />
            </div>
            <button
              type="submit"
              disabled={creating}
              className="max-sm:min-h-11 py-2.5 px-5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-60 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all"
            >
              <Plus className="w-4 h-4" />
              {creating ? 'Creando...' : 'Agregar zona'}
            </button>
          </form>
        </>
      )}
    </section>
  );
};

export default ParkingZonesSection;
