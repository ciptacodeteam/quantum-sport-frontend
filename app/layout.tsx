import AppProvider from '@/providers/AppProvider';
import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import '@/styles/globals.css';
import { cn } from '@/lib/utils';
import seoShareImage from '@/assets/img/imagebp.png';

const jakarta = Plus_Jakarta_Sans({
  variable: '--font-jakarta',
  subsets: ['latin'],
  display: 'swap'
});

// SEO utama website: ubah title, description, dan keywords di bagian ini.
const seoTitle = 'Black Padel | Booking Online Jadi Lebih Gampang Melalui Website';
const seoDescription =
  'Temukan pengalaman bermain padel yang menyenangkan bersama Black Padel. Hadir di 2 cabang di Medan, dengan kemudahan memilih jadwal dan booking lapangan secara online.';
// Domain mengikuti canonical website yang sudah digunakan sebelumnya.
const siteUrl = 'https://quantumsocialclub.id';
const shareImage = new URL(seoShareImage.src, siteUrl).toString();

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: 'Black Padel',
  title: seoTitle,
  description: seoDescription,
  keywords: [
    'black padel',
    'blackpadel',
    'black padel medan',
    'lapangan padel medan',
    'booking padel medan',
    'sewa lapangan padel medan',
    'padel medan',
    'booking lapangan padel',
    'tempat main padel medan',
    'booking padel online'
  ],
  alternates: { canonical: `${siteUrl}/` },
  openGraph: {
    title: seoTitle,
    description: seoDescription,
    url: `${siteUrl}/`,
    siteName: 'Black Padel',
    images: [
      {
        url: shareImage,
        width: seoShareImage.width,
        height: seoShareImage.height,
        alt: 'Black Padel — Booking Lapangan Padel di Medan'
      }
    ],
    locale: 'id_ID',
    type: 'website'
  },
  twitter: {
    card: 'summary_large_image',
    title: seoTitle,
    description: seoDescription,
    images: [shareImage]
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png'
  }
};

const structuredData = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': `${siteUrl}/#organization`,
      name: 'Black Padel',
      description: seoDescription,
      url: `${siteUrl}/`,
      areaServed: { '@type': 'City', name: 'Medan' },
      potentialAction: {
        '@type': 'ReserveAction',
        target: { '@type': 'EntryPoint', urlTemplate: `${siteUrl}/booking` },
        result: { '@type': 'Reservation', name: 'Booking Lapangan Padel' }
      }
    },
    {
      '@type': 'WebSite',
      '@id': `${siteUrl}/#website`,
      name: 'Black Padel',
      url: `${siteUrl}/`,
      description: seoDescription,
      inLanguage: 'id-ID',
      publisher: { '@id': `${siteUrl}/#organization` }
    }
  ]
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className={cn('font-sans antialiased', jakarta.variable)}>
        <AppProvider>{children}</AppProvider>

        <script
          id="json-ld-black-padel"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData).replace(/</g, '\\u003c')
          }}
        />
      </body>
    </html>
  );
}
