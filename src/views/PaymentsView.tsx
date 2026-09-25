import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  DollarSign,
  CheckCircle,
  Clock,
  AlertTriangle,
  Plus,
  Search,
  Building2,
  RefreshCw,
  Users,
  Flame,
  FileCheck,
  TrendingUp,
  ExternalLink,
  Percent,
} from 'lucide-react';
import { adminApi, ResidentUser, FinancialSummary } from '../services/adminApi';

interface PaymentRecord {
  id: string;
  residentId?: string;
  residentName: string;
  unitNumber: string;
  concept: string;
  amount: number;
  lateFee?: number;
  dueDate: string;
  status: 'PAID' | 'PENDING' | 'OVERDUE' | 'PARTIAL' | 'CANCELLED';
  paymentMethod?: string;
  transactionId?: string;
  receiptUrl?: string;
  notes?: string;
  confirmedAt?: string;
}

export const PaymentsView: React.FC = () => {
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [financialSummary, setFinancialSummary] = useState<FinancialSummary | null>(null);
  const [residents, setResidents] = useState<ResidentUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<'ALL' | 'PENDING' | 'OVERDUE' | 'PAID'>('ALL');

  // Modal State: Emitir Cobro Masivo / Individual
  const [showBillingModal, setShowBillingModal] = useState(false);
  const [concept, setConcept] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [targetResidentId, setTargetResidentId] = useState('ALL');
  const [graceDays, setGraceDays] = useState('3');
  const [billingNotes, setBillingNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal State: Registrar Pago Manual
  const [showManualPayModal, setShowManualPayModal] = useState(false);
  const [selectedPaymentForPay, setSelectedPaymentForPay] = useState<PaymentRecord | null>(null);
  const [manualResidentId, setManualResidentId] = useState('');
  const [manualAmount, setManualAmount] = useState('');
  const [manualMethod, setManualMethod] = useState('TRANSFER');
  const [manualReceiptUrl, setManualReceiptUrl] = useState('');
  const [manualNotes, setManualNotes] = useState('');
  const [manualConcept, setManualConcept] = useState('Abono Cuota de Mantenimiento');
  const [isManualSubmitting, setIsManualSubmitting] = useState(false);

  // Mora Automática State
  const [isApplyingLateFees, setIsApplyingLateFees] = useState(false);
  const [lateFeeFeedback, setLateFeeFeedback] = useState<string | null>(null);

  // Notification Config State
  const [notifConfig, setNotifConfig] = useState({
    enabled: true,
    frequency: 'DAILY',
    reminderTime: '09:00 AM',
    customMessage: 'Estimado residente, le recordamos que su cuota de mantenimiento está próxima a vencer.',
  });
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [configSavedSuccess, setConfigSavedSuccess] = useState(false);

  const fetchAllPayments = async () => {
    try {
      setLoading(true);
      const res = await adminApi.getAllPayments();
      if (res.success && Array.isArray(res.payments)) {
        const formatted: PaymentRecord[] = res.payments.map((p: any) => ({
          id: p.id,
          residentId: p.residentId,
          residentName: p.resident?.fullName || 'Residente',
          unitNumber: p.house?.unitNumber
            ? `${p.house.unitNumber}${p.house.block ? ` (${p.house.block})` : ''}`
            : p.property?.unitNumber
            ? `Unidad ${p.property.unitNumber}`
            : 'Comunidad',
          concept: p.concept,
          amount: typeof p.amount === 'number' ? p.amount : parseFloat(p.amount || '0'),
          lateFee: typeof p.lateFee === 'number' ? p.lateFee : parseFloat(p.lateFee || '0'),
          dueDate: p.dueDate
            ? new Date(p.dueDate).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
            : 'Pendiente',
          status: p.status,
          paymentMethod: p.paymentMethod || undefined,
          transactionId: p.externalTransactionId || undefined,
          receiptUrl: p.receiptUrl || undefined,
          notes: p.notes || undefined,
          confirmedAt: p.confirmedAt ? new Date(p.confirmedAt).toLocaleDateString() : undefined,
        }));
        setPayments(formatted);
      }
    } catch (err) {
      console.warn('⚠️ Error al cargar pagos desde backend.');
    } finally {
      setLoading(false);
    }
  };

  const fetchFinancialSummary = async () => {
    try {
      const res = await adminApi.getFinancialSummary();
      if (res.success && res.summary) {
        setFinancialSummary(res.summary);
      }
    } catch (err) {
      console.warn('⚠️ No se pudo obtener resumen financiero.');
    }
  };

  const fetchResidents = async () => {
    try {
      const res = await adminApi.getUsers('RESIDENT');
      if (res.success && Array.isArray(res.users)) {
        setResidents(res.users);
      }
    } catch (err) {
      console.warn('⚠️ Error al cargar residentes.');
    }
  };

  useEffect(() => {
    fetchAllPayments();
    fetchFinancialSummary();
    fetchResidents();
  }, []);

  const handleCreateBilling = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!concept || !amount || !dueDate) return;

    try {
      setIsSubmitting(true);
      const res = await adminApi.createBillingCharge({
        concept,
        amount: parseFloat(amount),
        dueDate,
        targetResidentId: targetResidentId === 'ALL' ? undefined : targetResidentId,
        graceDays: parseInt(graceDays, 10) || 3,
        notes: billingNotes,
      });

      if (res.success) {
        alert((res as any).message || '💵 Cobro emitido correctamente en la base de datos.');
        setConcept('');
        setAmount('');
        setDueDate('');
        setBillingNotes('');
        setTargetResidentId('ALL');
        setShowBillingModal(false);
        fetchAllPayments();
        fetchFinancialSummary();
      } else {
        alert('Error al emitir cobro.');
      }
    } catch (err: any) {
      alert('Error al emitir cobro: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApplyLateFees = async () => {
    if (!confirm('¿Deseas ejecutar el motor de Mora Automática? Se evaluarán todos los cobros vencidos y se aplicará un 5% de recargo.')) {
      return;
    }

    try {
      setIsApplyingLateFees(true);
      const res = await adminApi.applyLateFees({ lateFeePercent: 5.0, defaultGraceDays: 3 });
      if (res.success) {
        setLateFeeFeedback(`✓ Se aplicó recargo de mora a ${res.processedCount} cobros ($${res.totalLateFeesApplied} USD en recargos).`);
        setTimeout(() => setLateFeeFeedback(null), 5000);
        fetchAllPayments();
        fetchFinancialSummary();
      } else {
        alert('No se pudo aplicar la mora automática.');
      }
    } catch (err: any) {
      alert('Error en motor de mora: ' + err.message);
    } finally {
      setIsApplyingLateFees(false);
    }
  };

  const openManualPaymentForRecord = (record: PaymentRecord) => {
    setSelectedPaymentForPay(record);
    setManualResidentId(record.residentId || '');
    setManualAmount(record.amount.toString());
    setManualConcept(record.concept);
    setShowManualPayModal(true);
  };

  const handleRegisterManualPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualAmount) return;

    try {
      setIsManualSubmitting(true);
      const res = await adminApi.registerManualPayment({
        paymentId: selectedPaymentForPay?.id || undefined,
        residentId: manualResidentId || undefined,
        amount: parseFloat(manualAmount),
        paymentMethod: manualMethod,
        receiptUrl: manualReceiptUrl || undefined,
        notes: manualNotes || undefined,
        concept: manualConcept,
      });

      if (res.success) {
        alert('✅ Pago registrado y confirmado exitosamente en la base de datos.');
        setShowManualPayModal(false);
        setSelectedPaymentForPay(null);
        setManualAmount('');
        setManualReceiptUrl('');
        setManualNotes('');
        fetchAllPayments();
        fetchFinancialSummary();
      } else {
        alert('Error al registrar pago manual.');
      }
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setIsManualSubmitting(false);
    }
  };

  const filteredPayments = payments.filter((p) => {
    const matchesSearch =
      p.residentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.unitNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.concept.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      selectedStatusFilter === 'ALL'
        ? true
        : selectedStatusFilter === 'PENDING'
        ? p.status === 'PENDING' || p.status === 'PARTIAL'
        : p.status === selectedStatusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-card p-6 rounded-3xl border border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-blue-400" />
            Finanzas y Cuotas de Mantenimiento (Zentary 2.0 - Fase 4)
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Gestión de cuentas corrientes por vivienda, motor de mora automática, registro de pagos con comprobante y pasarela Wompi 3DS.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => {
              fetchAllPayments();
              fetchFinancialSummary();
            }}
            className="p-3 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 hover:text-white hover:border-slate-500 transition-all"
            title="Actualizar datos"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={handleApplyLateFees}
            disabled={isApplyingLateFees}
            className="px-4 py-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 font-bold text-sm flex items-center gap-2 transition-all whitespace-nowrap"
            title="Evaluar cobros vencidos y aplicar 5% de mora"
          >
            <Flame className={`w-4 h-4 ${isApplyingLateFees ? 'animate-spin' : ''}`} />
            {isApplyingLateFees ? 'Calculando...' : 'Aplicar Mora Automática (5%)'}
          </button>

          <button
            onClick={() => {
              setSelectedPaymentForPay(null);
              setManualResidentId('');
              setManualAmount('');
              setManualConcept('Abono Cuota de Mantenimiento');
              setShowManualPayModal(true);
            }}
            className="px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-600/30 flex items-center gap-2 transition-all whitespace-nowrap"
          >
            <FileCheck className="w-4 h-4" /> Registrar Pago Manual
          </button>

          <button
            onClick={() => setShowBillingModal(true)}
            className="px-5 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-blue-600/30 flex items-center gap-2 transition-all whitespace-nowrap"
          >
            <Plus className="w-4 h-4" /> Emitir Cuota
          </button>
        </div>
      </div>

      {/* Late fee feedback banner */}
      {lateFeeFeedback && (
        <div className="p-4 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-sm font-semibold flex items-center gap-3 animate-fade-in">
          <Flame className="w-5 h-5 text-amber-400 shrink-0" />
          <span>{lateFeeFeedback}</span>
        </div>
      )}

      {/* KPI Financial Summary Cards (Fase 4 Dashboard) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Recaudado */}
        <div className="glass-card p-5 rounded-3xl border border-slate-800 bg-slate-900/60 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Recaudado</span>
            <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <CheckCircle className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-white">
            ${financialSummary?.totalCollected.toFixed(2) ?? '0.00'}
          </div>
          <div className="text-xs text-emerald-400 font-semibold mt-1">
            {financialSummary?.paidCount ?? 0} pagos confirmados
          </div>
        </div>

        {/* Pendiente */}
        <div className="glass-card p-5 rounded-3xl border border-slate-800 bg-slate-900/60 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Por Cobrar</span>
            <span className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-white">
            ${financialSummary?.totalPending.toFixed(2) ?? '0.00'}
          </div>
          <div className="text-xs text-blue-400 font-semibold mt-1">
            {financialSummary?.pendingCount ?? 0} cobros al día
          </div>
        </div>

        {/* En Mora */}
        <div className="glass-card p-5 rounded-3xl border border-slate-800 bg-slate-900/60 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">En Mora</span>
            <span className="p-2 rounded-xl bg-rose-500/10 text-rose-400">
              <AlertTriangle className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-rose-400">
            ${financialSummary?.totalOverdue.toFixed(2) ?? '0.00'}
          </div>
          <div className="text-xs text-rose-400 font-semibold mt-1">
            {financialSummary?.overdueCount ?? 0} cobros vencidos
          </div>
        </div>

        {/* Tasa de Recaudación */}
        <div className="glass-card p-5 rounded-3xl border border-slate-800 bg-slate-900/60 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Tasa Recaudación</span>
            <span className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
              <Percent className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-purple-300">
            {financialSummary?.collectionRate ?? 0}%
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-purple-500 h-full rounded-full transition-all"
              style={{ width: `${Math.min(financialSummary?.collectionRate || 0, 100)}%` }}
            />
          </div>
        </div>

        {/* Casas Morosas */}
        <div className="glass-card p-5 rounded-3xl border border-slate-800 bg-slate-900/60 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Casas en Mora</span>
            <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <Building2 className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-amber-400">
            {financialSummary?.morososHousesCount ?? 0}
          </div>
          <div className="text-xs text-slate-400 font-semibold mt-1">
            Viviendas con estado MOROSO
          </div>
        </div>
      </div>

      {/* Filter Tabs and Search Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Status Tabs */}
        <div className="flex items-center p-1.5 rounded-2xl bg-slate-900 border border-slate-800 gap-1 w-full md:w-auto">
          {[
            { id: 'ALL', label: 'Todos' },
            { id: 'PENDING', label: 'Pendientes' },
            { id: 'OVERDUE', label: 'En Mora' },
            { id: 'PAID', label: 'Pagados' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedStatusFilter(tab.id as any)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                selectedStatusFilter === tab.id
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            placeholder="Buscar por residente, casa o concepto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Payments Table */}
      <div className="glass-card rounded-3xl border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950/80 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="px-6 py-4">Vivienda / Residente</th>
                <th className="px-6 py-4">Concepto</th>
                <th className="px-6 py-4">Monto / Mora</th>
                <th className="px-6 py-4">Vencimiento</th>
                <th className="px-6 py-4">Estado</th>
                <th className="px-6 py-4">Método / Comprobante</th>
                <th className="px-6 py-4 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                    No se encontraron cobros registrados con los criterios seleccionados.
                  </td>
                </tr>
              ) : (
                filteredPayments.map((p) => {
                  const isPaid = p.status === 'PAID';
                  const isOverdue = p.status === 'OVERDUE';
                  return (
                    <tr key={p.id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-white">{p.unitNumber}</div>
                        <div className="text-xs text-slate-400">{p.residentName}</div>
                      </td>
                      <td className="px-6 py-4 text-slate-200">
                        {p.concept}
                        {p.notes && <div className="text-xs text-slate-400 italic mt-0.5">{p.notes}</div>}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-white">${p.amount.toFixed(2)}</div>
                        {p.lateFee && p.lateFee > 0 ? (
                          <div className="text-xs text-rose-400 font-semibold flex items-center gap-1">
                            <Flame className="w-3 h-3" /> Mora: +${p.lateFee.toFixed(2)}
                          </div>
                        ) : null}
                      </td>
                      <td className="px-6 py-4 text-slate-400 text-xs">{p.dueDate}</td>
                      <td className="px-6 py-4">
                        {isPaid ? (
                          <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 inline-flex items-center gap-1">
                            <CheckCircle className="w-3.5 h-3.5" /> Pagado
                          </span>
                        ) : isOverdue ? (
                          <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30 inline-flex items-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5" /> En Mora
                          </span>
                        ) : (
                          <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/30 inline-flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" /> Pendiente
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-xs">
                        {p.paymentMethod ? (
                          <div className="text-slate-300 font-semibold">{p.paymentMethod}</div>
                        ) : (
                          <span className="text-slate-500">—</span>
                        )}
                        {p.receiptUrl && (
                          <a
                            href={p.receiptUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-blue-400 hover:text-blue-300 inline-flex items-center gap-1 font-bold mt-0.5"
                          >
                            <ExternalLink className="w-3 h-3" /> Ver Comprobante
                          </a>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {!isPaid ? (
                          <button
                            onClick={() => openManualPaymentForRecord(p)}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-300 font-bold text-xs transition-all"
                          >
                            Registrar Pago
                          </button>
                        ) : (
                          <span className="text-xs text-slate-500">Confirmado</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Emitir Cobro Masivo / Individual */}
      {showBillingModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-scale-in">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-blue-500" />
                Emitir Nuevo Cobro o Cuota
              </h3>
              <button onClick={() => setShowBillingModal(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateBilling} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1.5">
                  Destinatario
                </label>
                <select
                  value={targetResidentId}
                  onChange={(e) => setTargetResidentId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-blue-500"
                >
                  <option value="ALL">📢 Cobro Masivo (Emitir a TODAS las Viviendas)</option>
                  {residents.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.fullName} - {r.house?.unitNumber ? `Casa ${r.house.unitNumber}` : r.property?.unitNumber ? `Unidad ${r.property.unitNumber}` : r.email}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1.5">
                  Concepto del Cobro
                </label>
                <input
                  type="text"
                  placeholder="Ej: Cuota Mantenimiento Septiembre 2026"
                  value={concept}
                  onChange={(e) => setConcept(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1.5">
                    Monto (USD)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-slate-500 font-bold">$</span>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="85.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      required
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-8 pr-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1.5">
                    Días de Gracia
                  </label>
                  <input
                    type="number"
                    value={graceDays}
                    onChange={(e) => setGraceDays(e.target.value)}
                    placeholder="3"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1.5">
                  Fecha Límite de Pago
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1.5">
                  Notas Adicionales (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="Incluye servicio de jardinería y vigilancia"
                  value={billingNotes}
                  onChange={(e) => setBillingNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowBillingModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:text-white text-sm font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold shadow-lg shadow-blue-600/30 flex items-center gap-2"
                >
                  {isSubmitting ? 'Emitiendo...' : 'Confirmar Emisión'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Registrar Pago Manual con Comprobante */}
      {showManualPayModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-scale-in">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-emerald-400" />
                Registrar y Confirmar Pago
              </h3>
              <button onClick={() => setShowManualPayModal(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <form onSubmit={handleRegisterManualPayment} className="space-y-4">
              {selectedPaymentForPay ? (
                <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-300 space-y-1">
                  <div>
                    <span className="text-slate-500">Cobro:</span> <strong className="text-white">{selectedPaymentForPay.concept}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Vivienda:</span> {selectedPaymentForPay.unitNumber} ({selectedPaymentForPay.residentName})
                  </div>
                </div>
              ) : (
                <div>
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1.5">
                    Residente / Vivienda
                  </label>
                  <select
                    value={manualResidentId}
                    onChange={(e) => setManualResidentId(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-blue-500"
                  >
                    <option value="">Seleccionar residente...</option>
                    {residents.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.fullName} - {r.house?.unitNumber ? `Casa ${r.house.unitNumber}` : r.email}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1.5">
                    Monto Recibido ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="85.00"
                    value={manualAmount}
                    onChange={(e) => setManualAmount(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1.5">
                    Método de Pago
                  </label>
                  <select
                    value={manualMethod}
                    onChange={(e) => setManualMethod(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-blue-500"
                  >
                    <option value="TRANSFER">Transferencia Bancaria</option>
                    <option value="CASH">Efectivo en Garita/Admin</option>
                    <option value="CARD">Tarjeta de Débito/Crédito</option>
                    <option value="WOMPI">Wompi Gateway</option>
                    <option value="OTHER">Otro</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1.5">
                  URL Comprobante / Referencia Bancaria
                </label>
                <input
                  type="text"
                  placeholder="https://... o Código #REF-998231"
                  value={manualReceiptUrl}
                  onChange={(e) => setManualReceiptUrl(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-1.5">
                  Notas de Confirmación
                </label>
                <input
                  type="text"
                  placeholder="Verificado con estado de cuenta de Banco Agrícola"
                  value={manualNotes}
                  onChange={(e) => setManualNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowManualPayModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:text-white text-sm font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isManualSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold shadow-lg shadow-emerald-600/30 flex items-center gap-2"
                >
                  {isManualSubmitting ? 'Guardando...' : 'Confirmar y Liquidar'}
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
