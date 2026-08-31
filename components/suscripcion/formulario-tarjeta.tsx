"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";
import { Campo } from "@/components/ui/input";
import { Selector } from "@/components/ui/select";
import { Boton } from "@/components/ui/button";

interface TipoIdentificacion {
  id: string;
  name: string;
}

interface ClienteMercadoPago {
  getIdentificationTypes: () => Promise<TipoIdentificacion[]>;
  createCardToken: (datos: Record<string, string>) => Promise<{ id: string }>;
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

function mensajeErrorTarjeta(error: unknown): string {
  const causas = (error as { cause?: { code?: string; description?: string }[] })?.cause;
  if (Array.isArray(causas) && causas.length > 0) {
    return causas.map((c) => c.description).filter(Boolean).join(". ") || "Revisa los datos de tu tarjeta.";
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
  const [tiposIdentificacion, setTiposIdentificacion] = useState<TipoIdentificacion[]>([]);
  const [identificacionNoDisponible, setIdentificacionNoDisponible] = useState(false);

  const [correo, setCorreo] = useState(correoInicial);
  const [numeroTarjeta, setNumeroTarjeta] = useState("");
  const [nombreTitular, setNombreTitular] = useState("");
  const [mesVencimiento, setMesVencimiento] = useState("");
  const [anioVencimiento, setAnioVencimiento] = useState("");
  const [cvv, setCvv] = useState("");
  const [tipoIdentificacion, setTipoIdentificacion] = useState("");
  const [numeroIdentificacion, setNumeroIdentificacion] = useState("");

  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");

  // El <Script> de Next solo avisa onLoad la primera vez que el script se
  // inyecta en la página. Si el usuario ya había cargado esta pantalla antes
  // (el script sigue en el navegador) o navega de regreso, onLoad nunca
  // vuelve a dispararse y el formulario se queda en "Cargando..." para
  // siempre. Este efecto revisa directamente si window.MercadoPago ya
  // existe (o va apareciendo) sin depender de ese evento.
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
    if (!sdkListo || !PUBLIC_KEY || !window.MercadoPago) return;
    const cliente = new window.MercadoPago(PUBLIC_KEY, { locale: "es-MX" });
    mpRef.current = cliente;
    cliente
      .getIdentificationTypes()
      .then((tipos) => {
        setTiposIdentificacion(tipos);
        if (tipos[0]) setTipoIdentificacion(tipos[0].id);
      })
      .catch(() => {
        setIdentificacionNoDisponible(true);
      });
    // Si en unos segundos no llegó respuesta, se deja de mostrar "Cargando…"
    // (es un campo opcional, no debe parecer trabado para siempre).
    const limite = setTimeout(() => setIdentificacionNoDisponible(true), 6000);
    return () => clearTimeout(limite);
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

    setEnviando(true);
    try {
      // La tarjeta física trae el año en 2 dígitos (ej. "33"); Mercado Pago
      // necesita el año completo (2033), si no la tokenización falla.
      const anioLimpio = anioVencimiento.trim();
      const anioCompleto = anioLimpio.length === 2 ? `20${anioLimpio}` : anioLimpio;

      const datosTarjeta: Record<string, string> = {
        cardNumber: numeroTarjeta.replace(/\s+/g, ""),
        cardholderName: nombreTitular.trim(),
        cardExpirationMonth: mesVencimiento.trim(),
        cardExpirationYear: anioCompleto,
        securityCode: cvv.trim(),
      };
      // Si el tipo de identificación no cargó, se manda el token sin esos
      // campos en vez de mandarlos vacíos (que Mercado Pago sí rechaza).
      if (tipoIdentificacion && numeroIdentificacion.trim()) {
        datosTarjeta.identificationType = tipoIdentificacion;
        datosTarjeta.identificationNumber = numeroIdentificacion.trim();
      }

      const token = await mp.createCardToken(datosTarjeta);

      const respuesta = await fetch("/api/suscripcion/crear", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ correo: correo.trim(), cardTokenId: token.id }),
      });
      const datos = await respuesta.json();
      if (!respuesta.ok) {
        setError(datos.error ?? "No se pudo activar la suscripción");
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
        <Campo
          etiqueta="Número de tarjeta"
          inputMode="numeric"
          autoComplete="cc-number"
          value={numeroTarjeta}
          onChange={(e) => setNumeroTarjeta(e.target.value)}
          required
        />
        <Campo
          etiqueta="Nombre del titular (como aparece en la tarjeta)"
          autoComplete="cc-name"
          value={nombreTitular}
          onChange={(e) => setNombreTitular(e.target.value)}
          required
        />
        <div className="grid grid-cols-3 gap-2">
          <Campo
            etiqueta="Mes (MM)"
            inputMode="numeric"
            maxLength={2}
            autoComplete="cc-exp-month"
            value={mesVencimiento}
            onChange={(e) => setMesVencimiento(e.target.value)}
            required
          />
          <Campo
            etiqueta="Año (AA)"
            inputMode="numeric"
            maxLength={4}
            autoComplete="cc-exp-year"
            value={anioVencimiento}
            onChange={(e) => setAnioVencimiento(e.target.value)}
            required
          />
          <Campo
            etiqueta="CVV"
            inputMode="numeric"
            maxLength={4}
            autoComplete="cc-csc"
            value={cvv}
            onChange={(e) => setCvv(e.target.value)}
            required
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Selector
            etiqueta="Identificación (opcional)"
            value={tipoIdentificacion}
            onChange={(e) => setTipoIdentificacion(e.target.value)}
          >
            {tiposIdentificacion.length === 0 && (
              <option value="">{identificacionNoDisponible ? "No disponible" : "Cargando…"}</option>
            )}
            {tiposIdentificacion.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </Selector>
          <Campo
            etiqueta="Número (opcional)"
            value={numeroIdentificacion}
            onChange={(e) => setNumeroIdentificacion(e.target.value)}
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
