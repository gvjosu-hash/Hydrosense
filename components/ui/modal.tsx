"use client";

import { ReactNode } from "react";

export function Modal({
  titulo,
  onCerrar,
  children,
}: {
  titulo: string;
  onCerrar: () => void;
  children: ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-4">
      <div className="bg-superficie w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-borde sticky top-0 bg-superficie">
          <h2 className="text-xl font-bold">{titulo}</h2>
          <button
            onClick={onCerrar}
            aria-label="Cerrar"
            className="text-2xl leading-none text-texto-suave hover:text-texto px-2 cursor-pointer"
          >
            ×
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
