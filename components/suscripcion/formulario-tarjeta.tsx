"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";
import { Campo } from "@/components/ui/input";
import { Boton } from "@/components/ui/button";

interface CampoSeguro {
  mount: (contenedorId: string) => CampoSeguro;
}

interface ClienteMercadoPago {
  fields: {
    create: (tipo: string, opciones: Record<string, unknown>) => CampoSeguro;
    createCardToken: (datos: Record<string, string>) => Promise<{ id: string }>;
  };
}

declare global {
  interface Window {
    MercadoPago?: new (
      publicKey: string,
      opciones?: { locale?: string }
    ) => ClienteMercadoPago;
  }
}

const PUBLIC_KEY = process.env.NEXT_PUBLIC_MP_PUBLIC_KEY;

// Colores literales (no variables CSS: los "Secure Fields" son iframes de
// Mercado Pago, no leen el CSS de esta página).
const ESTILO_CAMPO_SEGURO = {
  fontSize: "18px",
  color: "#211f1a",
  placeholderColor: "#5f5b52",
};

const CLASE_CONTENEDOR_SEGURO =
  "px-4 py-3 min-h-12 rounded-xl border-2 border-borde-fuerte bg-superficie";

function mensajeErrorTarjeta(error: unknown): string {
  const causas = (error as { cause?: { code?: string; description?: string }[] })?.cause;
  if (Array.isArray(causas) && causas.length > 0) {
    return (
      causas.map((c) => c.description).filter(Boolean).join(". ") || "Revisa los datos de tu tarjeta."
    );
  }
  return "No pudimos validar tu tarjeta. Revisa los datos e intenta de nuevo.";
}

export function FormularioTarjeta({
  correoInicial,
  onAutorizada,
}: {
  correoInicial: string;
  onAutorizada: () => void;
}) {
  const [sdkListo, setSdkListo] = useState(false);
  const mpRef = useRef<ClienteMercadoPago | null>(null);
  const camposMontados = useRef(false);

  const [correo, setCorreo] = useState(correoInicial);
  const [nombreTitular, setNombreTitular] = useState("");
  // "RFC" precargado: es el tipo de identificación más común en México y
  // Mercado Pago parece necesitarlo para autorizar el cobro (aunque el
  // formulario lo marque como "opcional"). Se deja editable por si el
  // titular necesita otro tipo (CURP, pasaporte, etc.).
  const [tipoIdentificacion, setTipoIdentificacion] = useState("RFC");
  const [numeroIdentificacion, setNumeroIdentificacion] = useState("");

  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");

  // El <Script> de Next solo avisa onLoad la primera vez que el script se
  // inyecta en la página; si ya estaba cargado (vuelta a esta pantalla) no
  // vuelve a dispararse. Se revisa directo si window.MercadoPago existe.
  useEffect(() => {
    const intervalo = setInterval(() => {
      if (window.MercadoPago) {
        setSdkListo(true);
        clearInterval(intervalo);
      }
    }, 200);
    return () => clearInterval(intervalo);
  }, []);

  useEffect(() => {
    if (!sdkListo || !PUBLIC_KEY || !window.MercadoPago || camposMontados.current) return;
    camposMontados.current = true;

    const cliente = new window.MercadoPago(PUBLIC_KEY, { locale: "es-MX" });
    mpRef.current = cliente;

    // Número de tarjeta, vencimiento y CVV se capturan en "Secure Fields":
    // iframes que controla Mercado Pago directamente, para que esos datos
    // nunca pasen por el código de esta página (cumplimiento PCI). Por eso
    // no hay estado de React para esos tres valores.
    cliente.fields
      .create("cardNumber", { placeholder: "0000 0000 0000 0000", style: ESTILO_CAMPO_SEGURO })
      .mount("mp-numero-tarjeta");
    cliente.fields
      .create("expirationDate", { placeholder: "MM/AA", style: ESTILO_CAMPO_SEGURO })
      .mount("mp-vencimiento");
    cliente.fields
      .create("securityCode", { placeholder: "CVV", style: ESTILO_CAMPO_SEGURO })
      .mount("mp-cvv");
  }, [sdkListo]);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const mp = mpRef.current;
    if (!mp) {
      setError("No se pudo cargar Mercado Pago. Recarga la página e intenta de nuevo.");
      return;
    }
    if (!correo.trim()) {
      setError("Escribe un correo para continuar");
      return;
    }
    if (!tipoIdentificacion.trim() || !numeroIdentificacion.trim()) {
      setError("Escribe tu identificación (RFC, CURP u otra)");
      return;
    }

    setEnviando(true);
    try {
      const datosToken: Record<string, string> = {
        cardholderName: nombreTitular.trim(),
        identificationType: tipoIdentificacion.trim(),
        identificationNumber: numeroIdentificacion.trim(),
      };

      let token;
      try {
        token = await mp.fields.createCardToken(datosToken);
      } catch (errToken) {
        setError(`[Al generar el token] ${mensajeErrorTarjeta(errToken)}`);
        return;
      }

      const respuesta = await fetch("/api/suscripcion/crear", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ correo: correo.trim(), cardTokenId: token.id }),
      });
      const datos = await respuesta.json();
      if (!respuesta.ok) {
        setError(`[Al crear la suscripción] ${datos.error ?? "No se pudo activar la suscripción"}`);
        return;
      }
      onAutorizada();
    } catch (err) {
      setError(mensajeErrorTarjeta(err));
    } finally {
      setEnviando(false);
    }
  }

  if (!PUBLIC_KEY) {
    return (
      <p className="text-peligro text-sm text-center">
        Falta configurar NEXT_PUBLIC_MP_PUBLIC_KEY (Public Key de Mercado Pago).
      </p>
    );
  }

  return (
    <>
      <Script
        src="https://sdk.mercadopago.com/js/v2"
        strategy="afterInteractive"
        onLoad={() => setSdkListo(true)}
      />
      <form onSubmit={enviar} className="flex flex-col gap-3">
        <Campo
          etiqueta="Correo"
          type="email"
          value={correo}
          onChange={(e) => setCorreo(e.target.value)}
          required
        />

        <div className="flex flex-col gap-1.5">
          <label className="text-base font-medium text-texto">Número de tarjeta</label>
          <div id="mp-numero-tarjeta" className={CLASE_CONTENEDOR_SEGURO} />
        </div>

        <Campo
          etiqueta="Nombre del titular (como aparece en la tarjeta)"
          autoComplete="cc-name"
          value={nombreTitular}
          onChange={(e) => setNombreTitular(e.target.value)}
          required
        />

        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col gap-1.5">
            <label className="text-base font-medium text-texto">Vencimiento (MM/AA)</label>
            <div id="mp-vencimiento" className={CLASE_CONTENEDOR_SEGURO} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-base font-medium text-texto">CVV</label>
            <div id="mp-cvv" className={CLASE_CONTENEDOR_SEGURO} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Campo
            etiqueta="Tipo de identificación"
            placeholder="RFC, CURP, etc."
            value={tipoIdentificacion}
            onChange={(e) => setTipoIdentificacion(e.target.value)}
            required
          />
          <Campo
            etiqueta="Número de identificación"
            value={numeroIdentificacion}
            onChange={(e) => setNumeroIdentificacion(e.target.value)}
            required
          />
        </div>

        {error && <p className="text-peligro font-medium text-sm text-center">{error}</p>}

        <Boton type="submit" tamano="grande" disabled={enviando || !sdkListo}>
          {enviando ? "Procesando…" : !sdkListo ? "Cargando…" : "Confirmar suscripción"}
        </Boton>
      </form>
    </>
  );
}
