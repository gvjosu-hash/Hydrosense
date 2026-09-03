// Frases cortas que rotan bajo el logo en la portada. Se elige una al azar
// en cada carga de la página.
export const FRASES_MARCA = [
  "El presente que construye tu futuro.",
  "Cada venta cuenta una historia.",
  "Tu negocio, a tu ritmo.",
  "Simplifica hoy, crece mañana.",
  "Hecho para quienes construyen algo propio.",
  "Donde cada peso se cuenta.",
];

export function fraseMarcaAleatoria(): string {
  return FRASES_MARCA[Math.floor(Math.random() * FRASES_MARCA.length)];
}
