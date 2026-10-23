import React, { useEffect, useState } from 'react';
import { KeyRound } from 'lucide-react';
import { adminApi, getSelectedTenantId, PaymentGatewayInfo } from '../services/adminApi';
import { useToast } from './Toast';
import { useConfirm } from './ConfirmDialog';

const isSuperAdminUser = (): boolean => {
  try {
    const saved = localStorage.getItem('zentary_admin_user');
    return saved ? JSON.parse(saved)?.role === 'SUPER_ADMIN' : false;
  } catch {
    return false;
  }
};

// Credenciales de la pasarela de pagos (Wompi) de la residencial seleccionada. Solo SUPER_ADMIN.
export const PaymentGatewayCard: React.FC = () => {
  const toast = useToast();
  const confirm = useConfirm();
  const visible = isSuperAdminUser() && !!getSelectedTenantId();

  const [gateway, setGateway] = useState<PaymentGatewayInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [enabled, setEnabled] = useState(true);
  const [isBusy, setIsBusy] = useState(false);

  const applyGateway = (g: PaymentGatewayInfo) => {
    setGateway(g);
    setClientId(g.source === 'tenant' ? g.clientId || '' : '');
    setEnabled(g.source === 'tenant' ? g.enabled : true);
    setClientSecret('');
  };

  useEffect(() => {
    if (!visible) return;
    const load = async () => {
      try {
        setLoading(true);
        const res = await adminApi.getPaymentGateway();
        if (res.success && res.gateway) {
          applyGateway(res.gateway);
        } else {
          setUnavailable(true);
        }
      } catch {
        setUnavailable(true);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [visible]);

  if (!visible) return null;

  const hasInput = clientId.trim() !== '' && clientSecret.length >= 8;

  const handleTest = async () => {
    try {
      setIsBusy(true);
      const res = await adminApi.testPaymentGateway(
        clientSecret ? { clientId: clientId.trim(), clientSecret } : undefined
      );
      if (res.success && res.ok) toast.success('Las credenciales son válidas.');
      else if (res.success) toast.error('Wompi rechazó las credenciales.');
      else toast.error(res.message || 'No se pudo probar la conexión.');
      if (!clientSecret) {
        const refreshed = await adminApi.getPaymentGateway();
        if (refreshed.success && refreshed.gateway) setGateway(refreshed.gateway);
      }
    } catch {
      toast.error('No se pudo probar la conexión.');
    } finally {
      setIsBusy(false);
    }
  };

  const handleSave = async () => {
    if (!hasInput) {
      toast.error('Ingresa el App ID y el API Secret (mínimo 8 caracteres).');
      return;
    }
    try {
      setIsBusy(true);
      const res = await adminApi.savePaymentGateway({ clientId: clientId.trim(), clientSecret, enabled });
      if (res.success && res.gateway) {
        applyGateway(res.gateway);
        toast.success('Credenciales de la pasarela guardadas.');
      } else {
        toast.error(res.message || 'No se pudieron guardar las credenciales.');
      }
    } catch {
      toast.error('No se pudieron guardar las credenciales.');
    } finally {
      setIsBusy(false);
      setClientSecret('');
    }
  };

  const handleRemove = async () => {
    if (!(await confirm({
      title: 'Quitar credenciales propias',
      message: 'La residencial volverá a cobrar con la cuenta de la empresa. ¿Deseas continuar?',
      confirmLabel: 'Quitar',
    }))) return;
    try {
      setIsBusy(true);
      const res = await adminApi.deletePaymentGateway();
      if (res.success && res.gateway) {
        applyGateway(res.gateway);
        toast.success('La residencial usa ahora la cuenta de la empresa.');
      } else {
        toast.error(res.message || 'No se pudieron quitar las credenciales.');
      }
    } catch {
      toast.error('No se pudieron quitar las credenciales.');
    } finally {
      setIsBusy(false);
    }
  };

  const statusLabel = !gateway
    ? ''
    : gateway.source === 'company'
    ? 'Usa la cuenta de la empresa'
    : !gateway.enabled
    ? 'Credenciales propias desactivadas (usa la cuenta de la empresa)'
    : gateway.lastTestOk === false
    ? 'Credenciales propias con error en la última prueba'
    : 'Usa credenciales propias';
  const statusClass =
    gateway?.source === 'tenant' && gateway.enabled && gateway.lastTestOk === false
      ? 'text-red-300'
      : gateway?.source === 'tenant' && gateway.enabled
      ? 'text-emerald-300'
      : 'text-slate-300';

  return (
    <div className="glass-card p-6 rounded-3xl border border-slate-800 space-y-4">
      <div>
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <KeyRound className="w-5 h-5 text-blue-400" />
          Pasarela de pagos
        </h3>
        {loading ? (
          <p className="text-xs text-slate-400 mt-1">Cargando...</p>
        ) : unavailable ? (
          <p className="text-xs text-slate-400 mt-1">Configuración de pasarela no disponible.</p>
        ) : (
          <p className={`text-xs mt-1 ${statusClass}`}>{statusLabel}</p>
        )}
      </div>

      {!loading && !unavailable && (
        <>
          <p className="text-xs text-amber-300">
            Cambia las credenciales solo cuando no haya pagos pendientes de confirmar.
          </p>
          <form
            autoComplete="off"
            onSubmit={(e) => {
              e.preventDefault();
              handleSave();
            }}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="block">
                <span className="text-xs font-bold text-slate-400">App ID</span>
                <input
                  type="text"
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  maxLength={200}
                  autoComplete="off"
                  className="mt-1 w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-blue-500"
                />
              </label>
              <label className="block">
                <span className="text-xs font-bold text-slate-400">API Secret</span>
                <input
                  type="password"
                  value={clientSecret}
                  onChange={(e) => setClientSecret(e.target.value)}
                  maxLength={500}
                  autoComplete="new-password"
                  placeholder={gateway?.source === 'tenant' && gateway.hasSecret ? 'Guardado (escribe uno nuevo para reemplazarlo)' : ''}
                  className="mt-1 w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </label>
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-300">
              <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
              Activo
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleTest}
                disabled={isBusy || (!hasInput && !(gateway?.source === 'tenant' && !clientSecret))}
                className="max-sm:min-h-11 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-semibold text-xs disabled:opacity-50"
              >
                Probar
              </button>
              <button
                type="submit"
                disabled={isBusy || !hasInput}
                className="max-sm:min-h-11 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs disabled:opacity-50"
              >
                Guardar
              </button>
              {gateway?.source === 'tenant' && (
                <button
                  type="button"
                  onClick={handleRemove}
                  disabled={isBusy}
                  className="max-sm:min-h-11 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-red-900/60 text-red-300 font-semibold text-xs disabled:opacity-50"
                >
                  Quitar
                </button>
              )}
            </div>
          </form>
        </>
      )}
    </div>
  );
};

export default PaymentGatewayCard;
