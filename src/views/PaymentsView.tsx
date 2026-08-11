import React, { useState } from 'react';
import { CreditCard, DollarSign, CheckCircle, Clock, AlertTriangle, Plus, Search, Building2 } from 'lucide-react';

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

const INITIAL_PAYMENTS: PaymentRecord[] = [
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
    paymentMethod: 'Tarjeta de Crédito (Gateway)',
    transactionId: 'TXN-99820192',
  },
  {
    id: 'pay-103',
    residentName: 'Ana Patricia Gutiérrez',
    unitNumber: 'Apt 301 (Torre A)',
    concept: 'Reserva de Área Social - Terraza',
    amount: 25.0,
    dueDate: '15 Ago 2026',
    status: 'PAID',
    paymentMethod: 'Transferencia Bancaria',
    transactionId: 'TXN-11029482',
  },
];

export const PaymentsView: React.FC = () => {
  const [payments, setPayments] = useState<PaymentRecord[]>(INITIAL_PAYMENTS);
  const [searchTerm, setSearchTerm] = useState('');
  const [showBillingModal, setShowBillingModal] = useState(false);
  const [concept, setConcept] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');

  const handleCreateBilling = (e: React.FormEvent) => {
    e.preventDefault();
    if (!concept || !amount || !dueDate) return;

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
    alert('💵 Cobro global emitido y notificado a la aplicación móvil.');
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
            Gestión de Cobros y Mantenimientos
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Emitir cobros masivos de cuotas de mantenimiento y rastrear pagos realizados desde la aplicación móvil.
          </p>
        </div>

        <button
          onClick={() => setShowBillingModal(true)}
          className="px-5 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-blue-600/30 flex items-center gap-2 transition-all whitespace-nowrap"
        >
          <Plus className="w-5 h-5" /> Emitir Nuevo Cobro
        </button>
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
                <th className="px-6 py-4 text-right">Detalle Transacción</th>
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
                  placeholder="Ej. 30 Sep 2026"
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
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md"
                >
                  Emitir Cobro
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
