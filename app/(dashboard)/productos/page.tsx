"use client";

import { useCallback, useEffect, useState } from "react";
import { Boton } from "@/components/ui/button";
import { Campo } from "@/components/ui/input";
import { Tarjeta } from "@/components/ui/card";
import { Insignia } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { EstadoVacio } from "@/components/ui/estado-vacio";
import { useToast } from "@/components/ui/toast";
import {
  FormularioProducto,
  DatosFormularioProducto,
} from "@/components/productos/formulario-producto";
import { FilaEdicionRapida } from "@/components/productos/fila-edicion-rapida";

interface Producto {
  id: string;
  nombre: string;
  tipoVenta: "PIEZA" | "GRANEL";
  unidad: "PIEZA" | "KG" | "G" | "L" | "ML";
  precio: string;
  stockActual: string;
  stockMinimo: string;
  codigoBarras: string | null;
  activo: boolean;
}

const ETIQUETA_UNIDAD: Record<Producto["unidad"], string> = {
  PIEZA: "pza",
  KG: "kg",
  G: "g",
  L: "l",
  ML: "ml",
};

export default function PaginaProductos() {
  const { mostrar } = useToast();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [cargando, setCargando] = useState(true);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [productoEditando, setProductoEditando] = useState<Producto | null>(null);
  const [errorFormulario, setErrorFormulario] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [edicionRapidaId, setEdicionRapidaId] = useState<string | null>(null);

  const cargarProductos = useCallback(async (texto: string) => {
    setCargando(true);
    const params = new URLSearchParams();
    if (texto) params.set("buscar", texto);
    const respuesta = await fetch(`/api/productos?${params.toString()}`);
    const datos = await respuesta.json();
    setProductos(datos.productos ?? []);
    setCargando(false);
  }, []);

  useEffect(() => {
    const temporizador = setTimeout(() => cargarProductos(busqueda), 250);
    return () => clearTimeout(temporizador);
  }, [busqueda, cargarProductos]);

  function abrirCrear() {
    setProductoEditando(null);
    setErrorFormulario("");
    setModalAbierto(true);
  }

  function abrirEditar(producto: Producto) {
    setProductoEditando(producto);
    setErrorFormulario("");
    setModalAbierto(true);
  }

  async function guardarProducto(datos: DatosFormularioProducto) {
    setGuardando(true);
    setErrorFormulario("");
    try {
      const url = productoEditando ? `/api/productos/${productoEditando.id}` : "/api/productos";
      const metodo = productoEditando ? "PUT" : "POST";
      const respuesta = await fetch(url, {
        method: metodo,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(datos),
      });
      const resultado = await respuesta.json();
      if (!respuesta.ok) {
        setErrorFormulario(resultado.error ?? "No se pudo guardar el producto");
        return;
      }
      setModalAbierto(false);
      mostrar(productoEditando ? "Producto actualizado" : "Producto agregado");
      cargarProductos(busqueda);
    } finally {
      setGuardando(false);
    }
  }

  async function cambiarActivo(producto: Producto, activo: boolean) {
    await fetch(`/api/productos/${producto.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ activo }),
    });
    mostrar(activo ? "Producto reactivado" : "Producto dado de baja");
    cargarProductos(busqueda);
  }

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Productos</h1>
        <Boton onClick={abrirCrear}>+ Agregar</Boton>
      </div>

      <Campo
        placeholder="Buscar por nombre o código de barras"
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
      />

      {!cargando && productos.length === 0 && (
        <EstadoVacio
          titulo={busqueda ? "No encontramos ese producto" : "Aún no tienes productos"}
          descripcion={
            busqueda
              ? "Intenta con otro nombre o código de barras."
              : "Agrega tu primer producto para empezar a vender."
          }
          accion={
            !busqueda ? <Boton onClick={abrirCrear}>Agregar mi primer producto</Boton> : undefined
          }
        />
      )}

      <div className="flex flex-col gap-2">
        {productos.map((producto) =>
          producto.id === edicionRapidaId ? (
            <FilaEdicionRapida
              key={producto.id}
              id={producto.id}
              nombre={producto.nombre}
              unidad={producto.unidad}
              precioInicial={producto.precio}
              stockInicial={producto.stockActual}
              onCerrar={() => {
                setEdicionRapidaId(null);
                cargarProductos(busqueda);
              }}
            />
          ) : (
            <Tarjeta
              key={producto.id}
              className={`p-4 flex flex-col gap-2 ${!producto.activo ? "opacity-50" : ""}`}
            >
              <div className="flex items-center gap-2">
                <button
                  onClick={() => abrirEditar(producto)}
                  className="text-left flex-1 min-w-0 cursor-pointer"
                >
                  <p className="font-semibold text-lg truncate">{producto.nombre}</p>
                  <p className="text-texto-suave text-sm">
                    ${Number(producto.precio).toFixed(2)} / {ETIQUETA_UNIDAD[producto.unidad]}
                    {" · "}
                    {Number(producto.stockActual)} {ETIQUETA_UNIDAD[producto.unidad]} en existencia
                  </p>
                </button>
                {producto.activo && (
                  <button
                    onClick={() => setEdicionRapidaId(producto.id)}
                    aria-label={`Editar precio y existencia de ${producto.nombre}`}
                    title="Editar precio y existencia"
                    className="text-xl px-2 py-1 text-texto-suave hover:text-acento cursor-pointer shrink-0"
                  >
                    ✎
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {Number(producto.precio) === 0 && producto.activo && (
                  <Insignia tono="neutral">Ajusta tu precio</Insignia>
                )}
                {Number(producto.stockActual) < Number(producto.stockMinimo) &&
                  producto.activo && <Insignia tono="alerta">Stock bajo</Insignia>}
                <Boton
                  variante="fantasma"
                  className="text-sm px-3 py-2 min-h-0 ml-auto"
                  onClick={() => cambiarActivo(producto, !producto.activo)}
                >
                  {producto.activo ? "Dar de baja" : "Reactivar"}
                </Boton>
              </div>
            </Tarjeta>
          )
        )}
      </div>

      {modalAbierto && (
        <Modal
          titulo={productoEditando ? "Editar producto" : "Agregar producto"}
          onCerrar={() => setModalAbierto(false)}
        >
          <FormularioProducto
            valoresIniciales={
              productoEditando
                ? {
                    nombre: productoEditando.nombre,
                    tipoVenta: productoEditando.tipoVenta,
                    unidad: productoEditando.unidad,
                    precio: productoEditando.precio,
                    stockActual: productoEditando.stockActual,
                    stockMinimo: productoEditando.stockMinimo,
                    codigoBarras: productoEditando.codigoBarras ?? "",
                  }
                : undefined
            }
            onGuardar={guardarProducto}
            onCancelar={() => setModalAbierto(false)}
            guardando={guardando}
            error={errorFormulario}
          />
        </Modal>
      )}
    </div>
  );
}
