"use client";

import { Campo } from "@/components/ui/input";

export function RangoFechas({
  desde,
  hasta,
  onCambiarDesde,
  onCambiarHasta,
}: {
  desde: string;
  hasta: string;
  onCambiarDesde: (valor: string) => void;
  onCambiarHasta: (valor: string) => void;
}) {
  return (
    <div className="flex gap-3">
      <div className="flex-1">
        <Campo
          etiqueta="Desde"
          type="date"
          value={desde}
          onChange={(e) => onCambiarDesde(e.target.value)}
        />
      </div>
      <div className="flex-1">
        <Campo
          etiqueta="Hasta"
          type="date"
          value={hasta}
          onChange={(e) => onCambiarHasta(e.target.value)}
        />
      </div>
    </div>
  );
}
