"use client";

import { createContext, useCallback, useContext, useState, ReactNode } from "react";

type TonoToast = "ok" | "peligro" | "neutral";

interface Toast {
  id: number;
  mensaje: string;
  tono: TonoToast;
}

interface ToastContextValor {
  mostrar: (mensaje: string, tono?: TonoToast) => void;
}

const ToastContext = createContext<ToastContextValor | null>(null);

const estilosPorTono: Record<TonoToast, string> = {
  ok: "bg-ok text-white",
  peligro: "bg-peligro text-white",
  neutral: "bg-texto text-white",
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const mostrar = useCallback((mensaje: string, tono: TonoToast = "ok") => {
    const id = Date.now() + Math.random();
    setToasts((actuales) => [...actuales, { id, mensaje, tono }]);
    setTimeout(() => {
      setToasts((actuales) => actuales.filter((t) => t.id !== id));
    }, 2800);
  }, []);

  return (
    <ToastContext.Provider value={{ mostrar }}>
      {children}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[60] flex flex-col gap-2 items-center px-4 w-full pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`rounded-2xl px-5 py-3 text-lg font-semibold shadow-lg ${estilosPorTono[t.tono]}`}
          >
            {t.mensaje}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast debe usarse dentro de ToastProvider");
  return ctx;
}
