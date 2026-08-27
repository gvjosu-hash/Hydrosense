"use client";

import { useCallback, useEffect, useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Boton } from "@/components/ui/button";
import { Campo } from "@/components/ui/input";
import { TecladoNumerico } from "@/components/pos/teclado-numerico";

interface ClienteResumen {
  id: string;
  nombre: string;
  whatsapp: string | null;
  saldoPendiente: string;
}

export type ResultadoCobro =
  | { metodoPago: "EFECTIVO"; montoRecibido: number }
  | {
      metodoPago: "TARJETA";
      montoRecibido: number;
      tipoTarjeta: "CREDITO" | "DEBITO";
      numeroAutorizacion: string;
    }
  | { metodoPago: "FIADO"; clienteId: string };

export function ModalCobro({
  total,
  onConfirmar,
  onCerrar,
  cobrando,
  error,
}: {
  total: number;
  onConfirmar: (resultado: ResultadoCobro) => void;
  onCerrar: () => void;
  cobrando?: boolean;
  error?: string;
}) {
  const [metodo, setMetodo] = useState<"EFECTIVO" | "TARJETA" | "FIADO">("EFECTIVO");

  const [valor, setValor] = useState("");
  const montoRecibido = parseFloat(valor || "0");
  const cambio = montoRecibido - total;
  const alcanza = montoRecibido >= total;

  const [valorTarjeta, setValorTarjeta] = useState(() => total.toFixed(2));
  const montoTarjeta = parseFloat(valorTarjeta || "0");
  const [tipoTarjeta, setTipoTarjeta] = useState<"CREDITO" | "DEBITO">("CREDITO");
  const [numeroAutorizacion, setNumeroAutorizacion] = useState("");

  const [busquedaCliente, setBusquedaCliente] = useState("");
  const [clientes, setClientes] = useState<ClienteResumen[]>([]);
  const [clienteSeleccionado, setClienteSeleccionado] = useState<ClienteResumen | null>(null);
  const [mostrarNuevoCliente, setMostrarNuevoCliente] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState("");
  const [nuevoWhatsapp, setNuevoWhatsapp] = useState("");
  const [creandoCliente, setCreandoCliente] = useState(false);
  const [errorCliente, setErrorCliente] = useState("");

  const buscarClientes = useCallback(async (texto: string) => {
    if (!texto.trim()) {
      setClientes([]);
      return;
    }
    const respuesta = await fetch(`/api/clientes?buscar=${encodeURIComponent(texto)}`);
    const datos = await respuesta.json();
    setClientes(datos.clientes ?? []);
  }, []);

  useEffect(() => {
    const temporizador = setTimeout(() => buscarClientes(busquedaCliente), 250);
    return () => clearTimeout(temporizador);
  }, [busquedaCliente, buscarClientes]);

  async function crearCliente() {
    setCreandoCliente(true);
    setErrorCliente("");
    try {
      const respuesta = await fetch("/api/clientes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre: nuevoNombre, whatsapp: nuevoWhatsapp }),
      });
      const datos = await respuesta.json();
      if (!respuesta.ok) {
        setErrorCliente(datos.error ?? "No se pudo crear el cliente");
        return;
      }
      setClienteSeleccionado({ ...datos.cliente, saldoPendiente: "0" });
      setMostrarNuevoCliente(false);
      setNuevoNombre("");
      setNuevoWhatsapp("");
    } finally {
      setCreandoCliente(false);
    }
  }

  function confirmar() {
    if (metodo === "EFECTIVO") {
      onConfirmar({ metodoPago: "EFECTIVO", montoRecibido });
    } else if (metodo === "TARJETA") {
      onConfirmar({
        metodoPago: "TARJETA",
        montoRecibido: montoTarjeta,
        tipoTarjeta,
        numeroAutorizacion: numeroAutorizacion.trim(),
      });
    } else if (clienteSeleccionado) {
      onConfirmar({ metodoPago: "FIADO", clienteId: clienteSeleccionado.id });
    }
  }

  const puedeConfirmar =
    metodo === "EFECTIVO"
      ? alcanza
      : metodo === "TARJETA"
      ? montoTarjeta > 0 && numeroAutorizacion.trim().length > 0
      : !!clienteSeleccionado;

  return (
    <Modal titulo="Cobrar" onCerrar={onCerrar}>
      <div className="flex flex-col gap-4">
        <p className="text-center text-2xl">
          Total: <span className="font-bold">${total.toFixed(2)}</span>
        </p>

        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => setMetodo("EFECTIVO")}
            className={`min-h-12 rounded-xl border-2 font-semibold cursor-pointer ${
              metodo === "EFECTIVO"
                ? "border-acento bg-acento-suave text-acento-fuerte"
                : "border-borde-fuerte text-texto-suave"
            }`}
          >
            Efectivo
          </button>
          <button
            type="button"
            onClick={() => setMetodo("TARJETA")}
            className={`min-h-12 rounded-xl border-2 font-semibold cursor-pointer ${
              metodo === "TARJETA"
                ? "border-acento bg-acento-suave text-acento-fuerte"
                : "border-borde-fuerte text-texto-suave"
            }`}
          >
            Tarjeta
          </button>
          <button
            type="button"
            onClick={() => setMetodo("FIADO")}
            className={`min-h-12 rounded-xl border-2 font-semibold cursor-pointer ${
              metodo === "FIADO"
                ? "border-acento bg-acento-suave text-acento-fuerte"
                : "border-borde-fuerte text-texto-suave"
            }`}
          >
            Fiado
          </button>
        </div>

        {metodo === "EFECTIVO" ? (
          <>
            <div className="text-center">
              <p className="text-texto-suave">Efectivo recibido</p>
              <p className="text-4xl font-bold tabular-nums">${valor || "0"}</p>
            </div>

            <TecladoNumerico valor={valor} onCambiar={setValor} />

            <div
              className={`rounded-xl p-3 text-center text-xl font-bold ${
                alcanza ? "bg-ok-suave text-ok" : "bg-alerta-suave text-alerta"
              }`}
            >
              {alcanza ? `Cambio: $${cambio.toFixed(2)}` : "Falta efectivo"}
            </div>
          </>
        ) : metodo === "TARJETA" ? (
          <div className="flex flex-col gap-3">
            <div className="text-center">
              <p className="text-texto-suave">Monto cobrado en la terminal</p>
              <p className="text-4xl font-bold tabular-nums">${valorTarjeta || "0"}</p>
            </div>

            <TecladoNumerico valor={valorTarjeta} onCambiar={setValorTarjeta} />

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setTipoTarjeta("CREDITO")}
                className={`min-h-12 rounded-xl border-2 font-semibold cursor-pointer ${
                  tipoTarjeta === "CREDITO"
                    ? "border-acento bg-acento-suave text-acento-fuerte"
                    : "border-borde-fuerte text-texto-suave"
                }`}
              >
                Crédito
              </button>
              <button
                type="button"
                onClick={() => setTipoTarjeta("DEBITO")}
                className={`min-h-12 rounded-xl border-2 font-semibold cursor-pointer ${
                  tipoTarjeta === "DEBITO"
                    ? "border-acento bg-acento-suave text-acento-fuerte"
                    : "border-borde-fuerte text-texto-suave"
                }`}
              >
                Débito
              </button>
            </div>

            <Campo
              etiqueta="Número de autorización"
              placeholder="Del voucher que imprime la terminal"
              value={numeroAutorizacion}
              onChange={(e) => setNumeroAutorizacion(e.target.value)}
              autoFocus
            />
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {!clienteSeleccionado ? (
              <>
                <Campo
                  placeholder="Buscar cliente por nombre"
                  value={busquedaCliente}
                  onChange={(e) => setBusquedaCliente(e.target.value)}
                />
                {clientes.length > 0 && (
                  <div className="flex flex-col gap-1 max-h-48 overflow-y-auto">
                    {clientes.map((cliente) => (
                      <button
                        key={cliente.id}
                        onClick={() => setClienteSeleccionado(cliente)}
                        className="flex items-center justify-between px-3 py-3 rounded-xl border-2 border-borde-fuerte hover:bg-black/5 cursor-pointer text-left"
                      >
                        <span className="font-medium">{cliente.nombre}</span>
                        <span className="text-texto-suave text-sm">
                          Debe ${Number(cliente.saldoPendiente).toFixed(2)}
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {!mostrarNuevoCliente ? (
                  <Boton variante="secundario" onClick={() => setMostrarNuevoCliente(true)}>
                    + Nuevo cliente
                  </Boton>
                ) : (
                  <div className="flex flex-col gap-3 border-t border-borde pt-3">
                    <Campo
                      etiqueta="Nombre del cliente"
                      value={nuevoNombre}
                      onChange={(e) => setNuevoNombre(e.target.value)}
                      autoFocus
                    />
                    <Campo
                      etiqueta="WhatsApp (opcional)"
                      placeholder="55 1234 5678"
                      value={nuevoWhatsapp}
                      onChange={(e) => setNuevoWhatsapp(e.target.value)}
                    />
                    {errorCliente && <p className="text-peligro font-medium text-sm">{errorCliente}</p>}
                    <div className="flex gap-2">
                      <Boton
                        variante="secundario"
                        className="flex-1"
                        onClick={() => setMostrarNuevoCliente(false)}
                      >
                        Cancelar
                      </Boton>
                      <Boton
                        className="flex-1"
                        disabled={creandoCliente || nuevoNombre.trim().length < 2}
                        onClick={crearCliente}
                      >
                        {creandoCliente ? "Creando..." : "Crear"}
                      </Boton>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="rounded-xl border-2 border-acento bg-acento-suave p-4 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold truncate">{clienteSeleccionado.nombre}</p>
                  <p className="text-sm text-acento-fuerte">
                    Ya debe ${Number(clienteSeleccionado.saldoPendiente).toFixed(2)} + esta venta
                  </p>
                </div>
                <button
                  onClick={() => setClienteSeleccionado(null)}
                  className="text-acento font-semibold shrink-0 cursor-pointer"
                >
                  Cambiar
                </button>
              </div>
            )}
          </div>
        )}

        {error && <p className="text-peligro font-medium text-center">{error}</p>}

        <div className="flex gap-3">
          <Boton variante="secundario" className="flex-1" onClick={onCerrar}>
            Cancelar
          </Boton>
          <Boton className="flex-1" disabled={!puedeConfirmar || cobrando} onClick={confirmar}>
            {cobrando
              ? "Cobrando..."
              : metodo === "FIADO"
              ? "Registrar fiado"
              : "Confirmar cobro"}
          </Boton>
        </div>
      </div>
    </Modal>
  );
}
