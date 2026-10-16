import React, { createContext, useCallback, useContext, useRef, useState } from 'react';

type ToastType = 'success' | 'error' | 'info';

interface ToastItem {
  id: number;
  text: string;
  type: ToastType;
}

interface ToastApi {
  success: (text: string) => void;
  error: (text: string) => void;
  info: (text: string) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

const TOAST_DURATION_MS = 5000;

const TYPE_STYLES: Record<ToastType, string> = {
  success: 'bg-emerald-950 border-emerald-700 text-emerald-100',
  error: 'bg-red-950 border-red-700 text-red-100',
  info: 'bg-slate-900 border-purple-700 text-slate-100',
};

// Avisos globales de éxito, error e información. Se monta una sola vez en la app.
export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback((type: ToastType, text: string) => {
    const id = nextId.current++;
    setToasts((prev) => [...prev, { id, text, type }]);
    setTimeout(() => dismiss(id), TOAST_DURATION_MS);
  }, [dismiss]);

  const apiRef = useRef<ToastApi>({
    success: (text) => push('success', text),
    error: (text) => push('error', text),
    info: (text) => push('info', text),
  });

  return (
    <ToastContext.Provider value={apiRef.current}>
      {children}
      <div className="fixed bottom-4 right-4 left-4 sm:left-auto z-[100] flex flex-col gap-2 sm:max-w-sm pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            role={t.type === 'error' ? 'alert' : 'status'}
            className={`pointer-events-auto flex items-start gap-2 border rounded-2xl pl-4 pr-1 py-1 shadow-2xl text-sm font-semibold ${TYPE_STYLES[t.type]}`}
          >
            <span className="flex-1 py-2.5 break-words">{t.text}</span>
            <button
              type="button"
              onClick={() => dismiss(t.id)}
              aria-label="Cerrar aviso"
              className="min-w-[44px] min-h-[44px] sm:min-w-[32px] sm:min-h-[32px] flex items-center justify-center rounded-xl hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400"
            >
              <span aria-hidden="true">×</span>
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastApi => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast debe usarse dentro de ToastProvider');
  return ctx;
};

export default ToastProvider;
