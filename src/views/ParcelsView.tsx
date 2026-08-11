import React, { useState } from 'react';
import { Package, Plus, Search, CheckCircle2, Clock, Building2, User } from 'lucide-react';

interface ParcelLog {
  id: string;
  residentName: string;
  unitNumber: string;
  carrier: 'CARGO_EXPRESS' | 'DHL' | 'FEDEX' | 'TRANS_EXPRESS' | 'UPS' | 'OTRO';
  customCarrier?: string;
  trackingNumber?: string;
  status: 'PENDING' | 'PICKED_UP';
  receivedAt: string;
}

const INITIAL_PARCELS: ParcelLog[] = [
  {
    id: 'p-1',
    residentName: 'María Camila Rodríguez',
    unitNumber: 'Apt 502 (Torre B)',
    carrier: 'DHL',
    trackingNumber: 'DHL-99210492',
    status: 'PENDING',
    receivedAt: '10:00 AM',
  },
  {
    id: 'p-2',
    residentName: 'Roberto Silva',
    unitNumber: 'Casa 14 (Manzana A)',
    carrier: 'FEDEX',
    trackingNumber: 'FX-88192039',
    status: 'PENDING',
    receivedAt: '09:15 AM',
  },
  {
    id: 'p-3',
    residentName: 'Ana Patricia Gutiérrez',
    unitNumber: 'Apt 301 (Torre A)',
    carrier: 'CARGO_EXPRESS',
    trackingNumber: 'CX-1049281',
    status: 'PICKED_UP',
    receivedAt: 'Ayer',
  },
];

export const ParcelsView: React.FC = () => {
  const [parcels, setParcels] = useState<ParcelLog[]>(INITIAL_PARCELS);
  const [showAddModal, setShowAddModal] = useState(false);
  const [residentName, setResidentName] = useState('');
  const [unitNumber, setUnitNumber] = useState('');
  const [carrier, setCarrier] = useState<ParcelLog['carrier']>('DHL');
  const [customCarrier, setCustomCarrier] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');

  const handleRegisterParcel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!residentName || !unitNumber) return;

    const newParcel: ParcelLog = {
      id: `p-${Date.now()}`,
      residentName,
      unitNumber,
      carrier,
      customCarrier: carrier === 'OTRO' ? customCarrier : undefined,
      trackingNumber: trackingNumber || undefined,
      status: 'PENDING',
      receivedAt: 'Ahora',
    };

    setParcels([newParcel, ...parcels]);
    setResidentName('');
    setUnitNumber('');
    setTrackingNumber('');
    setCustomCarrier('');
    setShowAddModal(false);
    alert('📦 Paquete registrado. Notificación enviada al celular del residente.');
  };

  const handleMarkPickedUp = (id: string) => {
    setParcels((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: 'PICKED_UP' as const } : p))
    );
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-card p-6 rounded-3xl border border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Package className="w-6 h-6 text-amber-500" />
            Recepción de Paquetes en Garita
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Registra los paquetes entregados por paqueterías (DHL, FedEx, UPS, Cargo Express, Trans Express) para alertar al residente.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-5 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-bold text-sm shadow-lg shadow-amber-500/20 flex items-center gap-2 transition-all whitespace-nowrap"
        >
          <Plus className="w-5 h-5" /> Registración de Paquete
        </button>
      </div>

      {/* Parcels Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {parcels.map((p) => (
          <div key={p.id} className="glass-card p-5 rounded-2xl border border-slate-800 hover:border-slate-700 transition-all space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-500/10 text-amber-400 border border-amber-500/20">
                {p.carrier === 'OTRO' ? p.customCarrier || 'OTRO' : p.carrier}
              </span>
              <span
                className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                  p.status === 'PENDING' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-400'
                }`}
              >
                {p.status === 'PENDING' ? 'En Garita (Pendiente)' : 'Retirado por Residente'}
              </span>
            </div>

            <div className="space-y-1">
              <p className="text-xs text-slate-400">Residente:</p>
              <h3 className="font-bold text-white text-base">{p.residentName}</h3>
              <p className="text-xs text-blue-400 font-semibold">{p.unitNumber}</p>
            </div>

            {p.trackingNumber && (
              <p className="text-xs text-slate-400 font-mono bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                Guía: <span className="text-slate-200">{p.trackingNumber}</span>
              </p>
            )}

            {p.status === 'PENDING' && (
              <button
                onClick={() => handleMarkPickedUp(p.id)}
                className="w-full py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 font-semibold text-xs border border-emerald-500/30 flex items-center justify-center gap-2 transition-all"
              >
                <CheckCircle2 className="w-4 h-4" /> Marcar como Retirado
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Modal for Parcel Registration */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card max-w-md w-full p-6 rounded-3xl border border-slate-700 space-y-5">
            <h3 className="text-lg font-bold text-white">Registrar Ingreso de Paquete</h3>

            <form onSubmit={handleRegisterParcel} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Empresa de Mensajería / Carrier
                </label>
                <select
                  value={carrier}
                  onChange={(e) => setCarrier(e.target.value as any)}
                  className="w-full bg-slate-900 border border-slate-700 text-sm text-slate-100 rounded-xl px-4 py-2.5 focus:outline-none focus:border-amber-500"
                >
                  <option value="DHL">DHL</option>
                  <option value="FEDEX">FedEx</option>
                  <option value="UPS">UPS</option>
                  <option value="CARGO_EXPRESS">Cargo Express</option>
                  <option value="TRANS_EXPRESS">Trans Express</option>
                  <option value="OTRO">Otro (Personalizado)</option>
                </select>
              </div>

              {carrier === 'OTRO' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Nombre del Transportista
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Delivery local / Encomienda"
                    value={customCarrier}
                    onChange={(e) => setCustomCarrier(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 text-sm text-slate-100 rounded-xl px-4 py-2.5 focus:outline-none focus:border-amber-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Nombre del Residente Destinatario *
                </label>
                <input
                  type="text"
                  placeholder="Ej. María Camila Rodríguez"
                  value={residentName}
                  onChange={(e) => setResidentName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-sm text-slate-100 rounded-xl px-4 py-2.5 focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Apartamento / Unidad *
                </label>
                <input
                  type="text"
                  placeholder="Ej. Apt 502"
                  value={unitNumber}
                  onChange={(e) => setUnitNumber(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-sm text-slate-100 rounded-xl px-4 py-2.5 focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Código de Rastreo / Número de Guía
                </label>
                <input
                  type="text"
                  placeholder="Ej. 1Z99999999999999"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-sm text-slate-100 rounded-xl px-4 py-2.5 focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md"
                >
                  Registrar Paquete
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ParcelsView;
