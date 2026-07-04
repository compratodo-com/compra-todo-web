import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { CurrencyProvider } from "@/components/currency/CurrencySelector";
import { Providers } from "@/components/layout/Providers";
import { GoogleAnalytics } from "@/components/layout/GoogleAnalytics";
import { SITE_CONFIG, buildMetadata } from "@/lib/seo";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = buildMetadata({
  title: SITE_CONFIG.defaultTitle,
  description: SITE_CONFIG.defaultDescription,
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <head>
        {/* Schema.org WebSite */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: SITE_CONFIG.name,
              url: SITE_CONFIG.url,
              description: SITE_CONFIG.defaultDescription,
              potentialAction: {
                "@type": "SearchAction",
                target: `${SITE_CONFIG.url}/catalog?search={search_term_string}`,
                "query-input": "required name=search_term_string",
              },
            }),
          }}
        />
        {/* Favicon */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-50 min-h-screen flex flex-col`}
      >
        <GoogleAnalytics />
        <Providers>
          <CurrencyProvider>
            <Navbar />
            <main className="flex-1">{children}</main>
          </CurrencyProvider>
        </Providers>
        <Footer />
      </body>
    </html>
  );
}
