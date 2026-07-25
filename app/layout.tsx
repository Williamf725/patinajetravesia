import type { Metadata } from "next";
import { Anton, Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Background from "@/components/Background";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PageTransition from "@/components/PageTransition";
import CustomCursor from "@/components/CustomCursor";

const anton = Anton({
  weight: "400",
  variable: "--font-anton",
  subsets: ["latin"],
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: 'Travesía | Club de Patinaje y Tienda de Ropa Deportiva Colombia',
  description: 'Club de patinaje para adultos en Sogamoso + tienda online de ropa deportiva para patinaje. Camisetas, sudaderas y pantalones con envío a toda Colombia.',
  keywords: ['patinaje Colombia', 'ropa patinaje', 'club patinaje adultos', 'patinaje Sogamoso', 'ropa deportiva patinaje', 'sudaderas patinaje', 'camisetas patinaje Colombia'],
  icons: {
    icon: [
      { url: '/icon.png', sizes: '32x32', type: 'image/png' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
  },
  manifest: '/manifest.json',
  openGraph: {
    title: 'Travesía | Club de Patinaje y Tienda Colombia',
    description: 'Club de patinaje para adultos + tienda de ropa deportiva de patinaje en Colombia.',
    url: 'https://patinajetravesia.vercel.app',
    siteName: 'Travesía',
    images: [{ url: 'https://res.cloudinary.com/dvpnkr2i9/image/upload/v1784734270/40930-removebg-preview_bmvhkt.png', width: 800, height: 800 }],
    locale: 'es_CO',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Travesía | Club de Patinaje y Tienda Colombia',
    description: 'Club de patinaje para adultos + tienda de ropa deportiva de patinaje en Colombia.',
    images: ['https://res.cloudinary.com/dvpnkr2i9/image/upload/v1784734270/40930-removebg-preview_bmvhkt.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${anton.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable}`}>
      <body className="antialiased min-h-screen selection:bg-neon-green selection:text-black bg-black">
        <CustomCursor />
        <Background />
        <Navbar />
        <main className="relative z-0 pt-20">
          <PageTransition>
            {children}
          </PageTransition>
        </main>
        <Footer />
      </body>
    </html>
  );
}
