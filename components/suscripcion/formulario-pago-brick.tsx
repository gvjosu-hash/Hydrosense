"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";

declare global {
  interface Window {
    MercadoPago?: new (
      publicKey: string,
      opciones?: { locale?: string }
    ) => {
      bricks: () => {
        create: (
          tipo: string,
          contenedorId: string,
          settings: Record<string, unknown>
        ) => Promise<{ unmount: () => void }>;
      };
    };
  }
}

type FormDataPaymentBrick = {
  token: string;
};

export function FormularioPagoBrick({
  correo,
  monto,
  onExito,
}: {
  correo: string;
  monto: number;
  onExito: () => void;
}) {
  const contenedorRef = useRef<HTMLDivElement>(null);
  const controladorRef = useRef<{ unmount: () => void } | null>(null);
  const [sdkListo, setSdkListo] = useState(false);
  const [error, setError] = useState("");
  const [montado, setMontado] = useState(false);
  const clavePublica = process.env.NEXT_PUBLIC_MP_PUBLIC_KEY;

  useEffect(() => {
    if (sdkListo) return;
    const intervalo = setInterval(() => {
      if (window.MercadoPago) {
        setSdkListo(true);
        clearInterval(intervalo);
      }
    }, 200);
    return () => clearInterval(intervalo);
  }, [sdkListo]);

  useEffect(() => {
    if (!sdkListo || montado || !clavePublica) return;
    if (!window.MercadoPago) return;

    let cancelado = false;
    const mp = new window.MercadoPago(clavePublica, { locale: "es-MX" });
    const bricksBuilder = mp.bricks();

    bricksBuilder
      .create("payment", "xolo-payment-brick", {
        initialization: {
          amount: monto,
        },
        customization: {
          visual: { style: { theme: "default" } },
          paymentMethods: {
            creditCard: "all",
            debitCard: "all",
            maxInstallments: 1,
            // Solo tarjeta: el token va a una suscripción (PreApproval), que
            // no admite efectivo, transferencia ni el monedero de MP.
            mercadoPago: "hidden",
            ticket: "hidden",
            bankTransfer: "hidden",
            atm: "hidden",
          },
        },
        callbacks: {
          onReady: () => {
            if (!cancelado) setMontado(true);
          },
          onError: () => {
            if (!cancelado) setError("No se pudo cargar el formulario de pago");
          },
          onSubmit: ({ formData }: { formData: FormDataPaymentBrick }) => {
            return new Promise<void>((resolve, reject) => {
              fetch("/api/suscripcion/crear", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  cardTokenId: formData.token,
                  correo: correo || undefined,
                }),
              })
                .then(async (respuesta) => {
                  const datos = await respuesta.json().catch(() => ({}));
                  if (!respuesta.ok) {
                    reject(new Error(datos.error ?? "No se pudo autorizar la tarjeta"));
                    return;
                  }
                  resolve();
                  onExito();
                })
                .catch((err) => reject(err));
            });
          },
        },
      })
      .then((controlador) => {
        if (cancelado) {
          controlador.unmount();
          return;
        }
        controladorRef.current = controlador;
      })
      .catch(() => {
        if (!cancelado) setError("No se pudo cargar el formulario de pago");
      });

    return () => {
      cancelado = true;
      controladorRef.current?.unmount();
      controladorRef.current = null;
    };
  }, [sdkListo, montado, clavePublica, correo, monto, onExito]);

  if (!clavePublica) {
    return (
      <p className="text-peligro font-medium text-center text-sm">
        Falta configurar la llave pública de Mercado Pago
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <Script src="https://sdk.mercadopago.com/js/v2" strategy="afterInteractive" />
      {error && <p className="text-peligro font-medium text-center text-sm">{error}</p>}
      {!montado && !error && (
        <p className="text-texto-suave text-center text-sm">Cargando formulario de pago...</p>
      )}
      <div id="xolo-payment-brick" ref={contenedorRef} />
    </div>
  );
}
