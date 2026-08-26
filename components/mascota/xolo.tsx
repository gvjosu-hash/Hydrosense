type Pose = "sentado" | "contento" | "buscando";

interface XoloProps {
  pose?: Pose;
  className?: string;
}

/**
 * Silueta minimalista de un xoloitzcuintle: orejas grandes triangulares,
 * cuerpo esbelto sentado. Trazo simple para verse serio, no infantil.
 */
export function Xolo({ pose = "sentado", className = "" }: XoloProps) {
  return (
    <svg
      viewBox="0 0 200 200"
      fill="none"
      className={className}
      role="img"
      aria-label="Xolo, la mascota"
    >
      {/* cola */}
      <path
        d={
          pose === "contento"
            ? "M150 150c20-4 34-22 30-40"
            : "M150 158c18 4 30-6 32-22"
        }
        stroke="currentColor"
        strokeWidth="7"
        strokeLinecap="round"
      />
      {/* cuerpo */}
      <path
        d="M62 170c-6-28 2-56 22-70 8-6 18-9 28-9 26 0 46 21 46 47 0 18-10 28-22 32-6 26-30 30-52 26-14-3-20-14-22-26z"
        fill="currentColor"
        opacity="0.08"
      />
      <path
        d="M62 170c-6-28 2-56 22-70 8-6 18-9 28-9 26 0 46 21 46 47 0 18-10 28-22 32-6 26-30 30-52 26-14-3-20-14-22-26z"
        stroke="currentColor"
        strokeWidth="7"
      />
      {/* patas */}
      <path d="M78 178v14M96 182v12" stroke="currentColor" strokeWidth="7" strokeLinecap="round" />
      {/* cabeza */}
      <circle cx="88" cy="70" r="30" fill="currentColor" opacity="0.08" />
      <circle cx="88" cy="70" r="30" stroke="currentColor" strokeWidth="7" />
      {/* orejas */}
      <path d="M66 48 54 8l28 26" fill="currentColor" opacity="0.08" />
      <path d="M66 48 54 8l28 26" stroke="currentColor" strokeWidth="7" strokeLinejoin="round" />
      <path d="M108 48 122 8l-26 28" fill="currentColor" opacity="0.08" />
      <path d="M108 48 122 8l-26 28" stroke="currentColor" strokeWidth="7" strokeLinejoin="round" />
      {/* hocico */}
      <path d="M76 78c4 8 12 12 18 12s14-4 18-12" stroke="currentColor" strokeWidth="7" strokeLinecap="round" />
      {/* ojos */}
      {pose === "buscando" ? (
        <>
          <path d="M74 66h10M104 66h10" stroke="currentColor" strokeWidth="7" strokeLinecap="round" />
        </>
      ) : (
        <>
          <circle cx="78" cy="64" r="4.5" fill="currentColor" />
          <circle cx="108" cy="64" r="4.5" fill="currentColor" />
        </>
      )}
    </svg>
  );
}
