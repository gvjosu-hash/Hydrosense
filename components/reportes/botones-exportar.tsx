"use client";

export function BotonesExportar({
  endpoint,
  params,
}: {
  endpoint: string;
  params?: Record<string, string>;
}) {
  function urlPara(formato: "xlsx" | "pdf"): string {
    const busqueda = new URLSearchParams({ ...params, formato });
    return `${endpoint}?${busqueda.toString()}`;
  }

  return (
    <div className="flex gap-2">
      <a
        href={urlPara("xlsx")}
        className="text-sm font-semibold text-acento border-2 border-borde-fuerte rounded-xl px-3 py-2 hover:border-acento transition-colors"
      >
        Excel
      </a>
      <a
        href={urlPara("pdf")}
        className="text-sm font-semibold text-acento border-2 border-borde-fuerte rounded-xl px-3 py-2 hover:border-acento transition-colors"
      >
        PDF
      </a>
    </div>
  );
}
