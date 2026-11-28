import type { Metadata } from "next";
import Script from "next/script";
import { Geist, Geist_Mono, Playfair_Display } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Providers } from "@/components/party/providers";
import { FIREBASE_GA_ID } from "@/lib/firebase";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const playfairDisplay = Playfair_Display({
  variable: "--font-playfair-display",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Partido Missão por Altávia (PMA) — República de Altávia",
  description:
    "Site oficial do Partido Missão por Altávia, o maior partido da República de Altávia — micronação lusófona soberana e independente. Programa Altávia 2027, escola virtual Sala Altávia, notícias e filiação.",
  keywords: [
    "Partido Missão por Altávia",
    "PMA",
    "República de Altávia",
    "micronação",
    "Altávia 2027",
    "Sala Altávia",
    "filiação",
  ],
  icons: {
    icon: "/logo-pma.png",
  },
  openGraph: {
    title: "Partido Missão por Altávia (PMA)",
    description:
      "O maior partido da República de Altávia. Programa Altávia 2027 e a escola virtual Sala Altávia.",
    siteName: "Partido Missão por Altávia",
    locale: "pt_BR",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${playfairDisplay.variable} font-sans antialiased bg-background text-foreground`}
      >
        <Providers>{children}</Providers>
        <Toaster />
        {/* Firebase Analytics — Google Analytics do projeto texnk-87824,
            carregado via gtag.js com o measurementId do Firebase. */}
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${FIREBASE_GA_ID}`}
          strategy="afterInteractive"
        />
        <Script id="firebase-gtag-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag() {
              dataLayer.push(arguments);
            }
            gtag("js", new Date());
            gtag("config", "${FIREBASE_GA_ID}");
          `}
        </Script>
      </body>
    </html>
  );
}
