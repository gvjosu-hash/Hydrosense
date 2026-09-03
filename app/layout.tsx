import type { Metadata } from "next";
import { Geist, Geist_Mono, Fraunces } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/ui/toast";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Serif elegante para títulos y marca; el resto de la interfaz se queda en
// Geist Sans (más legible en pantallas chicas para precios, botones, etc.).
const fraunces = Fraunces({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "Xolo · Punto de venta para cualquier negocio",
  description:
    "Xolo es el punto de venta para cualquier negocio: cobra, controla tu inventario y cierra tu caja sin complicaciones.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-fondo text-texto">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
