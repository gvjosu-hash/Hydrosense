import { ReactNode } from "react";
import { Xolo } from "@/components/mascota/xolo";

export function EstadoVacio({
  titulo,
  descripcion,
  accion,
}: {
  titulo: string;
  descripcion?: string;
  accion?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center text-center gap-3 py-12 px-4">
      <Xolo className="w-20 h-auto opacity-60" />
      <h3 className="text-xl font-bold">{titulo}</h3>
      {descripcion && <p className="text-texto-suave max-w-sm">{descripcion}</p>}
      {accion}
    </div>
  );
}
