import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: '1vs1 FutDraft',
  description: 'Crea, compara y comparte alineaciones de fútbol.',
  openGraph: {
    title: '1vs1 FutDraft',
    description: 'Crea, compara y comparte alineaciones de fútbol profesional.',
    url: 'https://1vs1-futdraft.vercel.app/',
    siteName: '1vs1 FutDraft',
    images: [
      {
        url: 'https://ik.imagekit.io/mdjzw07s9/Capturas/paginaPrincipal.png',
        width: 1200,
        height: 630,
        alt: 'Página principal de 1vs1 FutDraft',
      },
    ],
    locale: 'es_ES',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: '1vs1 FutDraft',
    description: 'Crea, compara y comparte alineaciones de fútbol profesional.',
    images: ['https://ik.imagekit.io/mdjzw07s9/Capturas/paginaPrincipal.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Raleway:ital,wght@0,100..900;1,100..900&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
