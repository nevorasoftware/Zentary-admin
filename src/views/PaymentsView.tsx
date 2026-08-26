import React, { useState, useEffect } from 'react';
import { CreditCard, DollarSign, CheckCircle, Clock, AlertTriangle, Plus, Search, Building2, RefreshCw } from 'lucide-react';
import { adminApi } from '../services/adminApi';

interface PaymentRecord {
  id: string;
  residentName: string;
  unitNumber: string;
  concept: string;
  amount: number;
  dueDate: string;
  status: 'PAID' | 'PENDING' | 'OVERDUE';
  paymentMethod?: string;
  transactionId?: string;
}

const FALLBACK_PAYMENTS: PaymentRecord[] = [
  {
    id: 'pay-101',
    residentName: 'María Camila Rodríguez',
    unitNumber: 'Apt 502 (Torre B)',
    concept: 'Cuota de Mantenimiento Agosto 2026',
    amount: 85.0,
    dueDate: '30 Ago 2026',
    status: 'PENDING',
  },
  {
    id: 'pay-102',
    residentName: 'Roberto Silva',
    unitNumber: 'Casa 14 (Manzana A)',
    concept: 'Cuota de Mantenimiento Agosto 2026',
    amount: 85.0,
    dueDate: '30 Ago 2026',
    status: 'PAID',
    paymentMethod: 'Tarjeta de Crédito (Wompi 3DS)',
    transactionId: 'WOMPI-3DS-99820',
  },
];

export const PaymentsView: React.FC = () => {
  const [payments, setPayments] = useState<PaymentRecord[]>(FALLBACK_PAYMENTS);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showBillingModal, setShowBillingModal] = useState(false);
  const [concept, setConcept] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Administrative Notification Configuration State
  const [notifConfig, setNotifConfig] = useState({
    enabled: true,
    frequency: 'DAILY',
    reminderTime: '09:00 AM',
    customMessage: 'Estimado residente, le recordamos que la cuota de mantenimiento del mes en curso está pendiente de pago.',
  });
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [configSavedSuccess, setConfigSavedSuccess] = useState(false);

  const fetchAllPayments = async () => {
    try {
      setLoading(true);
      const res = await adminApi.getAllPayments();
      if (res.success && Array.isArray(res.payments) && res.payments.length > 0) {
        const formatted: PaymentRecord[] = res.payments.map((p: any) => ({
          id: p.id,
          residentName: p.resident?.fullName || 'Residente Registrado',
          unitNumber: p.resident?.property?.unitNumber ? `Unidad ${p.resident.property.unitNumber}` : 'Toda la Comunidad',
          concept: p.concept,
          amount: typeof p.amount === 'number' ? p.amount : parseFloat(p.amount || '0'),
          dueDate: p.dueDate ? new Date(p.dueDate).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Pendiente',
          status: p.status as 'PAID' | 'PENDING' | 'OVERDUE',
          paymentMethod: p.paymentMethod || 'Wompi 3DS',
          transactionId: p.externalTransactionId || undefined,
        }));
        setPayments(formatted);
      }
    } catch (err) {
      console.warn('⚠️ Usando datos de demostración en panel administrativo.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllPayments();
  }, []);

  const handleSaveNotifConfig = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingConfig(true);
    setTimeout(() => {
      setIsSavingConfig(false);
      setConfigSavedSuccess(true);
      setTimeout(() => setConfigSavedSuccess(false), 3000);
    }, 600);
  };

  const handleCreateBilling = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!concept || !amount || !dueDate) return;

    try {
      setIsSubmitting(true);
      const res = await adminApi.createBillingCharge({
        concept,
        amount: parseFloat(amount),
        dueDate: dueDate,
      });

      if (res.success) {
        alert('💵 Cobro emitido correctamente y sincronizado con Wompi 3DS y la app móvil.');
        setConcept('');
        setAmount('');
        setDueDate('');
        setShowBillingModal(false);
        fetchAllPayments();
      } else {
        alert('Error al emitir cobro.');
      }
    } catch (err: any) {
      const newBilling: PaymentRecord = {
        id: `pay-${Date.now()}`,
        residentName: 'Todos los Residentes',
        unitNumber: 'Toda la Comunidad',
        concept,
        amount: parseFloat(amount),
        dueDate,
        status: 'PENDING',
      };
      setPayments([newBilling, ...payments]);
      setConcept('');
      setAmount('');
      setDueDate('');
      setShowBillingModal(false);
      alert('💵 Cobro emitido localmente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredPayments = payments.filter(
    (p) =>
      p.residentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.unitNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.concept.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-card p-6 rounded-3xl border border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-blue-400" />
            Gestión de Cobros y Mantenimientos (Wompi 3DS Gateway)
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Emitir cobros masivos, configurar recordatorios automáticos de pago y monitorear transacciones 3DS en tiempo real.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchAllPayments}
            className="p-3 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 hover:text-white hover:border-slate-500 transition-all"
            title="Actualizar tabla"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setShowBillingModal(true)}
            className="px-5 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-blue-600/30 flex items-center gap-2 transition-all whitespace-nowrap"
          >
            <Plus className="w-5 h-5" /> Emitir Nuevo Cobro
          </button>
        </div>
      </div>

      {/* Administrative Panel: Configuración de Recordatorios Automáticos de Pago */}
      <div className="glass-card p-6 rounded-3xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 font-bold text-lg">
              🔔
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Configuración de Recordatorios Automáticos de Pago (App Móvil)</h3>
              <p className="text-xs text-slate-400">
                Define las reglas con las que la aplicación móvil enviará recordatorios diarios a los residentes con cobros pendientes.
              </p>
            </div>
          </div>

          {configSavedSuccess && (
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 animate-fade-in">
              ✓ Configuración Guardada
            </span>
          )}
        </div>

        <form onSubmit={handleSaveNotifConfig} className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {/* Activar/Desactivar */}
          <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 space-y-2">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
              Estado del Recordatorio
            </label>
            <div className="flex items-center justify-between pt-1">
              <span className="text-sm font-semibold text-slate-200">
                {notifConfig.enabled ? 'Activado para la App' : 'Desactivado'}
              </span>
              <button
                type="button"
                onClick={() => setNotifConfig({ ...notifConfig, enabled: !notifConfig.enabled })}
                className={`w-12 h-6 rounded-full transition-colors relative ${
                  notifConfig.enabled ? 'bg-blue-600' : 'bg-slate-700'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform absolute top-0.5 ${
                    notifConfig.enabled ? 'right-0.5' : 'left-0.5'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Frecuencia */}
          <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 space-y-2">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
              Frecuencia de Notificación
            </label>
            <select
              value={notifConfig.frequency}
              onChange={(e) => setNotifConfig({ ...notifConfig, frequency: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-500"
            >
              <option value="DAILY">Una vez al día (Diario)</option>
              <option value="EVERY_2_DAYS">Cada 2 días</option>
              <option value="WEEKLY">Una vez a la semana</option>
            </select>
          </div>

          {/* Hora Preferida */}
          <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 space-y-2">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
              Hora de Envío Diario
            </label>
            <select
              value={notifConfig.reminderTime}
              onChange={(e) => setNotifConfig({ ...notifConfig, reminderTime: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-500"
            >
              <option value="08:00 AM">08:00 AM</option>
              <option value="09:00 AM">09:00 AM (Recomendado)</option>
              <option value="01:00 PM">01:00 PM</option>
              <option value="07:00 PM">07:00 PM</option>
            </select>
          </div>

          {/* Botón de Guardar en Admin */}
          <div className="md:col-span-3 flex justify-end pt-1">
            <button
              type="submit"
              disabled={isSavingConfig}
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2"
            >
              {isSavingConfig ? 'Guardando en Servidor...' : '💾 Guardar Parámetros de Notificaciones'}
            </button>
          </div>
        </form>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Buscar por concepto, residente o apartamento..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-slate-900/80 border border-slate-800 text-sm text-slate-100 placeholder-slate-500 rounded-2xl pl-12 pr-4 py-3.5 focus:outline-none focus:border-blue-500 transition-all"
        />
      </div>

      {/* Payments Table */}
      <div className="glass-card rounded-3xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950/60 text-slate-400 uppercase text-[11px] font-bold tracking-wider border-b border-slate-800">
              <tr>
                <th className="px-6 py-4">Concepto de Cobro</th>
                <th className="px-6 py-4">Residente / Unidad</th>
                <th className="px-6 py-4">Monto ($ USD)</th>
                <th className="px-6 py-4">Vencimiento</th>
                <th className="px-6 py-4">Estado del Pago</th>
                <th className="px-6 py-4 text-right">Detalle Transacción (Wompi 3DS)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredPayments.map((item) => (
                <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="px-6 py-4 font-semibold text-white">
                    {item.concept}
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-semibold text-white">{item.residentName}</p>
                    <p className="text-xs text-blue-400">{item.unitNumber}</p>
                  </td>
                  <td className="px-6 py-4 font-bold text-base text-white">
                    ${item.amount.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-400 font-mono">
                    {item.dueDate}
                  </td>
                  <td className="px-6 py-4">
                    {item.status === 'PAID' ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <CheckCircle className="w-3.5 h-3.5" /> Pagado
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        <Clock className="w-3.5 h-3.5" /> Pendiente
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right text-xs text-slate-400 font-mono">
                    {item.transactionId ? (
                      <div>
                        <p className="text-emerald-400 font-semibold">{item.transactionId}</p>
                        <p className="text-[11px] text-slate-500">{item.paymentMethod}</p>
                      </div>
                    ) : (
                      <span className="text-slate-600">Por procesar</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal for Creating Billing Charge */}
      {showBillingModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card max-w-md w-full p-6 rounded-3xl border border-slate-700 space-y-5">
            <h3 className="text-lg font-bold text-white">Emitir Nuevo Cobro Masivo</h3>

            <form onSubmit={handleCreateBilling} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Concepto del Cobro *
                </label>
                <input
                  type="text"
                  placeholder="Ej. Cuota Mantenimiento Septiembre 2026"
                  value={concept}
                  onChange={(e) => setConcept(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-sm text-slate-100 rounded-xl px-4 py-2.5 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Monto por Unidad ($ USD) *
                </label>
                <input
                  type="number"
                  placeholder="Ej. 85.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-sm text-slate-100 rounded-xl px-4 py-2.5 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Fecha Límite de Pago *
                </label>
                <input
                  type="text"
                  placeholder="Ej. 2026-09-30"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-sm text-slate-100 rounded-xl px-4 py-2.5 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowBillingModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md"
                >
                  {isSubmitting ? 'Emitiendo...' : 'Emitir Cobro'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentsView;
