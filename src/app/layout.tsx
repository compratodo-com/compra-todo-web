import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { CurrencyProvider } from "@/components/currency/CurrencySelector";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Compra-Todo — Simulador de compras",
  description:
    "El simulador de compras más realista de Chile. Navega, compra y recibe tus pedidos... todo simulado. ¿Te atreves?",
  keywords: ["simulador", "compras", "juego", "chile", "falabella", "mercado libre"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-50 min-h-screen flex flex-col`}
      >
        <CurrencyProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
        </CurrencyProvider>
        <Footer />
      </body>
    </html>
  );
}
