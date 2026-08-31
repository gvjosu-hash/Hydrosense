/** "Registro de ventas" + hoy -> "Registro de ventas 2026-08-30.xlsx" */
export function nombreArchivoExportacion(nombreReporte: string, extension: "xlsx" | "pdf"): string {
  const fecha = new Date().toISOString().slice(0, 10);
  return `${nombreReporte} ${fecha}.${extension}`;
}

export function encabezadoDescarga(nombreArchivo: string): string {
  // Comillas dobles + fallback ASCII para nombres con acentos (RFC 6266).
  const ascii = nombreArchivo.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(nombreArchivo)}`;
}
