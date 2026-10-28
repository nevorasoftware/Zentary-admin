import React, { useState, useEffect } from 'react';
import { Home, Plus, Search, Pencil, Download, Upload, UserCog } from 'lucide-react';
import { adminApi, HouseImportRow, HouseImportTotals } from '../services/adminApi';
import { useToast } from '../components/Toast';
import { useConfirm } from '../components/ConfirmDialog';
import ModalShell from '../components/ModalShell';
import CambiarResidenteModal from '../components/CambiarResidenteModal';

const LABEL = 'block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1';
const INPUT = 'w-full bg-slate-900 border border-slate-700 text-sm text-slate-100 rounded-xl px-4 py-2.5 focus:outline-none focus:border-blue-500';

export const ViviendasView: React.FC = () => {
  const toast = useToast();
  const confirm = useConfirm();
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
  // Cambio de residente
  const [changingHouse, setChangingHouse] = useState<any | null>(null);

  // Importar / exportar CSV
  const [exporting, setExporting] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [importCsv, setImportCsv] = useState('');
  const [importFileName, setImportFileName] = useState('');
  const [importStep, setImportStep] = useState<'archivo' | 'previsualizacion' | 'resultado'>('archivo');
  const [importBusy, setImportBusy] = useState(false);
  const [importTotals, setImportTotals] = useState<HouseImportTotals | null>(null);
  const [importRows, setImportRows] = useState<HouseImportRow[]>([]);
  const [sendingUserId, setSendingUserId] = useState('');
  const [sentUserIds, setSentUserIds] = useState<string[]>([]);

  const fetchData = async () => {
    try {
      // Con datos ya cargados se refresca en silencio, para no desmontar los modales abiertos
      if (houses.length === 0) setLoading(true);
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

  const handleExport = async () => {
    setExporting(true);
    try {
      const blob = await adminApi.exportHousesCsv();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `viviendas-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      toast.error(err.message || 'No se pudo exportar el archivo.');
    } finally {
      setExporting(false);
    }
  };

  const openImport = () => {
    setImportCsv('');
    setImportFileName('');
    setImportStep('archivo');
    setImportTotals(null);
    setImportRows([]);
    setSentUserIds([]);
    setIsImportOpen(true);
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error('El archivo supera el máximo de 2 MB.');
      return;
    }
    setImportBusy(true);
    try {
      const text = await file.text();
      const res = await adminApi.importHousesCsv(text, true, file.name);
      if (res.success && res.totals) {
        setImportCsv(text);
        setImportFileName(file.name);
        setImportTotals(res.totals);
        setImportRows(res.rows || []);
        setImportStep('previsualizacion');
      } else {
        toast.error(res.message || 'No se pudo procesar el archivo.');
      }
    } catch (err: any) {
      toast.error(err.message || 'No se pudo procesar el archivo.');
    } finally {
      setImportBusy(false);
    }
  };

  const handleImportConfirm = async () => {
    setImportBusy(true);
    try {
      const res = await adminApi.importHousesCsv(importCsv, false, importFileName);
      if (res.success && res.totals) {
        setImportTotals(res.totals);
        setImportRows(res.rows || []);
        setImportStep('resultado');
        fetchData();
      } else {
        toast.error(res.message || 'No se pudo aplicar la importación.');
      }
    } catch (err: any) {
      toast.error(err.message || 'No se pudo aplicar la importación.');
    } finally {
      setImportBusy(false);
    }
  };

  const handleSendCredentials = async (row: HouseImportRow) => {
    if (!row.usuarioId) return;
    if (!(await confirm({
      title: 'Enviar credenciales',
      message: `Se restablecerá la contraseña de ${row.nombre || row.correo} y se enviarán las credenciales a ${row.correo}. ¿Deseas continuar?`,
      confirmLabel: 'Enviar',
    }))) return;
    setSendingUserId(row.usuarioId);
    try {
      const res = await adminApi.resendCredentials(row.usuarioId, row.codigo);
      if (res.success) {
        toast.success(res.message || 'Credenciales enviadas.');
        setSentUserIds((prev) => [...prev, row.usuarioId as string]);
      } else {
        toast.error(res.message || 'No se pudieron enviar las credenciales.');
      }
    } catch (err: any) {
      toast.error(err.message || 'No se pudieron enviar las credenciales.');
    } finally {
      setSendingUserId('');
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
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={handleExport}
            disabled={exporting}
            className="max-sm:min-h-11 py-2.5 px-5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-60 text-white font-bold text-sm flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            {exporting ? 'Exportando...' : 'Exportar CSV'}
          </button>
          <button
            type="button"
            onClick={openImport}
            className="max-sm:min-h-11 py-2.5 px-5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm flex items-center justify-center gap-2"
          >
            <Upload className="w-4 h-4" />
            Importar CSV
          </button>
          <button
            type="button"
            onClick={openCreate}
            className="max-sm:min-h-11 py-2.5 px-5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Nueva vivienda
          </button>
        </div>
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
                    {(h.residents || []).some((r: any) => r.role === 'RESIDENT' && r.isActive) && (
                      <button
                        type="button"
                        onClick={() => setChangingHouse(h)}
                        aria-label={`Cambiar residente de la vivienda ${h.unitNumber}`}
                        title="Cambiar residente"
                        className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                      >
                        <UserCog className="w-4 h-4" />
                      </button>
                    )}
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

      {changingHouse && (
        <CambiarResidenteModal
          houseId={changingHouse.id}
          houseLabel={`${changingHouse.unitNumber}${changingHouse.block ? ` (${changingHouse.block})` : ''}`}
          residents={(changingHouse.residents || []).filter((r: any) => r.role === 'RESIDENT' && r.isActive)}
          onClose={() => setChangingHouse(null)}
          onDone={fetchData}
        />
      )}

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
      {isImportOpen && (
        <ModalShell onClose={() => !importBusy && setIsImportOpen(false)} labelledBy="viviendas-importar-titulo" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl space-y-4">
            <h3 id="viviendas-importar-titulo" className="text-lg font-extrabold text-white">
              Importar viviendas y residentes
            </h3>

            {importStep === 'archivo' && (
              <div className="space-y-3">
                <p className="text-sm text-slate-300">
                  Sube un archivo CSV con las columnas <span className="font-mono text-slate-100">codigo, bloque, tipo, estado, nombre, telefono, correo</span>.
                  Máximo 500 filas y 2 MB. Puedes usar el archivo de Exportar CSV como plantilla. Primero verás una previsualización y no se guardará nada hasta que confirmes.
                </p>
                <p className="text-xs text-slate-400">
                  No se envían credenciales al importar: podrás enviarlas una por una a los residentes nuevos.
                </p>
                <label htmlFor="viviendas-archivo-csv" className={LABEL}>Archivo CSV</label>
                <input
                  id="viviendas-archivo-csv"
                  type="file"
                  accept=".csv,text/csv"
                  disabled={importBusy}
                  onChange={handleImportFile}
                  className="w-full text-sm text-slate-300 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-slate-800 file:text-white file:font-bold"
                />
                {importBusy && <p className="text-sm text-slate-400" role="status">Procesando archivo...</p>}
              </div>
            )}

            {importStep !== 'archivo' && importTotals && (
              <div className="space-y-3">
                <p className="text-sm text-slate-300" role="status">
                  {importStep === 'previsualizacion' ? 'Previsualización de ' : 'Resultado de '}
                  <span className="font-semibold text-white">{importFileName}</span>:{' '}
                  {importTotals.filas} filas, {importTotals.creadas} nuevas, {importTotals.actualizadas} actualizadas,{' '}
                  {importTotals.sinCambios} sin cambios, {importTotals.errores} con error.
                </p>
                <div className="rounded-2xl border border-slate-800 overflow-x-auto max-h-80 overflow-y-auto">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-950/60 text-slate-400 uppercase font-bold tracking-wider border-b border-slate-800">
                      <tr>
                        <th className="px-3 py-2">Fila</th>
                        <th className="px-3 py-2">Código</th>
                        <th className="px-3 py-2">Vivienda</th>
                        <th className="px-3 py-2">Residente</th>
                        <th className="px-3 py-2">Detalle</th>
                        {importStep === 'resultado' && <th className="px-3 py-2"><span className="sr-only">Credenciales</span></th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {importRows.map((r) => (
                        <tr key={r.fila} className={r.vivienda === 'error' ? 'bg-rose-500/10' : ''}>
                          <td className="px-3 py-2">{r.fila}</td>
                          <td className="px-3 py-2 font-semibold text-white">{r.codigo || '—'}</td>
                          <td className="px-3 py-2">{r.vivienda.replace('_', ' ')}</td>
                          <td className="px-3 py-2">{r.usuario === 'ninguno' ? '—' : `${r.usuario.replace('_', ' ')}${r.correo ? ` (${r.correo})` : ''}`}</td>
                          <td className="px-3 py-2">{r.mensaje || '—'}</td>
                          {importStep === 'resultado' && (
                            <td className="px-3 py-2 text-right">
                              {r.usuario === 'creado' && r.usuarioId && (
                                sentUserIds.includes(r.usuarioId) ? (
                                  <span className="text-emerald-400 font-bold">Enviadas</span>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => handleSendCredentials(r)}
                                    disabled={sendingUserId === r.usuarioId}
                                    aria-label={`Enviar credenciales a ${r.correo}`}
                                    className="max-sm:min-h-11 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white font-bold"
                                  >
                                    {sendingUserId === r.usuarioId ? 'Enviando...' : 'Enviar credenciales'}
                                  </button>
                                )
                              )}
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsImportOpen(false)}
                disabled={importBusy}
                className="max-sm:min-h-11 flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-60 text-white text-sm font-bold"
              >
                {importStep === 'resultado' ? 'Cerrar' : 'Cancelar'}
              </button>
              {importStep === 'previsualizacion' && (
                <button
                  type="button"
                  onClick={handleImportConfirm}
                  disabled={importBusy || !importTotals || importTotals.errores === importTotals.filas}
                  className="max-sm:min-h-11 flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white text-sm font-bold"
                >
                  {importBusy ? 'Importando...' : 'Confirmar importación'}
                </button>
              )}
            </div>
          </div>
        </ModalShell>
      )}
    </div>
  );
};

export default ViviendasView;
