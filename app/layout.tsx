import AppProvider from '@/providers/AppProvider';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '@/styles/globals.css';
import { cn } from '@/lib/utils';

import Script from 'next/script';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin']
});

export const metadata: Metadata = {
  title: 'Quantum Sport & Social Club - Booking Lapangan Online Mudah, Cepat & Terpercaya',
  description:
    'Booking lapangan olahraga kini lebih praktis di Quantum Sport. Cek jadwal, pilih lapangan, dan pesan secara online dalam hitungan detik. Mudah, cepat, aman, dan tanpa ribet!',

  keywords: [
    'pxdl',
    'komunitas padel',
    'quantum padel',
    'lapngan quantum',
    'Quantum social club',
    'padel medan',
    'padel',
    'booking lapangan padel',
    'lapangan tennis',
    'lapangan padel medan',
    'lapangan padel',
    'booking lapangan online',
    'sewa lapangan olahraga',
    'booking badminton online',
    'Quantum Sport',
    'lapangan olahraga terdekat',
    'booking lapangan cepat'
  ],

  alternates: {
    canonical: 'https://quantumsocialclub.id/'
  },

  openGraph: {
    title: 'Quantum Sport & Social Club - Booking Lapangan Online Mudah, Cepat & Terpercaya',
    description:
      'Pesan lapangan olahraga favoritmu secara online dengan mudah, cepat, dan aman hanya di Quantum Sport.',
    url: 'https://quantumsocialclub.id/',
    siteName: 'Quantum Sport and Social Club',
    images: [
      {
        url: 'https://quantumsocialclub.id/assets/img/og-image.webp',
        width: 1200,
        height: 1200,
        alt: 'Quantum Sport - Booking Lapangan Online'
      }
    ],
    locale: 'id_ID',
    type: 'website'
  },

  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png'
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className={cn('antialiased', inter.variable)}>
        <AppProvider>{children}</AppProvider>

        {/* ✅ JSON-LD Structured Data */}
        <Script
          id="json-ld-quantum-sport"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'SportsActivityLocation',
              name: 'Quantum Sport & Social Club',
              description:
                'Fasilitas olahraga untuk booking lapangan secara online dengan mudah, cepat, dan aman.',
              url: 'https://quantumsocialclub.id/',
              image: 'https://quantumsocialclub.id/assets/img/og-image.webp',
              logo: 'https://quantumsocialclub.id/assets/img/og-image.webp',
              address: {
                '@type': 'PostalAddress',
                addressCountry: 'ID',
                addressRegion: 'Indonesia'
              },
              openingHoursSpecification: [
                {
                  '@type': 'OpeningHoursSpecification',
                  dayOfWeek: [
                    'Monday',
                    'Tuesday',
                    'Wednesday',
                    'Thursday',
                    'Friday',
                    'Saturday',
                    'Sunday'
                  ],
                  opens: '06:00',
                  closes: '00:00'
                }
              ],
              potentialAction: {
                '@type': 'ReserveAction',
                target: {
                  '@type': 'EntryPoint',
                  urlTemplate: 'https://quantumsocialclub.id/booking'
                },
                result: {
                  '@type': 'Reservation',
                  name: 'Booking Lapangan Olahraga'
                }
              }
            })
          }}
        />
      </body>
    </html>
  );
}
