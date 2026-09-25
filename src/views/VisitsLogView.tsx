import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldCheck,
  QrCode,
  Search,
  CheckCircle2,
  Clock,
  Car,
  User,
  Check,
  X,
  AlertTriangle,
  LogOut,
  LogIn,
  Plus,
  RefreshCw,
  Building2,
  Phone,
  FileText,
  Radio,
  Eye,
} from 'lucide-react';
import { adminApi } from '../services/adminApi';

interface ActiveVisitItem {
  id: string;
  visitorName: string;
  visitorPhone?: string;
  visitorDni?: string;
  vehiclePlate?: string;
  entryType: string;
  entryDate: string;
  gateName: string;
  residentName: string;
  residentPhone?: string;
  houseUnit: string;
  maxDurationHours: number;
  elapsedMinutes: number;
  remainingMinutes: number;
  isExceeded: boolean;
  exceededMinutes: number;
  severity: 'NORMAL' | 'WARNING' | 'EXCEEDED';
}

interface ExpectedVisitItem {
  id: string;
  visitorName: string;
  visitorPhone?: string;
  hasVehicle: boolean;
  vehiclePlate?: string;
  validFrom: string;
  resident?: { fullName: string; phone?: string };
  house?: { unitNumber: string; block?: string };
}

export const VisitsLogView: React.FC = () => {
  // Tabs: 'monitor' (Garita Operativa) | 'history' (Auditoría Forense)
  const [activeTab, setActiveTab] = useState<'monitor' | 'history'>('monitor');

  // Metrics and Live Data
  const [summary, setSummary] = useState({ totalInside: 0, totalExceeded: 0, totalExpectedToday: 0 });
  const [activeVisits, setActiveVisits] = useState<ActiveVisitItem[]>([]);
  const [expectedVisits, setExpectedVisits] = useState<ExpectedVisitItem[]>([]);
  const [historyVisits, setHistoryVisits] = useState<any[]>([]);

  // Loading and Filtering
  const [loading, setLoading] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [currentGate, setCurrentGate] = useState('Garita Principal');

  // QR Scanning & Entry Validation State
  const [qrInput, setQrInput] = useState('');
  const [scanning, setScanning] = useState(false);
  const [scannedResult, setScannedResult] = useState<any | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [confirmingEntry, setConfirmingEntry] = useState(false);

  // Quick Entry Modal State
  const [isQuickEntryOpen, setIsQuickEntryOpen] = useState(false);
  const [quickForm, setQuickForm] = useState({
    visitorName: '',
    visitorDni: '',
    visitorPhone: '',
    vehiclePlate: '',
    houseId: '',
    unitNumber: '',
    entryType: 'VISIT',
    notes: '',
  });
  const [availableHouses, setAvailableHouses] = useState<any[]>([]);
  const [quickSubmitting, setQuickSubmitting] = useState(false);

  // Success Feedback Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const qrInputRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Fetch Garita real-time data
  const fetchGaritaData = async () => {
    try {
      setLoading(true);
      const res = await adminApi.getActiveInsideVisits();
      if (res.success) {
        setSummary(res.summary);
        setActiveVisits(res.activeVisits || []);
        setExpectedVisits(res.expectedToday || []);
      }
    } catch (err) {
      console.warn('Error fetching active inside visits:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch history data
  const fetchHistoryData = async () => {
    try {
      const res = await adminApi.getVisits({ search: searchFilter });
      if (res.success) {
        setHistoryVisits(res.visits || []);
      }
    } catch (err) {
      console.warn('Error fetching visits history:', err);
    }
  };

  // Fetch houses list for quick entry modal
  const fetchHouses = async () => {
    try {
      const res = await adminApi.getHouses();
      if (res.success && res.houses) {
        setAvailableHouses(res.houses);
      }
    } catch (err) {
      console.warn('Error loading houses:', err);
    }
  };

  useEffect(() => {
    fetchGaritaData();
    fetchHouses();

    // Auto-refresh monitor every 15 seconds for live stopwatches
    const interval = setInterval(() => {
      fetchGaritaData();
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (activeTab === 'history') {
      fetchHistoryData();
    }
  }, [activeTab, searchFilter]);

  // Handle Scanning or Submitting QR Token
  const handleScanSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!qrInput.trim()) return;

    try {
      setScanning(true);
      setScanError(null);
      setScannedResult(null);

      const res = await adminApi.scanQRToken(qrInput.trim());

      if (res.success && res.valid && res.visit) {
        setScannedResult(res.visit);
        setQrInput('');
      } else {
        setScanError(res.message || 'Código QR inválido o expirado.');
      }
    } catch (err: any) {
      setScanError(err.message || 'Error de conexión al validar código QR.');
    } finally {
      setScanning(false);
    }
  };

  // Confirm Entry from Scanned Card
  const handleConfirmEntry = async (visitId: string) => {
    try {
      setConfirmingEntry(true);
      const res = await adminApi.confirmEntry(visitId, {
        gateName: currentGate,
        vehiclePlate: scannedResult?.vehiclePlate !== 'N/A' ? scannedResult?.vehiclePlate : undefined,
      });

      if (res.success) {
        showToast(`✅ Ingreso registrado para ${scannedResult?.visitorName}`);
        setScannedResult(null);
        fetchGaritaData();
      } else {
        alert(res.message || 'No fue posible registrar el ingreso.');
      }
    } catch (err: any) {
      alert(`Error al confirmar ingreso: ${err.message}`);
    } finally {
      setConfirmingEntry(false);
    }
  };

  // Register Exit (Check-out)
  const handleRegisterExit = async (visitId: string, visitorName: string) => {
    if (!confirm(`¿Confirmar la salida de ${visitorName}?`)) return;

    try {
      const res = await adminApi.registerExit(visitId);
      if (res.success) {
        showToast(`🚪 Salida registrada para ${visitorName} (Permanencia: ${res.durationFormatted})`);
        fetchGaritaData();
        if (activeTab === 'history') fetchHistoryData();
      } else {
        alert(res.message || 'Error al registrar salida.');
      }
    } catch (err: any) {
      alert(`Error al registrar salida: ${err.message}`);
    }
  };

  // Submit Quick Entry (Direct Gate Check-in)
  const handleQuickEntrySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickForm.visitorName.trim()) {
      alert('El nombre del visitante o conductor es obligatorio.');
      return;
    }

    try {
      setQuickSubmitting(true);
      const res = await adminApi.quickEntry({
        ...quickForm,
        gateName: currentGate,
      });

      if (res.success) {
        showToast(`✅ Ingreso directo registrado para ${quickForm.visitorName}`);
        setIsQuickEntryOpen(false);
        setQuickForm({
          visitorName: '',
          visitorDni: '',
          visitorPhone: '',
          vehiclePlate: '',
          houseId: '',
          unitNumber: '',
          entryType: 'VISIT',
          notes: '',
        });
        fetchGaritaData();
      } else {
        alert(res.message || 'Error al procesar ingreso rápido.');
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setQuickSubmitting(false);
    }
  };

  // Format Elapsed Minutes to readable string (e.g. "1h 45m" or "32 min")
  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h}h ${m}m`;
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-emerald-400/40 animate-bounce">
          <CheckCircle2 className="w-5 h-5" />
          <span className="font-semibold text-sm">{toastMessage}</span>
        </div>
      )}

      {/* Top Controls Bar: Gate Selector, Status, & Quick Entry Button */}
      <div className="glass-card p-4 rounded-3xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white">Garita de Seguridad Digital 2.0</h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                EN VIVO
              </span>
            </div>
            <p className="text-xs text-slate-400">Control de accesos con QR Dinámico y Estado de Permanencia</p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Gate Selector */}
          <select
            value={currentGate}
            onChange={(e) => setCurrentGate(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-xs text-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-emerald-500"
          >
            <option value="Garita Principal">Garita Principal</option>
            <option value="Garita Norte">Garita Norte</option>
            <option value="Acceso Peatonal">Acceso Peatonal</option>
            <option value="Garita Proveedores">Garita Proveedores</option>
          </select>

          {/* Quick Entry Button */}
          <button
            onClick={() => setIsQuickEntryOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-blue-600/30 transition-all whitespace-nowrap"
          >
            <Plus className="w-4 h-4" /> Ingreso Rápido
          </button>

          {/* Manual Refresh */}
          <button
            onClick={() => {
              fetchGaritaData();
              if (activeTab === 'history') fetchHistoryData();
            }}
            disabled={loading}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all"
            title="Refrescar datos de garita"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI Metrics: DENTRO, EXCEDIDOS, ESPERADOS HOY */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Metric 1: Dentro */}
        <div className="glass-card p-5 rounded-3xl border border-slate-800 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 tracking-wider uppercase">Dentro del Complejo</span>
            <span className="w-3 h-3 rounded-full bg-emerald-500 animate-ping"></span>
          </div>
          <div className="mt-2 flex items-baseline gap-3">
            <span className="text-4xl font-extrabold text-white">{summary.totalInside}</span>
            <span className="text-xs text-emerald-400 font-medium">visitantes / vehículos</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">En estancia activa con entrada registrada</p>
        </div>

        {/* Metric 2: Excedidos */}
        <div
          className={`glass-card p-5 rounded-3xl border transition-all ${
            summary.totalExceeded > 0
              ? 'border-rose-500/50 bg-rose-950/20'
              : 'border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 tracking-wider uppercase">Sobretiempo / Excedidos</span>
            <AlertTriangle
              className={`w-5 h-5 ${summary.totalExceeded > 0 ? 'text-rose-400 animate-bounce' : 'text-slate-600'}`}
            />
          </div>
          <div className="mt-2 flex items-baseline gap-3">
            <span
              className={`text-4xl font-extrabold ${
                summary.totalExceeded > 0 ? 'text-rose-400' : 'text-slate-400'
              }`}
            >
              {summary.totalExceeded}
            </span>
            <span className="text-xs text-rose-400/80 font-medium">
              {summary.totalExceeded === 1 ? 'visitante excedido' : 'visitantes excedidos'}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">Superaron el tiempo máximo permitido</p>
        </div>

        {/* Metric 3: Esperados Hoy */}
        <div className="glass-card p-5 rounded-3xl border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 tracking-wider uppercase">Esperados Hoy</span>
            <Clock className="w-5 h-5 text-blue-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-3">
            <span className="text-4xl font-extrabold text-white">{summary.totalExpectedToday}</span>
            <span className="text-xs text-blue-400 font-medium">visitas programadas</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">Con FastPass pendiente de ingreso</p>
        </div>
      </div>

      {/* QR Scanner & Verification Box */}
      <div className="glass-card p-6 rounded-3xl border border-slate-800 space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <QrCode className="w-5 h-5 text-emerald-400" />
              Validación Inmediata de Pase QR (Criptográfico HMAC-SHA256)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Escanea el código QR presentado en la app móvil o escribe el código de pase FastPass.
            </p>
          </div>

          <form onSubmit={handleScanSubmit} className="flex items-center gap-2 w-full md:w-auto">
            <input
              ref={qrInputRef}
              type="text"
              placeholder="Escanea o pega token ZNT2..."
              value={qrInput}
              onChange={(e) => setQrInput(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 rounded-xl px-4 py-2.5 focus:outline-none focus:border-emerald-500 font-mono w-full md:w-72"
            />
            <button
              type="submit"
              disabled={scanning || !qrInput.trim()}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs whitespace-nowrap shadow-lg shadow-emerald-600/30 transition-all"
            >
              {scanning ? 'Verificando...' : 'Verificar QR'}
            </button>
          </form>
        </div>

        {/* Scan Error Feedback */}
        {scanError && (
          <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{scanError}</span>
            </div>
            <button onClick={() => setScanError(null)} className="text-rose-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Scanned Verification Card (Authorized Visitor Result) */}
        {scannedResult && (
          <div className="p-6 rounded-3xl bg-slate-900/90 border border-emerald-500/50 shadow-2xl space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                <span className="text-sm font-extrabold text-emerald-400 uppercase tracking-wide">
                  Pase Válido y Autorizado
                </span>
              </div>
              <button
                onClick={() => setScannedResult(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div>
                <span className="text-slate-500 block">Visitante:</span>
                <span className="font-bold text-white text-sm">{scannedResult.visitorName}</span>
                <span className="text-slate-400 block mt-0.5">DUI/Doc: {scannedResult.documentNumber || scannedResult.visitorDni || 'N/A'}</span>
              </div>

              <div>
                <span className="text-slate-500 block">Destino (Vivienda):</span>
                <span className="font-bold text-blue-400 text-sm">{scannedResult.propertyUnit}</span>
                <span className="text-slate-400 block mt-0.5">Residente: {scannedResult.residentName}</span>
              </div>

              <div>
                <span className="text-slate-500 block">Vehículo:</span>
                <span className="font-bold text-white text-sm">
                  {scannedResult.hasVehicle ? scannedResult.vehiclePlate : 'Peatonal / A pie'}
                </span>
                <span className="text-slate-400 block mt-0.5">
                  {scannedResult.vehicleModel !== 'N/A' ? scannedResult.vehicleModel : 'Sin datos de modelo'}
                </span>
              </div>

              <div>
                <span className="text-slate-500 block">Estadía Autorizada:</span>
                <span className="font-bold text-white text-sm">{scannedResult.maxDurationHours || 4} Horas</span>
                <span className="text-slate-400 block mt-0.5">Garita: {currentGate}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setScannedResult(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-all"
              >
                Descartar
              </button>
              <button
                onClick={() => handleConfirmEntry(scannedResult.id)}
                disabled={confirmingEntry}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/30 transition-all"
              >
                <LogIn className="w-4 h-4" />
                {confirmingEntry ? 'Registrando...' : 'Confirmar Entrada e Ingreso'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Tabs Navigation: Garita Monitor vs Historial */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-1">
        <button
          onClick={() => setActiveTab('monitor')}
          className={`px-5 py-2.5 rounded-2xl font-bold text-xs flex items-center gap-2 transition-all ${
            activeTab === 'monitor'
              ? 'bg-slate-800 text-white border border-slate-700 shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          Estado de Permanencia ({activeVisits.length})
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`px-5 py-2.5 rounded-2xl font-bold text-xs flex items-center gap-2 transition-all ${
            activeTab === 'history'
              ? 'bg-slate-800 text-white border border-slate-700 shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <FileText className="w-4 h-4 text-blue-400" />
          Historial y Auditoría de Accesos
        </button>
      </div>

      {/* TAB 1: GARITA OPERATIVA & ESTADO DE PERMANENCIA */}
      {activeTab === 'monitor' && (
        <div className="space-y-6">
          {/* Active Visitors Inside List */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-emerald-400" />
                Visitantes Actualmente Dentro del Complejo ({activeVisits.length})
              </h3>
              <span className="text-xs text-slate-500">
                Actualizado en tiempo real con cronómetros individuales
              </span>
            </div>

            {activeVisits.length === 0 ? (
              <div className="glass-card p-12 rounded-3xl border border-slate-800 text-center space-y-3">
                <ShieldCheck className="w-12 h-12 text-slate-600 mx-auto" />
                <h4 className="text-base font-bold text-slate-300">No hay visitantes dentro en este momento</h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Todos los visitantes autorizados han registrado su salida o aún no han ingresado por la garita.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {activeVisits.map((item) => {
                  const percentUsed = Math.min(
                    100,
                    Math.round((item.elapsedMinutes / (item.maxDurationHours * 60)) * 100)
                  );

                  return (
                    <div
                      key={item.id}
                      className={`glass-card p-5 rounded-3xl border transition-all space-y-4 ${
                        item.severity === 'EXCEEDED'
                          ? 'border-rose-500/60 bg-rose-950/20 shadow-lg shadow-rose-900/20'
                          : item.severity === 'WARNING'
                          ? 'border-amber-500/50 bg-amber-950/10'
                          : 'border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {/* Card Header: Badge & Elapsed Time */}
                      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${
                            item.severity === 'EXCEEDED'
                              ? 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                              : item.severity === 'WARNING'
                              ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                              : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                          }`}
                        >
                          {item.severity === 'EXCEEDED'
                            ? `Tiempo prolongado (+${formatDuration(item.exceededMinutes)})`
                            : item.severity === 'WARNING'
                            ? `Tiempo estimado ${formatDuration(item.remainingMinutes)}`
                            : 'Permanencia Activa'}
                        </span>

                        <span className="text-xs font-mono text-slate-300 font-bold flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          {formatDuration(item.elapsedMinutes)} dentro
                        </span>
                      </div>

                      {/* Visitor Details */}
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h4 className="font-bold text-white text-base leading-tight">{item.visitorName}</h4>
                            <span className="text-[11px] text-slate-400">
                              DUI: {item.visitorDni || 'No registrado'}
                            </span>
                          </div>
                          <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                            {item.entryType}
                          </span>
                        </div>

                        <div className="flex items-center gap-4 text-xs text-slate-300">
                          <span className="flex items-center gap-1.5">
                            <Car className="w-4 h-4 text-emerald-400" />
                            <strong className="text-white font-mono">{item.vehiclePlate || 'A pie'}</strong>
                          </span>
                          <span className="text-slate-500">•</span>
                          <span className="text-slate-400">
                            Entrada: {new Date(item.entryDate).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>

                      {/* Destination House & Resident */}
                      <div className="p-3 rounded-2xl bg-slate-900/70 border border-slate-800/80 text-xs space-y-1">
                        <div className="flex items-center justify-between text-slate-400">
                          <span>Destino:</span>
                          <span className="font-bold text-blue-400">{item.houseUnit}</span>
                        </div>
                        <div className="flex items-center justify-between text-slate-400">
                          <span>Residente:</span>
                          <span className="font-semibold text-white">{item.residentName}</span>
                        </div>
                      </div>

                      {/* Progress Bar of Time Used */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-[10px] text-slate-500">
                          <span>Límite: {item.maxDurationHours}h</span>
                          <span>{percentUsed}% consumido</span>
                        </div>
                        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-500 ${
                              item.severity === 'EXCEEDED'
                                ? 'bg-rose-500'
                                : item.severity === 'WARNING'
                                ? 'bg-amber-500'
                                : 'bg-emerald-500'
                            }`}
                            style={{ width: `${percentUsed}%` }}
                          />
                        </div>
                      </div>

                      {/* Action Button: Check-out */}
                      <button
                        onClick={() => handleRegisterExit(item.id, item.visitorName)}
                        className="w-full py-2.5 px-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-rose-400 hover:text-rose-300 font-bold text-xs border border-rose-500/20 hover:border-rose-500/40 flex items-center justify-center gap-2 transition-all shadow-md"
                      >
                        <LogOut className="w-4 h-4" /> Marcar Salida de Garita
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section: Visitas Esperadas Hoy (Nuevos Avisos) */}
          {expectedVisits.length > 0 && (
            <div className="glass-card p-6 rounded-3xl border border-slate-800 space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-blue-400" />
                Nuevos Avisos: Visitas Esperadas para Hoy ({expectedVisits.length})
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {expectedVisits.map((exp) => (
                  <div key={exp.id} className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-sm">{exp.visitorName}</span>
                      <span className="text-blue-400 font-mono">
                        {new Date(exp.validFrom).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-slate-400">
                      Hacia: <strong className="text-slate-200">{exp.house?.unitNumber || 'Vivienda'}</strong> ({exp.resident?.fullName})
                    </p>
                    {exp.vehiclePlate && (
                      <p className="text-emerald-400 font-mono">Placa: {exp.vehiclePlate}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: HISTORIAL Y AUDITORÍA FORENSE DE ACCESOS */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          {/* Search Filter Bar */}
          <div className="relative">
            <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar en el historial por visitante, residente, placa o casa..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full bg-slate-900/80 border border-slate-800 text-sm text-slate-100 placeholder-slate-500 rounded-2xl pl-12 pr-4 py-3.5 focus:outline-none focus:border-blue-500 transition-all"
            />
          </div>

          {/* Historical Table */}
          <div className="glass-card rounded-3xl border border-slate-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/90 text-slate-400 font-bold border-b border-slate-800 uppercase tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4">Visitante</th>
                    <th className="py-3.5 px-4">Destino / Residente</th>
                    <th className="py-3.5 px-4">Vehículo</th>
                    <th className="py-3.5 px-4">Entrada</th>
                    <th className="py-3.5 px-4">Salida</th>
                    <th className="py-3.5 px-4">Permanencia</th>
                    <th className="py-3.5 px-4">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {historyVisits.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-500">
                        No se encontraron registros de visitas con los criterios seleccionados.
                      </td>
                    </tr>
                  ) : (
                    historyVisits.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3.5 px-4 font-semibold text-white">
                          <div>{item.visitorName}</div>
                          <div className="text-[11px] text-slate-500 font-normal">
                            {item.documentNumber || item.visitorDni || 'Sin doc'}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-medium text-blue-400">
                            {item.house?.unitNumber || item.resident?.house?.unitNumber || 'Vivienda'}
                          </div>
                          <div className="text-[11px] text-slate-400">{item.resident?.fullName}</div>
                        </td>
                        <td className="py-3.5 px-4 font-mono font-medium text-emerald-400">
                          {item.vehiclePlate || 'A pie'}
                        </td>
                        <td className="py-3.5 px-4 text-slate-400">
                          {item.entryDate
                            ? new Date(item.entryDate).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
                            : 'N/A'}
                        </td>
                        <td className="py-3.5 px-4 text-slate-400">
                          {item.exitDate
                            ? new Date(item.exitDate).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
                            : item.status === 'INGRESADA' ? 'Dentro' : 'N/A'}
                        </td>
                        <td className="py-3.5 px-4 font-medium text-slate-200">
                          {item.durationMinutes ? formatDuration(item.durationMinutes) : (item.status === 'INGRESADA' ? 'En curso' : 'N/A')}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                              item.status === 'INGRESADA'
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                : item.status === 'COMPLETED'
                                ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                : 'bg-slate-800 text-slate-400 border-slate-700'
                            }`}
                          >
                            {item.status === 'INGRESADA'
                              ? 'DENTRO'
                              : item.status === 'COMPLETED'
                              ? 'SALIDA REGISTRADA'
                              : item.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: INGRESO RÁPIDO / GARITA DIRECTA (Deliveries, Taxis, Servicios) */}
      {isQuickEntryOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card p-6 rounded-3xl border border-slate-700 max-w-lg w-full space-y-5 bg-slate-950 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-blue-400" />
                <h3 className="text-base font-bold text-white">Ingreso Directo en Garita</h3>
              </div>
              <button
                onClick={() => setIsQuickEntryOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleQuickEntrySubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-400 block font-medium">Tipo de Entrada:</label>
                  <select
                    value={quickForm.entryType}
                    onChange={(e) => setQuickForm({ ...quickForm, entryType: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-2.5 focus:border-blue-500"
                  >
                    <option value="DELIVERY">Delivery (UberEats, PedidosYa)</option>
                    <option value="VISIT">Visita General (Sin QR)</option>
                    <option value="SERVICE">Servicio / Mantenimiento</option>
                    <option value="TAXI">Taxi / Uber / InDriver</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 block font-medium">Vivienda Destino:</label>
                  <select
                    value={quickForm.houseId}
                    onChange={(e) => setQuickForm({ ...quickForm, houseId: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-2.5 focus:border-blue-500"
                  >
                    <option value="">Seleccionar vivienda...</option>
                    {availableHouses.map((h) => (
                      <option key={h.id} value={h.id}>
                        {h.block ? `${h.block} - ` : ''}Casa {h.unitNumber}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 block font-medium">Nombre de la Persona / Conductor *:</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Repartidor Juan Morales"
                  value={quickForm.visitorName}
                  onChange={(e) => setQuickForm({ ...quickForm, visitorName: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-2.5 focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-400 block font-medium">Placa del Vehículo / Moto:</label>
                  <input
                    type="text"
                    placeholder="Ej. M 189-204"
                    value={quickForm.vehiclePlate}
                    onChange={(e) => setQuickForm({ ...quickForm, vehiclePlate: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-2.5 focus:border-blue-500 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 block font-medium">DUI / Cédula (Opcional):</label>
                  <input
                    type="text"
                    placeholder="Ej. 05819204-8"
                    value={quickForm.visitorDni}
                    onChange={(e) => setQuickForm({ ...quickForm, visitorDni: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-2.5 focus:border-blue-500 font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 block font-medium">Notas / Observaciones:</label>
                <input
                  type="text"
                  placeholder="Ej. Pedido de comida rápida a domicilio"
                  value={quickForm.notes}
                  onChange={(e) => setQuickForm({ ...quickForm, notes: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-2.5 focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsQuickEntryOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={quickSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs shadow-lg shadow-blue-600/30 transition-all flex items-center gap-2"
                >
                  <LogIn className="w-4 h-4" />
                  {quickSubmitting ? 'Registrando...' : 'Confirmar Ingreso Inmediato'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default VisitsLogView;
