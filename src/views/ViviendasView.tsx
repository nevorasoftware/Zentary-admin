import React, { useState, useEffect } from 'react';
import { Home, Plus, Search, Pencil } from 'lucide-react';
import { adminApi } from '../services/adminApi';
import { useToast } from '../components/Toast';
import ModalShell from '../components/ModalShell';

const LABEL = 'block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1';
const INPUT = 'w-full bg-slate-900 border border-slate-700 text-sm text-slate-100 rounded-xl px-4 py-2.5 focus:outline-none focus:border-blue-500';

export const ViviendasView: React.FC = () => {
  const toast = useToast();
  const [houses, setHouses] = useState<any[]>([]);
  const [prefixes, setPrefixes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Modal de crear / editar
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHouse, setEditingHouse] = useState<any | null>(null);
  const [formPrefixId, setFormPrefixId] = useState('');
  const [formNumber, setFormNumber] = useState('');
  const [formBlock, setFormBlock] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      setLoadError('');
      const [housesRes, prefixesRes] = await Promise.all([adminApi.getHouses(), adminApi.getHousePrefixes()]);
      if (housesRes.success && housesRes.houses) {
        setHouses(housesRes.houses);
      } else {
        setLoadError('No se pudo cargar la lista de viviendas.');
      }
      if (prefixesRes.success) setPrefixes(prefixesRes.prefixes || []);
    } catch (err) {
      setLoadError('No se pudo cargar la lista de viviendas.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const activePrefixes = prefixes.filter((p) => p.isActive);
  const hasPrefixes = activePrefixes.length > 0;

  const openCreate = () => {
    setEditingHouse(null);
    setFormPrefixId('');
    setFormNumber('');
    setFormBlock('');
    setIsModalOpen(true);
  };

  const openEdit = (house: any) => {
    setEditingHouse(house);
    const prefix = prefixes.find((p) => p.id === house.prefixId);
    setFormPrefixId(prefix ? prefix.id : '');
    // Con prefijo, el número es lo que sigue al código; sin prefijo, es el unitNumber actual
    setFormNumber(prefix && house.unitNumber.startsWith(prefix.code) ? house.unitNumber.slice(prefix.code.length) : house.unitNumber);
    setFormBlock(house.block || '');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const number = formNumber.trim();
    if (!number) {
      toast.error('El número de vivienda es obligatorio.');
      return;
    }
    if (hasPrefixes && !formPrefixId && !(editingHouse && number === editingHouse.unitNumber)) {
      toast.error('Selecciona un prefijo para la vivienda.');
      return;
    }
    setSaving(true);
    try {
      const body = formPrefixId ? { prefixId: formPrefixId, number } : { unitNumber: number };
      const res = editingHouse
        ? await adminApi.updateHouse(editingHouse.id, { ...body, block: formBlock.trim() || null })
        : await adminApi.createHouse({ ...body, ...(formBlock.trim() ? { block: formBlock.trim() } : {}) });
      if (res.success) {
        toast.success(editingHouse ? 'Vivienda actualizada.' : 'Vivienda creada.');
        setIsModalOpen(false);
        fetchData();
      } else {
        toast.error(res.message || 'No se pudo guardar la vivienda.');
      }
    } catch (err: any) {
      toast.error(err.message || 'No se pudo guardar la vivienda.');
    } finally {
      setSaving(false);
    }
  };

  const filteredHouses = houses.filter((h) => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return true;
    const residents = (h.residents || []).map((r: any) => r.fullName || '').join(' ');
    return `${h.unitNumber} ${h.block || ''} ${residents}`.toLowerCase().includes(q);
  });

  if (loading) {
    return <p className="text-sm text-slate-400" role="status">Cargando viviendas...</p>;
  }

  if (loadError) {
    return (
      <div className="p-6 rounded-2xl border border-rose-500/30 bg-rose-500/10 text-sm text-rose-300 space-y-3" role="alert">
        <p>{loadError}</p>
        <button
          type="button"
          onClick={fetchData}
          className="max-sm:min-h-11 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-sm">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            aria-label="Buscar viviendas"
            placeholder="Buscar por número, bloque o residente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 text-sm text-slate-100 rounded-xl pl-9 pr-4 py-2.5 focus:outline-none focus:border-blue-500"
          />
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="max-sm:min-h-11 py-2.5 px-5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Nueva vivienda
        </button>
      </div>

      <div className="glass-card rounded-3xl border border-slate-800 overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="bg-slate-950/60 text-slate-400 uppercase text-xs font-bold tracking-wider border-b border-slate-800">
            <tr>
              <th className="px-6 py-4">Vivienda</th>
              <th className="px-6 py-4">Bloque</th>
              <th className="px-6 py-4">Residentes</th>
              <th className="px-6 py-4"><span className="sr-only">Acciones</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {filteredHouses.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-slate-400">
                  {houses.length === 0 ? 'No hay viviendas registradas en la residencial.' : 'No se encontraron viviendas.'}
                </td>
              </tr>
            ) : (
              filteredHouses.map((h) => (
                <tr key={h.id}>
                  <td className="px-6 py-3 font-semibold text-white flex items-center gap-2">
                    <Home className="w-4 h-4 text-blue-500" />
                    {h.unitNumber}
                  </td>
                  <td className="px-6 py-3">{h.block || '—'}</td>
                  <td className="px-6 py-3">
                    {h.residents?.length > 0 ? h.residents.map((r: any) => r.fullName).join(', ') : '—'}
                  </td>
                  <td className="px-6 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => openEdit(h)}
                      aria-label={`Editar vivienda ${h.unitNumber}`}
                      className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <ModalShell onClose={() => setIsModalOpen(false)} labelledBy="viviendas-modal-titulo" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <h3 id="viviendas-modal-titulo" className="text-lg font-extrabold text-white mb-4">
              {editingHouse ? 'Editar vivienda' : 'Nueva vivienda'}
            </h3>
            <form onSubmit={handleSave} className="space-y-4">
              {(hasPrefixes || formPrefixId) && (
                <div>
                  <label htmlFor="viviendas-prefijo" className={LABEL}>Prefijo {hasPrefixes ? '*' : ''}</label>
                  <select
                    id="viviendas-prefijo"
                    value={formPrefixId}
                    onChange={(e) => setFormPrefixId(e.target.value)}
                    className={INPUT}
                  >
                    <option value="">Seleccionar prefijo</option>
                    {prefixes.filter((p) => p.isActive || p.id === formPrefixId).map((p) => (
                      <option key={p.id} value={p.id}>{p.code}{p.label ? ` (${p.label})` : ''}</option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label htmlFor="viviendas-numero" className={LABEL}>Número *</label>
                <input
                  id="viviendas-numero"
                  type="text"
                  value={formNumber}
                  onChange={(e) => setFormNumber(e.target.value)}
                  className={INPUT}
                  required
                />
              </div>
              <div>
                <label htmlFor="viviendas-bloque" className={LABEL}>Bloque / Manzana / Torre</label>
                <input
                  id="viviendas-bloque"
                  type="text"
                  value={formBlock}
                  onChange={(e) => setFormBlock(e.target.value)}
                  className={INPUT}
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="max-sm:min-h-11 flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-sm font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="max-sm:min-h-11 flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white text-sm font-bold"
                >
                  {saving ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </ModalShell>
      )}
    </div>
  );
};

export default ViviendasView;
