import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import ModalShell from './ModalShell';

interface ConfirmOptions {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
}

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

// Diálogo de confirmación con promesa: `if (!(await confirm({ message }))) return;`
export const ConfirmProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const resolverRef = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback<ConfirmFn>((opts) => {
    // Si ya había una confirmación abierta, se cancela antes de abrir la nueva
    resolverRef.current?.(false);
    setOptions(opts);
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
    });
  }, []);

  const close = (result: boolean) => {
    resolverRef.current?.(result);
    resolverRef.current = null;
    setOptions(null);
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {options && (
        <ModalShell
          onClose={() => close(false)}
          labelledBy="confirm-dialog-titulo"
          className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md"
        >
          <div className="bg-slate-900 border border-purple-900/60 rounded-3xl p-6 max-w-md w-full shadow-2xl">
            <h3 id="confirm-dialog-titulo" className="text-lg font-extrabold text-white mb-2">
              {options.title || 'Confirmar acción'}
            </h3>
            <p className="text-sm text-slate-300 mb-6">{options.message}</p>
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
              <button
                type="button"
                onClick={() => close(false)}
                className="min-h-[44px] px-5 rounded-xl border border-slate-700 text-slate-300 text-sm font-bold hover:bg-slate-800"
              >
                {options.cancelLabel || 'Cancelar'}
              </button>
              <button
                type="button"
                onClick={() => close(true)}
                className="min-h-[44px] px-5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-sm font-bold"
              >
                {options.confirmLabel || 'Confirmar'}
              </button>
            </div>
          </div>
        </ModalShell>
      )}
    </ConfirmContext.Provider>
  );
};

export const useConfirm = (): ConfirmFn => {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm debe usarse dentro de ConfirmProvider');
  return ctx;
};

export default ConfirmProvider;
