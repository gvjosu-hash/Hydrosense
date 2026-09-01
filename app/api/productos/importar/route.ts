import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requerirAcceso, verificarLimiteProductos } from "@/lib/tenant";
import { respuestaError } from "@/lib/api-utils";
import { leerArchivoProductos, MAX_FILAS_IMPORTACION } from "@/lib/importar-productos";

export async function POST(request: Request) {
  try {
    const sesion = await requerirAcceso();
    const formData = await request.formData();
    const archivo = formData.get("archivo");

    if (!(archivo instanceof File)) {
      return NextResponse.json({ error: "Selecciona un archivo .csv o .xlsx" }, { status: 400 });
    }
    if (!/\.(csv|xlsx)$/i.test(archivo.name)) {
      return NextResponse.json({ error: "El archivo debe ser .csv o .xlsx" }, { status: 400 });
    }

    const buffer = Buffer.from(await archivo.arrayBuffer());
    const filas = await leerArchivoProductos(buffer, archivo.name);

    if (filas.length === 0) {
      return NextResponse.json({ error: "El archivo no tiene filas con datos" }, { status: 400 });
    }
    if (filas.length > MAX_FILAS_IMPORTACION) {
      return NextResponse.json(
        { error: `El archivo tiene demasiadas filas (máximo ${MAX_FILAS_IMPORTACION})` },
        { status: 400 }
      );
    }

    const errores: { fila: number; mensaje: string }[] = [];
    for (const f of filas) {
      if (f.error) errores.push({ fila: f.fila, mensaje: f.error });
    }
    const validas = filas.filter(
      (f): f is { fila: number; datos: NonNullable<(typeof filas)[number]["datos"]> } => !!f.datos
    );

    const codigosBarras = validas
      .map((f) => f.datos.codigoBarras)
      .filter((c): c is string => !!c);
    const existentes = codigosBarras.length
      ? await prisma.producto.findMany({
          where: { tiendaId: sesion.tiendaId, codigoBarras: { in: codigosBarras }, activo: true },
        })
      : [];
    const existentesPorCodigo = new Map(existentes.map((p) => [p.codigoBarras as string, p]));

    // Solo las filas que no van a actualizar un producto existente suman al
    // límite del plan (las que sí tienen código de barras ya registrado son
    // una actualización, no un producto nuevo).
    const filasNuevas = validas.filter(
      (f) => !(f.datos.codigoBarras && existentesPorCodigo.has(f.datos.codigoBarras))
    ).length;
    await verificarLimiteProductos(sesion.tiendaId, filasNuevas);

    let creados = 0;
    let actualizados = 0;

    for (const { fila, datos } of validas) {
      const codigoBarras = datos.codigoBarras || null;
      const data = {
        nombre: datos.nombre,
        tipoVenta: datos.tipoVenta,
        unidad: datos.unidad,
        precio: datos.precio,
        costo: datos.costo ?? null,
        categoria: datos.categoria || null,
        fechaCaducidad: datos.fechaCaducidad ? new Date(datos.fechaCaducidad) : null,
        stockActual: datos.stockActual,
        stockMinimo: datos.stockMinimo,
        codigoBarras,
      };

      const existente = codigoBarras ? existentesPorCodigo.get(codigoBarras) : undefined;
      try {
        if (existente) {
          const actualizado = await prisma.producto.update({ where: { id: existente.id }, data });
          if (codigoBarras) existentesPorCodigo.set(codigoBarras, actualizado);
          actualizados += 1;
        } else {
          const creado = await prisma.producto.create({ data: { ...data, tiendaId: sesion.tiendaId } });
          if (codigoBarras) existentesPorCodigo.set(codigoBarras, creado);
          creados += 1;
        }
      } catch {
        errores.push({ fila, mensaje: "No se pudo guardar esta fila" });
      }
    }

    return NextResponse.json({ creados, actualizados, errores, totalFilas: filas.length });
  } catch (error) {
    return respuestaError(error);
  }
}
