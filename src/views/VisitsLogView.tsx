import React, { useState } from 'react';
import { ShieldCheck, QrCode, Search, CheckCircle2, Clock, Car, User, Check, X } from 'lucide-react';

interface VisitLog {
  id: string;
  visitorName: string;
  visitorDni?: string;
  vehiclePlate?: string;
  residentName: string;
  unitNumber: string;
  category: 'EN_CURSO' | 'HISTORIAL' | 'FRECUENTE';
  status: 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  qrCode: string;
  entryDate: string;
}

const INITIAL_VISITS: VisitLog[] = [
  {
    id: 'v-101',
    visitorName: 'Carlos Eduardo Mendoza',
    visitorDni: '04819204-1',
    vehiclePlate: 'P 452-910',
    residentName: 'María Camila Rodríguez',
    unitNumber: 'Apt 502 (Torre B)',
    category: 'EN_CURSO',
    status: 'IN_PROGRESS',
    qrCode: 'ZENTARY-QR-990182',
    entryDate: '10:42 AM',
  },
  {
    id: 'v-102',
    visitorName: 'Repartidor Uber Eats',
    visitorDni: 'N/A',
    vehiclePlate: 'M 182-300',
    residentName: 'Roberto Silva',
    unitNumber: 'Casa 14 (Manzana A)',
    category: 'EN_CURSO',
    status: 'IN_PROGRESS',
    qrCode: 'ZENTARY-QR-772104',
    entryDate: '10:15 AM',
  },
  {
    id: 'v-103',
    visitorName: 'Técnico de Mantenimiento HVAC',
    visitorDni: '01928374-5',
    vehiclePlate: 'P 992-104',
    residentName: 'Ana Patricia Gutiérrez',
    unitNumber: 'Apt 301 (Torre A)',
    category: 'FRECUENTE',
    status: 'COMPLETED',
    qrCode: 'ZENTARY-QR-110482',
    entryDate: '09:00 AM',
  },
];

export const VisitsLogView: React.FC = () => {
  const [visits, setVisits] = useState<VisitLog[]>(INITIAL_VISITS);
  const [qrQuery, setQrQuery] = useState('');
  const [searchFilter, setSearchFilter] = useState('');

  const handleValidateEntry = (id: string) => {
    setVisits((prev) =>
      prev.map((v) => (v.id === id ? { ...v, status: 'COMPLETED' as const } : v))
    );
  };

  const handleSimulateScan = () => {
    if (!qrQuery) return;
    const found = visits.find((v) => v.qrCode.toLowerCase().includes(qrQuery.toLowerCase()) || v.visitorName.toLowerCase().includes(qrQuery.toLowerCase()));
    if (found) {
      alert(`✅ Pase QR Válido: ${found.visitorName} -> Visita a ${found.residentName} (${found.unitNumber})`);
    } else {
      alert('⚠️ Código QR no encontrado o inválido.');
    }
  };

  const filteredVisits = visits.filter(
    (v) =>
      v.visitorName.toLowerCase().includes(searchFilter.toLowerCase()) ||
      v.residentName.toLowerCase().includes(searchFilter.toLowerCase()) ||
      v.unitNumber.toLowerCase().includes(searchFilter.toLowerCase()) ||
      v.vehiclePlate?.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Scanner & Manual Validation Box */}
      <div className="glass-card p-6 rounded-3xl border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <QrCode className="w-6 h-6 text-emerald-400" />
            Validación de Pases QR y Control de Garita
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Escanea el código QR presentado por el visitante en la app móvil o valida por placa y documento de identidad.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <input
            type="text"
            placeholder="Ingrese o escanee código QR..."
            value={qrQuery}
            onChange={(e) => setQrQuery(e.target.value)}
            className="bg-slate-900/90 border border-slate-700 text-sm text-slate-100 placeholder-slate-500 rounded-xl px-4 py-2.5 focus:outline-none focus:border-emerald-500 transition-all font-mono"
          />
          <button
            onClick={handleSimulateScan}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-600/30 whitespace-nowrap transition-all"
          >
            Verificar Pase
          </button>
        </div>
      </div>

      {/* Filter search bar */}
      <div className="relative">
        <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Filtrar por visitante, residente, placa de vehículo o unidad..."
          value={searchFilter}
          onChange={(e) => setSearchFilter(e.target.value)}
          className="w-full bg-slate-900/80 border border-slate-800 text-sm text-slate-100 placeholder-slate-500 rounded-2xl pl-12 pr-4 py-3.5 focus:outline-none focus:border-blue-500 transition-all"
        />
      </div>

      {/* Access Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredVisits.map((item) => (
          <div key={item.id} className="glass-card p-5 rounded-2xl border border-slate-800 hover:border-slate-700 transition-all space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
              <span
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                  item.status === 'IN_PROGRESS'
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
              >
                {item.status === 'IN_PROGRESS' ? 'En Curso (Dentro)' : 'Salida Registrada'}
              </span>
              <span className="text-[11px] font-mono text-slate-500">{item.entryDate}</span>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-blue-400" />
                <h3 className="font-bold text-white text-base">{item.visitorName}</h3>
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-2">
                <span>DNI: {item.visitorDni || 'No proporcionado'}</span>
              </p>
              <p className="text-xs text-slate-300 flex items-center gap-2">
                <Car className="w-4 h-4 text-emerald-400" />
                <span>Placa: <strong className="text-white">{item.vehiclePlate || 'A pie'}</strong></span>
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs space-y-1">
              <p className="text-slate-400">Residente Autorizante:</p>
              <p className="font-semibold text-white">{item.residentName}</p>
              <p className="text-blue-400 font-medium">{item.unitNumber}</p>
            </div>

            {item.status === 'IN_PROGRESS' && (
              <button
                onClick={() => handleValidateEntry(item.id)}
                className="w-full py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 font-semibold text-xs border border-emerald-500/30 flex items-center justify-center gap-2 transition-all"
              >
                <Check className="w-4 h-4" /> Marcar Salida de Garita
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default VisitsLogView;
