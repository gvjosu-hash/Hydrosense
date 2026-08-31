import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requerirAcceso } from "@/lib/tenant";
import { respuestaError } from "@/lib/api-utils";
import { generarExcel } from "@/lib/exportar-excel";
import { generarTablaPdf } from "@/lib/exportar-pdf-tabla";
import { encabezadoDescarga, nombreArchivoExportacion } from "@/lib/nombre-exportacion";

function inicioDeDia(fecha: Date): string {
  return fecha.toISOString().slice(0, 10);
}

export async function GET(request: Request) {
  try {
    const sesion = await requerirAcceso();
    const { searchParams } = new URL(request.url);
    const hasta = searchParams.get("hasta") ? new Date(searchParams.get("hasta")!) : new Date();
    const desde = searchParams.get("desde")
      ? new Date(searchParams.get("desde")!)
      : new Date(hasta.getTime() - 13 * 24 * 60 * 60 * 1000);

    const ventas = await prisma.venta.findMany({
      where: { tiendaId: sesion.tiendaId, fecha: { gte: desde, lte: hasta } },
      select: { fecha: true, total: true, metodoPago: true },
    });

    const porDia = new Map<
      string,
      {
        totalEfectivo: Prisma.Decimal;
        totalTarjeta: Prisma.Decimal;
        totalFiado: Prisma.Decimal;
        numeroVentas: number;
      }
    >();

    for (const venta of ventas) {
      const clave = inicioDeDia(venta.fecha);
      const previo = porDia.get(clave) ?? {
        totalEfectivo: new Prisma.Decimal(0),
        totalTarjeta: new Prisma.Decimal(0),
        totalFiado: new Prisma.Decimal(0),
        numeroVentas: 0,
      };
      if (venta.metodoPago === "EFECTIVO") {
        previo.totalEfectivo = previo.totalEfectivo.add(venta.total);
      } else if (venta.metodoPago === "TARJETA") {
        previo.totalTarjeta = previo.totalTarjeta.add(venta.total);
      } else {
        previo.totalFiado = previo.totalFiado.add(venta.total);
      }
      previo.numeroVentas += 1;
      porDia.set(clave, previo);
    }

    const dias = Array.from(porDia.entries())
      .map(([fecha, datos]) => ({
        fecha,
        numeroVentas: datos.numeroVentas,
        totalEfectivo: datos.totalEfectivo.toNumber(),
        totalTarjeta: datos.totalTarjeta.toNumber(),
        totalFiado: datos.totalFiado.toNumber(),
        total: datos.totalEfectivo.add(datos.totalTarjeta).add(datos.totalFiado).toNumber(),
      }))
      .sort((a, b) => b.fecha.localeCompare(a.fecha));

    const formato = searchParams.get("formato");
    if (formato === "xlsx" || formato === "pdf") {
      const filas = dias.map((d) => ({
        fecha: d.fecha,
        ventas: String(d.numeroVentas),
        efectivo: `$${d.totalEfectivo.toFixed(2)}`,
        tarjeta: `$${d.totalTarjeta.toFixed(2)}`,
        fiado: `$${d.totalFiado.toFixed(2)}`,
        total: `$${d.total.toFixed(2)}`,
      }));
      const nombreArchivo = nombreArchivoExportacion("Ventas diarias", formato);
      const subtitulo = `Del ${desde.toISOString().slice(0, 10)} al ${hasta.toISOString().slice(0, 10)}`;

      if (formato === "xlsx") {
        const buffer = await generarExcel([
          {
            nombre: "Ventas diarias",
            columnas: [
              { encabezado: "Fecha", clave: "fecha", ancho: 14 },
              { encabezado: "Ventas", clave: "ventas", ancho: 10 },
              { encabezado: "Efectivo", clave: "efectivo", ancho: 14 },
              { encabezado: "Tarjeta", clave: "tarjeta", ancho: 14 },
              { encabezado: "Fiado", clave: "fiado", ancho: 14 },
              { encabezado: "Total", clave: "total", ancho: 14 },
            ],
            filas,
          },
        ]);
        return new NextResponse(new Uint8Array(buffer), {
          headers: {
            "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "Content-Disposition": encabezadoDescarga(nombreArchivo),
          },
        });
      }

      const bytes = await generarTablaPdf({
        titulo: "Ventas diarias",
        subtitulo,
        columnas: [
          { encabezado: "Fecha", clave: "fecha", ancho: 100 },
          { encabezado: "Ventas", clave: "ventas", ancho: 80, alineacion: "derecha" },
          { encabezado: "Efectivo", clave: "efectivo", ancho: 110, alineacion: "derecha" },
          { encabezado: "Tarjeta", clave: "tarjeta", ancho: 110, alineacion: "derecha" },
          { encabezado: "Fiado", clave: "fiado", ancho: 110, alineacion: "derecha" },
          { encabezado: "Total", clave: "total", ancho: 110, alineacion: "derecha" },
        ],
        filas,
      });
      return new NextResponse(Buffer.from(bytes), {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": encabezadoDescarga(nombreArchivo),
        },
      });
    }

    return NextResponse.json({ dias });
  } catch (error) {
    return respuestaError(error);
  }
}
