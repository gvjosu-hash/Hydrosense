type Variante = "icono" | "completo";

interface XoloProps {
  variante?: Variante;
  className?: string;
}

const SRC: Record<Variante, string> = {
  icono: "/marca/logo-icono.png",
  completo: "/marca/logo-completo.png",
};

/** Logotipo oficial de Xolo: silueta del xoloitzcuintle ("icono"), o el
 * lockup completo con el nombre "XOLO" y el eslogan ("completo"). */
export function Xolo({ variante = "icono", className = "" }: XoloProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={SRC[variante]}
      alt="Xolo"
      className={`object-contain ${className}`}
    />
  );
}
