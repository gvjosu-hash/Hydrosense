"use client";

import { useCallback, useEffect, useState } from "react";
import { Campo } from "@/components/ui/input";
import { Tarjeta } from "@/components/ui/card";
import { Boton } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { Carrito, ItemCarrito } from "@/components/pos/carrito";
import { ModalCantidadGranel } from "@/components/pos/modal-cantidad-granel";
import { ModalCobro } from "@/components/pos/modal-cobro";
import { TicketExito, VentaConfirmada } from "@/components/pos/ticket-exito";

interface ProductoBusqueda {
  id: string;
  nombre: string;
  tipoVenta: "PIEZA" | "GRANEL";
  unidad: string;
  precio: string;
}

export default function PaginaPOS() {
  const { mostrar } = useToast();
  const [busqueda, setBusqueda] = useState("");
  const [resultados, setResultados] = useState<ProductoBusqueda[]>([]);
  const [carrito, setCarrito] = useState<ItemCarrito[]>([]);
  const [productoGranelActivo, setProductoGranelActivo] = useState<ProductoBusqueda | null>(null);
  const [cantidadGranelInicial, setCantidadGranelInicial] = useState<string | undefined>();
  const [modalCobroAbierto, setModalCobroAbierto] = useState(false);
  const [cobrando, setCobrando] = useState(false);
  const [errorCobro, setErrorCobro] = useState("");
  const [ventaExitosa, setVentaExitosa] = useState<VentaConfirmada | null>(null);

  const buscar = useCallback(async (texto: string) => {
    if (!texto.trim()) {
      setResultados([]);
      return;
    }
    const respuesta = await fetch(`/api/productos?buscar=${encodeURIComponent(texto)}`);
    const datos = await respuesta.json();
    setResultados(datos.productos ?? []);
  }, []);

  useEffect(() => {
    const temporizador = setTimeout(() => buscar(busqueda), 200);
    return () => clearTimeout(temporizador);
  }, [busqueda, buscar]);

  function agregarPieza(producto: ProductoBusqueda) {
    setCarrito((actual) => {
      const existente = actual.find((i) => i.productoId === producto.id);
      if (existente) {
        return actual.map((i) =>
          i.productoId === producto.id ? { ...i, cantidad: i.cantidad + 1 } : i
        );
      }
      return [
        ...actual,
        {
          productoId: producto.id,
          nombre: producto.nombre,
          tipoVenta: "PIEZA",
          unidad: producto.unidad,
          precioUnitario: Number(producto.precio),
          cantidad: 1,
        },
      ];
    });
    mostrar(`${producto.nombre} agregado`);
    setBusqueda("");
    setResultados([]);
  }

  function abrirGranel(producto: ProductoBusqueda) {
    const enCarrito = carrito.find((i) => i.productoId === producto.id);
    setCantidadGranelInicial(enCarrito ? String(enCarrito.cantidad) : undefined);
    setProductoGranelActivo(producto);
  }

  function confirmarGranel(cantidad: number) {
    const producto = productoGranelActivo!;
    setCarrito((actual) => {
      const existente = actual.find((i) => i.productoId === producto.id);
      if (existente) {
        return actual.map((i) =>
          i.productoId === producto.id ? { ...i, cantidad } : i
        );
      }
      return [
        ...actual,
        {
          productoId: producto.id,
          nombre: producto.nombre,
          tipoVenta: "GRANEL",
          unidad: producto.unidad,
          precioUnitario: Number(producto.precio),
          cantidad,
        },
      ];
    });
    mostrar(`${producto.nombre} agregado`);
    setProductoGranelActivo(null);
    setBusqueda("");
    setResultados([]);
  }

  function cambiarCantidadPieza(productoId: string, nuevaCantidad: number) {
    if (nuevaCantidad <= 0) {
      setCarrito((actual) => actual.filter((i) => i.productoId !== productoId));
      return;
    }
    setCarrito((actual) =>
      actual.map((i) => (i.productoId === productoId ? { ...i, cantidad: nuevaCantidad } : i))
    );
  }

  function quitarDelCarrito(productoId: string) {
    setCarrito((actual) => actual.filter((i) => i.productoId !== productoId));
  }

  const total = carrito.reduce((suma, i) => suma + i.cantidad * i.precioUnitario, 0);

  async function confirmarCobro(montoRecibido: number) {
    setCobrando(true);
    setErrorCobro("");
    try {
      const respuesta = await fetch("/api/ventas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: carrito.map((i) => ({ productoId: i.productoId, cantidad: i.cantidad })),
          metodoPago: "EFECTIVO",
          montoRecibido,
        }),
      });
      const datos = await respuesta.json();
      if (!respuesta.ok) {
        setErrorCobro(datos.error ?? "No se pudo cerrar la venta");
        return;
      }
      const venta = datos.venta;
      setVentaExitosa({
        id: venta.id,
        total: Number(venta.total),
        montoRecibido: venta.montoRecibido !== null ? Number(venta.montoRecibido) : null,
        cambio: venta.cambio !== null ? Number(venta.cambio) : null,
        items: venta.items.map((it: { producto: { nombre: string; unidad: string }; cantidad: string; precioUnitario: string; importe: string }) => ({
          nombre: it.producto.nombre,
          unidad: it.producto.unidad,
          cantidad: Number(it.cantidad),
          precioUnitario: Number(it.precioUnitario),
          importe: Number(it.importe),
        })),
      });
      setModalCobroAbierto(false);
      setCarrito([]);
    } finally {
      setCobrando(false);
    }
  }

  if (ventaExitosa) {
    return (
      <TicketExito
        venta={ventaExitosa}
        onNuevaVenta={() => setVentaExitosa(null)}
      />
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto flex flex-col gap-4">
      <h1 className="text-2xl font-bold">Cobrar</h1>

      <div className="relative">
        <Campo
          placeholder="Buscar producto por nombre o código de barras"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
        {resultados.length > 0 && (
          <Tarjeta className="absolute z-30 mt-1 w-full max-h-72 overflow-y-auto p-1">
            {resultados.map((producto) => (
              <button
                key={producto.id}
                onClick={() =>
                  producto.tipoVenta === "PIEZA" ? agregarPieza(producto) : abrirGranel(producto)
                }
                className="w-full text-left px-3 py-3 rounded-xl hover:bg-black/5 flex justify-between items-center cursor-pointer"
              >
                <span className="font-medium">{producto.nombre}</span>
                {Number(producto.precio) === 0 ? (
                  <span className="text-alerta text-sm font-semibold">Ajusta tu precio</span>
                ) : (
                  <span className="text-texto-suave">${Number(producto.precio).toFixed(2)}</span>
                )}
              </button>
            ))}
          </Tarjeta>
        )}
      </div>

      <Carrito
        items={carrito}
        onCambiarCantidadPieza={cambiarCantidadPieza}
        onEditarGranel={(item) => abrirGranel({ id: item.productoId, nombre: item.nombre, tipoVenta: "GRANEL", unidad: item.unidad, precio: String(item.precioUnitario) })}
        onQuitar={quitarDelCarrito}
      />

      {carrito.length > 0 && (
        <div className="fixed bottom-16 md:bottom-0 inset-x-0 bg-superficie border-t border-borde p-4 flex items-center justify-between gap-4 md:static md:border-0 md:bg-transparent md:p-0">
          <p className="text-2xl font-bold">${total.toFixed(2)}</p>
          <Boton tamano="grande" className="flex-1 md:flex-none md:px-12" onClick={() => setModalCobroAbierto(true)}>
            Cobrar
          </Boton>
        </div>
      )}

      {productoGranelActivo && (
        <ModalCantidadGranel
          nombre={productoGranelActivo.nombre}
          unidad={productoGranelActivo.unidad}
          precio={Number(productoGranelActivo.precio)}
          cantidadInicial={cantidadGranelInicial}
          onConfirmar={confirmarGranel}
          onCerrar={() => setProductoGranelActivo(null)}
        />
      )}

      {modalCobroAbierto && (
        <ModalCobro
          total={total}
          onConfirmar={confirmarCobro}
          onCerrar={() => setModalCobroAbierto(false)}
          cobrando={cobrando}
          error={errorCobro}
        />
      )}
    </div>
  );
}
