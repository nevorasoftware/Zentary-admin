import React, { useState, useEffect } from 'react';
import {
  Plus,
  Calendar,
  Clock,
  DollarSign,
  Building2,
  CheckCircle2,
  AlertCircle,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Filter,
  Image as ImageIcon,
  Sparkles,
} from 'lucide-react';

const API_BASE_URL = 'https://zentary-backend-production.up.railway.app/api';

const ALL_DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const AMENITY_TYPES = ['Salón', 'Piscina', 'Cancha', 'Gimnasio', 'BBQ', 'Área Infantil', 'Otro'];

interface Amenity {
  id: string;
  name: string;
  type: string;
  imageUrl?: string;
  price: number;
  maxReservationTime: number;
  availableDays: string;
  startTime: string;
  endTime: string;
  active: boolean;
  _count?: {
    reservations: number;
  };
}

interface Reservation {
  id: string;
  amenityId: string;
  reservationDate: string;
  startTime: string;
  endTime: string;
  price: number;
  reservationStatus: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'EXPIRED';
  paymentStatus: 'NOT_REQUIRED' | 'PENDING' | 'PAID' | 'FAILED' | 'CANCELLED';
  amenity?: {
    name: string;
    type: string;
  };
  resident?: {
    fullName: string;
    email: string;
    phone?: string;
    property?: {
      unitNumber: string;
      block?: string;
    };
  };
}

export const AmenitiesView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'amenities' | 'calendar'>('amenities');
  const [amenities, setAmenities] = useState<Amenity[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State for Create / Edit Amenity
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAmenityId, setEditingAmenityId] = useState<string | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [type, setType] = useState('Salón');
  const [imageUrl, setImageUrl] = useState('');
  const [price, setPrice] = useState('0.00');
  const [maxReservationTime, setMaxReservationTime] = useState('4');
  const [selectedDays, setSelectedDays] = useState<string[]>(ALL_DAYS);
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('22:00');
  const [formError, setFormError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Calendar Controls
  const [selectedAmenityFilter, setSelectedAmenityFilter] = useState<string>('ALL');
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => {
    const today = new Date();
    const day = today.getDay(); // 0 is Sunday
    const diff = today.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
    const monday = new Date(today.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    return monday;
  });

  const getAdminToken = () => localStorage.getItem('zentary_admin_token') || 'admin_demo_token';

  useEffect(() => {
    fetchAmenities();
  }, []);

  useEffect(() => {
    if (activeTab === 'calendar') {
      fetchWeeklyReservations();
    }
  }, [activeTab, selectedAmenityFilter, currentWeekStart]);

  const fetchAmenities = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/amenities/admin`, {
        headers: { Authorization: `Bearer ${getAdminToken()}` },
      });
      const data = await res.json();
      if (data.success) {
        setAmenities(data.amenities || []);
      }
    } catch (err) {
      console.error('Error fetching amenities:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchWeeklyReservations = async () => {
    try {
      const weekEnd = new Date(currentWeekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);

      const startStr = currentWeekStart.toISOString().split('T')[0];
      const endStr = weekEnd.toISOString().split('T')[0];

      let url = `${API_BASE_URL}/amenities/admin/reservations?startDate=${startStr}&endDate=${endStr}`;
      if (selectedAmenityFilter !== 'ALL') {
        url += `&amenityId=${selectedAmenityFilter}`;
      }

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${getAdminToken()}` },
      });
      const data = await res.json();
      if (data.success) {
        setReservations(data.reservations || []);
      }
    } catch (err) {
      console.error('Error fetching reservations:', err);
    }
  };

  const openCreateModal = () => {
    setEditingAmenityId(null);
    setName('');
    setType('Salón');
    setImageUrl('https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=600');
    setPrice('0.00');
    setMaxReservationTime('4');
    setSelectedDays(ALL_DAYS);
    setStartTime('08:00');
    setEndTime('22:00');
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (amenity: Amenity) => {
    setEditingAmenityId(amenity.id);
    setName(amenity.name);
    setType(amenity.type);
    setImageUrl(amenity.imageUrl || '');
    setPrice(String(amenity.price));
    setMaxReservationTime(String(amenity.maxReservationTime));
    setSelectedDays(amenity.availableDays ? amenity.availableDays.split(',') : ALL_DAYS);
    setStartTime(amenity.startTime || '08:00');
    setEndTime(amenity.endTime || '22:00');
    setFormError('');
    setIsModalOpen(true);
  };

  const handleDayToggle = (day: string) => {
    if (selectedDays.includes(day)) {
      if (selectedDays.length === 1) return; // Must select at least 1 day
      setSelectedDays(selectedDays.filter((d) => d !== day));
    } else {
      setSelectedDays([...selectedDays, day]);
    }
  };

  const handleSaveAmenity = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!name.trim()) {
      setFormError('El nombre de la amenidad es obligatorio.');
      return;
    }

    if (selectedDays.length === 0) {
      setFormError('Debes seleccionar al menos un día disponible.');
      return;
    }

    const startMins = parseInt(startTime.split(':')[0], 10) * 60 + parseInt(startTime.split(':')[1], 10);
    const endMins = parseInt(endTime.split(':')[0], 10) * 60 + parseInt(endTime.split(':')[1], 10);

    if (endMins <= startMins) {
      setFormError('La hora de fin debe ser posterior a la hora de inicio.');
      return;
    }

    try {
      setIsSaving(true);
      const payload = {
        name: name.trim(),
        type,
        imageUrl,
        price: parseFloat(price) || 0,
        maxReservationTime: parseInt(maxReservationTime, 10) || 4,
        availableDays: selectedDays.join(','),
        startTime,
        endTime,
      };

      const url = editingAmenityId
        ? `${API_BASE_URL}/amenities/admin/${editingAmenityId}`
        : `${API_BASE_URL}/amenities/admin`;

      const method = editingAmenityId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getAdminToken()}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        setIsModalOpen(false);
        fetchAmenities();
      } else {
        setFormError(data.message || 'Error al guardar la amenidad');
      }
    } catch (err: any) {
      setFormError(err.message || 'Error de conexión');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAmenity = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar esta amenidad? Se eliminarán las configuraciones asociadas.')) {
      return;
    }
    try {
      const res = await fetch(`${API_BASE_URL}/amenities/admin/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getAdminToken()}` },
      });
      const data = await res.json();
      if (data.success) {
        fetchAmenities();
      }
    } catch (err) {
      console.error('Error deleting amenity:', err);
    }
  };

  // Helper date calculations for weekly calendar
  const getWeekDates = () => {
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(currentWeekStart);
      d.setDate(d.getDate() + i);
      dates.push(d);
    }
    return dates;
  };

  const weekDates = getWeekDates();

  const changeWeek = (offsetDays: number) => {
    const next = new Date(currentWeekStart);
    next.setDate(next.getDate() + offsetDays);
    setCurrentWeekStart(next);
  };

  const handleImageFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 6 * 1024 * 1024) {
      setFormError('La imagen seleccionada supera el límite de 6MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Str = event.target?.result as string;
      setImageUrl(base64Str);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-6">
      {/* View Header with Tabs */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900/80 p-5 rounded-2xl border border-purple-900/40">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            <Building2 className="w-6 h-6 text-[#FFCF36]" />
            Gestión de Amenidades y Espacios Comunes
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Administra los salones, áreas BBQ, canchas y piscinas de la residencial
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-xl border border-purple-900/50">
          <button
            onClick={() => setActiveTab('amenities')}
            className={`px-4 py-2 rounded-lg text-xs font-extrabold transition-all ${
              activeTab === 'amenities'
                ? 'bg-gradient-to-r from-[#1877F2] to-[#6203FF] text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Amenidades
          </button>
          <button
            onClick={() => setActiveTab('calendar')}
            className={`px-4 py-2 rounded-lg text-xs font-extrabold transition-all ${
              activeTab === 'calendar'
                ? 'bg-gradient-to-r from-[#1877F2] to-[#6203FF] text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Calendario de Reservas
          </button>
        </div>
      </div>

      {/* TAB 1: GESTIÓN DE AMENIDADES */}
      {activeTab === 'amenities' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <p className="text-sm font-bold text-slate-300">
              Amenidades Registradas ({amenities.length})
            </p>
            <button
              onClick={openCreateModal}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#1877F2] to-[#6203FF] hover:from-blue-600 hover:to-purple-700 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-purple-600/30 transition-all border border-purple-400/30"
            >
              <Plus className="w-4 h-4 text-[#FFCF36]" />
              Nueva Amenidad
            </button>
          </div>

          {/* Grid of Amenities */}
          {loading ? (
            <div className="text-center py-12">
              <div className="w-8 h-8 border-4 border-[#FFCF36] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm text-slate-400 font-bold">Cargando amenidades...</p>
            </div>
          ) : amenities.length === 0 ? (
            <div className="text-center py-16 bg-slate-900/60 rounded-2xl border border-purple-900/30">
              <Building2 className="w-12 h-12 text-slate-500 mx-auto mb-3" />
              <h3 className="text-base font-bold text-white mb-1">No hay amenidades registradas</h3>
              <p className="text-xs text-slate-400 mb-4">
                Registra el salón de eventos, piscina o áreas comunes para tus residentes.
              </p>
              <button
                onClick={openCreateModal}
                className="px-4 py-2 bg-[#1877F2] text-white text-xs font-bold rounded-xl"
              >
                Crear Primera Amenidad
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {amenities.map((item) => (
                <div
                  key={item.id}
                  className="bg-slate-900/90 rounded-2xl border border-purple-900/40 overflow-hidden shadow-lg hover:border-purple-600/60 transition-all group flex flex-col justify-between"
                >
                  <div>
                    {/* Image Header */}
                    <div className="relative h-44 bg-slate-950 overflow-hidden">
                      <img
                        src={item.imageUrl || 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=600'}
                        alt={item.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute top-3 left-3 px-3 py-1 bg-slate-950/80 backdrop-blur-md rounded-full border border-purple-400/30 text-xs font-bold text-[#FFCF36]">
                        {item.type}
                      </div>
                      <div className="absolute top-3 right-3 px-3 py-1 bg-emerald-500/90 text-white font-black text-xs rounded-full shadow">
                        {item.price === 0 ? 'Gratis ($0.00)' : `$${item.price.toFixed(2)}`}
                      </div>
                    </div>

                    {/* Details Body */}
                    <div className="p-5 space-y-3">
                      <h3 className="text-lg font-extrabold text-white">{item.name}</h3>

                      <div className="space-y-2 text-xs text-slate-300 font-medium">
                        <div className="flex items-center gap-2 text-slate-400">
                          <Clock className="w-4 h-4 text-purple-400" />
                          <span>
                            Horario: <strong className="text-white">{item.startTime} - {item.endTime}</strong>
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-400">
                          <Calendar className="w-4 h-4 text-purple-400" />
                          <span>
                            Máximo reserva: <strong className="text-white">{item.maxReservationTime} Horas</strong>
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-400">
                          <Sparkles className="w-4 h-4 text-[#FFCF36]" />
                          <span>
                            Días: <strong className="text-slate-200">{item.availableDays}</strong>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="p-4 bg-slate-950/60 border-t border-purple-900/30 flex items-center justify-between">
                    <span className="text-xs text-slate-400 font-bold">
                      {item._count?.reservations || 0} reservas realizadas
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEditModal(item)}
                        className="p-2 text-slate-300 hover:text-white bg-purple-900/30 hover:bg-purple-800/50 rounded-xl transition-all"
                        title="Editar Amenidad"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteAmenity(item.id)}
                        className="p-2 text-rose-400 hover:text-rose-200 bg-rose-950/40 hover:bg-rose-900/50 rounded-xl transition-all"
                        title="Eliminar Amenidad"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: CALENDARIO SEMANAL DE RESERVAS */}
      {activeTab === 'calendar' && (
        <div className="space-y-6">
          {/* Filter and Week Navigation */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-900/80 p-4 rounded-2xl border border-purple-900/40">
            {/* Amenity Filter */}
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Filter className="w-4 h-4 text-purple-400" />
              <span className="text-xs font-bold text-slate-300">Amenidad:</span>
              <select
                value={selectedAmenityFilter}
                onChange={(e) => setSelectedAmenityFilter(e.target.value)}
                className="bg-slate-950 text-white font-bold text-xs rounded-xl px-3 py-2 border border-purple-900/60 focus:outline-none focus:border-purple-500"
              >
                <option value="ALL">Todas las Amenidades</option>
                {amenities.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Week Selector */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => changeWeek(-7)}
                className="p-2 bg-slate-950 hover:bg-purple-900/40 text-slate-300 rounded-xl transition-all"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <div className="text-center px-4">
                <span className="text-xs font-extrabold text-white block">
                  {weekDates[0].toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })} -{' '}
                  {weekDates[6].toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
                <span className="text-[10px] font-bold text-[#FFCF36]">Semana de Reservación</span>
              </div>

              <button
                onClick={() => changeWeek(7)}
                className="p-2 bg-slate-950 hover:bg-purple-900/40 text-slate-300 rounded-xl transition-all"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Weekly Calendar Grid */}
          <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
            {weekDates.map((dateObj, idx) => {
              const dayIsoStr = dateObj.toISOString().split('T')[0];
              const dayName = ALL_DAYS[idx];
              const dayNumber = dateObj.getDate();

              // Filter reservations for this specific day
              const dayReservations = reservations.filter((r) => {
                const resDateStr = new Date(r.reservationDate).toISOString().split('T')[0];
                return resDateStr === dayIsoStr;
              });

              return (
                <div
                  key={dayIsoStr}
                  className="bg-slate-900/80 rounded-2xl border border-purple-900/40 p-3 min-h-[300px] flex flex-col justify-start"
                >
                  {/* Day Header */}
                  <div className="text-center py-2 mb-3 bg-slate-950/80 rounded-xl border border-purple-900/30">
                    <span className="text-xs font-bold text-slate-400 block uppercase">{dayName}</span>
                    <span className="text-base font-extrabold text-[#FFCF36]">{dayNumber}</span>
                  </div>

                  {/* Reservations List */}
                  <div className="space-y-3 flex-1">
                    {dayReservations.length === 0 ? (
                      <p className="text-[11px] text-slate-500 text-center py-8 font-medium">Sin reservas</p>
                    ) : (
                      dayReservations.map((res) => {
                        const isConfirmed = res.reservationStatus === 'CONFIRMED';
                        const isPending = res.reservationStatus === 'PENDING';

                        return (
                          <div
                            key={res.id}
                            className={`p-3 rounded-xl border text-xs space-y-1.5 transition-all ${
                              isConfirmed
                                ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
                                : isPending
                                ? 'bg-amber-950/30 border-amber-500/40 text-amber-200'
                                : 'bg-rose-950/30 border-rose-500/40 text-rose-200'
                            }`}
                          >
                            <div className="flex justify-between items-center font-extrabold">
                              <span className="text-white text-[11px] truncate">
                                {res.amenity?.name || 'Amenidad'}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                                  isConfirmed
                                    ? 'bg-emerald-500 text-slate-950'
                                    : isPending
                                    ? 'bg-amber-400 text-slate-950'
                                    : 'bg-rose-500 text-white'
                                }`}
                              >
                                {isConfirmed ? 'Confirmada' : isPending ? 'Pendiente' : 'Cancelada'}
                              </span>
                            </div>

                            <div className="text-[11px] font-bold text-purple-300">
                              ⏰ {res.startTime} - {res.endTime}
                            </div>

                            <div className="text-[11px] text-slate-300 font-semibold truncate">
                              👤 {res.resident?.fullName || 'Residente'}
                            </div>
                            {res.resident?.property && (
                              <div className="text-[10px] text-slate-400 font-bold">
                                🏠 {res.resident.property.unitNumber}
                              </div>
                            )}

                            <div className="pt-1 border-t border-white/10 flex justify-between items-center text-[10px]">
                              <span className="text-slate-400">
                                {res.price === 0 ? 'Gratis' : `$${res.price.toFixed(2)}`}
                              </span>
                              <span className="font-bold">
                                {res.paymentStatus === 'PAID'
                                  ? '💳 Pagado'
                                  : res.paymentStatus === 'NOT_REQUIRED'
                                  ? '✓ $0'
                                  : '⏳ Pendiente Pago'}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* CREATE / EDIT AMENITY MODAL FORM */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-purple-900/60 rounded-3xl p-6 max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <h3 className="text-lg font-extrabold text-white mb-1">
              {editingAmenityId ? 'Editar Amenidad' : 'Registrar Nueva Amenidad'}
            </h3>
            <p className="text-xs text-slate-400 mb-6">
              Configura los días, precios y horarios de disponibilidad de la amenidad.
            </p>

            {formError && (
              <div className="mb-4 p-3 bg-rose-950/60 border border-rose-500/50 rounded-xl text-rose-200 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveAmenity} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Nombre de la amenidad *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej: Salón de Eventos Principal"
                  className="w-full bg-slate-950 text-white font-medium text-xs rounded-xl px-3.5 py-2.5 border border-purple-900/60 focus:outline-none focus:border-purple-500"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Tipo de amenidad *</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full bg-slate-950 text-white font-medium text-xs rounded-xl px-3.5 py-2.5 border border-purple-900/60 focus:outline-none focus:border-purple-500"
                  >
                    {AMENITY_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Precio por reserva ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-slate-950 text-white font-medium text-xs rounded-xl px-3.5 py-2.5 border border-purple-900/60 focus:outline-none focus:border-purple-500"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">Colocar 0 para reservación gratuita.</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Fotografía / Imagen de la amenidad *</label>
                <div className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-purple-900/60 hover:border-purple-500/80 rounded-2xl bg-slate-950/60 transition-all">
                  {imageUrl ? (
                    <div className="relative w-full h-44 rounded-xl overflow-hidden group">
                      <img src={imageUrl} alt="Vista previa" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-slate-950/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                        <label className="px-3.5 py-2 bg-[#1877F2] hover:bg-blue-600 text-white font-extrabold text-xs rounded-xl cursor-pointer shadow-lg transition-all">
                          Cambiar Imagen
                          <input type="file" accept="image/*" className="hidden" onChange={handleImageFileSelect} />
                        </label>
                        <button
                          type="button"
                          onClick={() => setImageUrl('')}
                          className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-xl shadow-lg transition-all"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center cursor-pointer w-full py-6">
                      <ImageIcon className="w-9 h-9 text-purple-400 mb-2" />
                      <span className="text-xs font-bold text-white mb-1">Cargar Fotografía desde tu Dispositivo</span>
                      <span className="text-[10px] text-slate-400">Archivos soportados: JPG, PNG, WEBP (Se guardará directamente en la base de datos)</span>
                      <input type="file" accept="image/*" className="hidden" onChange={handleImageFileSelect} />
                    </label>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-2">Días disponibles *</label>
                <div className="flex flex-wrap gap-2">
                  {ALL_DAYS.map((day) => {
                    const isSelected = selectedDays.includes(day);
                    return (
                      <button
                        type="button"
                        key={day}
                        onClick={() => handleDayToggle(day)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                          isSelected
                            ? 'bg-[#1877F2] text-white border-blue-400'
                            : 'bg-slate-950 text-slate-400 border-purple-900/40 hover:text-white'
                        }`}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Hora Inicio</label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full bg-slate-950 text-white font-medium text-xs rounded-xl px-3.5 py-2.5 border border-purple-900/60 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Hora Fin</label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full bg-slate-950 text-white font-medium text-xs rounded-xl px-3.5 py-2.5 border border-purple-900/60 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Tiempo Máx (Horas)</label>
                  <input
                    type="number"
                    min="1"
                    max="24"
                    value={maxReservationTime}
                    onChange={(e) => setMaxReservationTime(e.target.value)}
                    className="w-full bg-slate-950 text-white font-medium text-xs rounded-xl px-3.5 py-2.5 border border-purple-900/60 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-purple-900/40">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-400 hover:text-white rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2.5 bg-gradient-to-r from-[#1877F2] to-[#6203FF] text-white text-xs font-extrabold rounded-xl shadow-lg"
                >
                  {isSaving ? 'Guardando...' : editingAmenityId ? 'Actualizar Amenidad' : 'Crear Amenidad'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AmenitiesView;
