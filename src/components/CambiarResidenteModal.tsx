import React, { useState } from 'react';
import { adminApi } from '../services/adminApi';
import { useToast } from './Toast';
import { useConfirm } from './ConfirmDialog';
import ModalShell from './ModalShell';

const LABEL = 'block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1';
const INPUT = 'w-full bg-slate-900 border border-slate-700 text-sm text-slate-100 rounded-xl px-4 py-2.5 focus:outline-none focus:border-blue-500';

export interface ResidenteActual {
  id: string;
  fullName: string;
  email?: string;
}

interface Props {
  houseId: string;
  houseLabel: string;
  residents: ResidenteActual[];
  onClose: () => void;
  onDone: () => void;
}

// Bajas pendientes (el nuevo ya se registró pero la baja falló), por residente anterior.
// Permite reintentar solo la baja si el modal se cierra y se vuelve a abrir.
interface BajaPendiente {
  newUserId: string;
  password: string;
  fullName: string;
  email: string;
  phone: string;
  reason: string;
  error: string;
}
const bajasPendientes = new Map<string, BajaPendiente>();

// Cambio de residente: 1) registra al nuevo en la vivienda, 2) da de baja al anterior.
export const CambiarResidenteModal: React.FC<Props> = ({ houseId, houseLabel, residents, onClose, onDone }) => {
  const toast = useToast();
  const confirm = useConfirm();
  const [previousId, setPreviousId] = useState(residents[0]?.id || '');
  const pendiente = bajasPendientes.get(residents[0]?.id || '');
  const [fullName, setFullName] = useState(pendiente?.fullName || '');
  const [email, setEmail] = useState(pendiente?.email || '');
  const [phone, setPhone] = useState(pendiente?.phone || '');
  const [reason, setReason] = useState(pendiente?.reason || '');
  const [saving, setSaving] = useState(false);
  // Si el paso 1 ya se hizo, se guarda el nuevo usuario para reintentar solo la baja
  const [newUser, setNewUser] = useState<{ id: string; password: string } | null>(pendiente ? { id: pendiente.newUserId, password: pendiente.password } : null);
  const [releaseError, setReleaseError] = useState(pendiente?.error || '');
  const [finished, setFinished] = useState(false);

  const previous = residents.find((r) => r.id === previousId);

  const release = async (newUserId: string) => {
    const res = await adminApi.releaseResident(previousId, {
      newUserId,
      newOwner: { name: fullName.trim(), phone: phone.trim(), email: email.trim() },
      reason: reason.trim() || undefined,
    });
    if (!res.success) throw new Error(res.message || 'No se pudo dar de baja al residente anterior.');
    bajasPendientes.delete(previousId);
  };

  const guardarPendiente = (newUserId: string, password: string, error: string) => {
    bajasPendientes.set(previousId, { newUserId, password, fullName, email, phone, reason, error });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!previous) return;
    if (!fullName.trim() || !email.trim()) {
      toast.error('El nombre y el correo del nuevo residente son obligatorios.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      toast.error('Ingresa un correo electrónico válido.');
      return;
    }
    const ok = await confirm({
      title: 'Cambiar residente',
      message: `Se registrará a ${fullName.trim()} en ${houseLabel} y se dará de baja a ${previous.fullName}: perderá su acceso, se desactivarán sus vehículos y se cancelarán sus invitaciones pendientes y accesos frecuentes. El historial se conserva y los cobros pendientes siguen a su nombre.`,
      confirmLabel: 'Cambiar residente',
    });
    if (!ok) return;

    setSaving(true);
    setReleaseError('');
    try {
      const created = await adminApi.registerTenant({
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        houseId,
      });
      if (!created.success || !created.tenant?.id) {
        // El anterior no se toca
        toast.error(created.message || 'No se pudo registrar al nuevo residente.');
        return;
      }
      const info = { id: created.tenant.id as string, password: created.credentialsInfo?.genericPassword || '' };
      setNewUser(info);
      try {
        await release(info.id);
        setFinished(true);
        toast.success('Residente cambiado.');
        onDone();
      } catch (err: any) {
        const msg = err.message || 'No se pudo dar de baja al residente anterior.';
        guardarPendiente(info.id, info.password, msg);
        setReleaseError(msg);
      }
    } catch (err: any) {
      toast.error(err.message || 'No se pudo registrar al nuevo residente.');
    } finally {
      setSaving(false);
    }
  };

  const retryRelease = async () => {
    if (!newUser) return;
    setSaving(true);
    try {
      await release(newUser.id);
      setReleaseError('');
      setFinished(true);
      toast.success('Residente cambiado.');
      onDone();
    } catch (err: any) {
      const msg = err.message || 'No se pudo dar de baja al residente anterior.';
      guardarPendiente(newUser.id, newUser.password, msg);
      setReleaseError(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell onClose={onClose} labelledBy="cambiar-residente-titulo" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <h3 id="cambiar-residente-titulo" className="text-lg font-extrabold text-white mb-1">Cambiar residente</h3>
        <p className="text-xs text-slate-400 mb-4">Vivienda {houseLabel}</p>

        {newUser ? (
          <div className="space-y-4">
            <div className="p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-sm text-emerald-300">
              {fullName.trim()} quedó registrado.
              {newUser.password && (
                <> Contraseña temporal: <span className="font-mono font-bold text-white">{newUser.password}</span></>
              )}
            </div>
            {releaseError && (
              <div className="p-3 rounded-xl border border-rose-500/30 bg-rose-500/10 text-sm text-rose-300 space-y-2" role="alert">
                <p>El nuevo residente quedó creado, pero no se pudo dar de baja a {previous?.fullName}: {releaseError} Reintenta la baja.</p>
                <button
                  type="button"
                  onClick={retryRelease}
                  disabled={saving}
                  className="max-sm:min-h-11 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-60 text-white text-xs font-bold"
                >
                  {saving ? 'Reintentando...' : 'Reintentar baja'}
                </button>
              </div>
            )}
            {finished && (
              <p className="text-sm text-slate-300">Se dio de baja a {previous?.fullName}. El nuevo residente recibe sus credenciales por correo.</p>
            )}
            <button
              type="button"
              onClick={onClose}
              className="max-sm:min-h-11 w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-sm font-bold"
            >
              Cerrar
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="cambiar-residente-actual" className={LABEL}>Residente actual</label>
              {residents.length > 1 ? (
                <select id="cambiar-residente-actual" value={previousId} onChange={(e) => setPreviousId(e.target.value)} className={INPUT}>
                  {residents.map((r) => (
                    <option key={r.id} value={r.id}>{r.fullName}</option>
                  ))}
                </select>
              ) : (
                <p id="cambiar-residente-actual" className="text-sm text-white">
                  {previous?.fullName}{previous?.email ? <span className="text-slate-400"> · {previous.email}</span> : null}
                </p>
              )}
            </div>
            <div>
              <label htmlFor="cambiar-residente-nombre" className={LABEL}>Nombre del nuevo residente *</label>
              <input id="cambiar-residente-nombre" type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className={INPUT} required />
            </div>
            <div>
              <label htmlFor="cambiar-residente-correo" className={LABEL}>Correo *</label>
              <input id="cambiar-residente-correo" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={INPUT} required />
            </div>
            <div>
              <label htmlFor="cambiar-residente-telefono" className={LABEL}>Teléfono</label>
              <input id="cambiar-residente-telefono" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className={INPUT} />
            </div>
            <div>
              <label htmlFor="cambiar-residente-motivo" className={LABEL}>Motivo (opcional)</label>
              <input id="cambiar-residente-motivo" type="text" value={reason} onChange={(e) => setReason(e.target.value)} className={INPUT} />
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="max-sm:min-h-11 flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-sm font-bold"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="max-sm:min-h-11 flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white text-sm font-bold"
              >
                {saving ? 'Procesando...' : 'Cambiar residente'}
              </button>
            </div>
          </form>
        )}
      </div>
    </ModalShell>
  );
};

export default CambiarResidenteModal;
