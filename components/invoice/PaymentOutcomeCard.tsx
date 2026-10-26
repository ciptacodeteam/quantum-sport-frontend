'use client';

import { motion, useReducedMotion } from 'motion/react';
import { CircleAlert, Clock3, X } from 'lucide-react';
import type { ReactNode } from 'react';

const messages: Record<string, { title: string; description: string }> = {
  PAID: {
    title: 'Pembayaran berhasil',
    description: 'Pembayaran Anda telah dikonfirmasi. Detail transaksi tersedia di bawah ini.'
  },
  FAILED: {
    title: 'Pembayaran gagal',
    description:
      'Pembayaran belum berhasil diselesaikan. Periksa detail transaksi sebelum mencoba kembali.'
  },
  EXPIRED: {
    title: 'Waktu pembayaran habis',
    description: 'Batas waktu pembayaran sudah berakhir. Silakan buat pemesanan baru.'
  },
  CANCELLED: {
    title: 'Pembayaran dibatalkan',
    description: 'Transaksi ini telah dibatalkan. Anda dapat memilih jadwal atau paket lainnya.'
  },
  PENDING: {
    title: 'Menunggu konfirmasi',
    description:
      'Pembayaran belum dikonfirmasi. Periksa kembali status invoice sebelum melakukan pembayaran ulang.'
  },
  UNKNOWN: {
    title: 'Status belum dapat diperiksa',
    description:
      'Kami belum dapat memuat status pembayaran. Silakan cek kembali melalui detail invoice.'
  },
  MISSING: {
    title: 'Referensi pembayaran tidak ditemukan',
    description: 'Buka riwayat untuk melihat invoice dan status pembayaran Anda.'
  }
};

export default function PaymentOutcomeCard({
  status,
  title,
  description,
  children
}: {
  status: string;
  title?: string;
  description?: string;
  children?: ReactNode;
}) {
  const reduceMotion = useReducedMotion();
  const paid = status === 'PAID';
  const message = messages[status] ?? messages.UNKNOWN;
  return (
    <motion.section
      role="status"
      aria-live="polite"
      initial={reduceMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="overflow-hidden border border-black/15 bg-[#f8f8f6] px-6 py-9 text-center sm:px-10 sm:py-12"
    >
      <div className="relative mx-auto mb-6 flex size-20 items-center justify-center">
        {paid &&
          !reduceMotion &&
          Array.from({ length: 8 }, (_, i) => {
            const angle = (i * Math.PI) / 4;
            return (
              <motion.span
                key={i}
                aria-hidden="true"
                className="absolute h-1 w-2 bg-[#ad422b]"
                initial={{ x: 0, y: 0, opacity: 0 }}
                animate={{
                  x: [Math.cos(angle) * 20, Math.cos(angle) * 32, Math.cos(angle) * 48],
                  y: [Math.sin(angle) * 20, Math.sin(angle) * 32, Math.sin(angle) * 48],
                  opacity: [0, 1, 0],
                  rotate: i * 45
                }}
                transition={{ duration: 0.75, delay: 0.25, times: [0, 0.3, 1] }}
              />
            );
          })}
        <motion.div
          initial={reduceMotion ? false : { scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 220, damping: 18 }}
          className="relative flex size-16 items-center justify-center border border-[#ad422b]/25 bg-[#ad422b]/5 text-[#ad422b]"
        >
          {paid ? (
            <svg viewBox="0 0 32 32" className="size-9" fill="none" aria-hidden="true">
              <motion.path
                d="M7 16.5 13 22l12-13"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={reduceMotion ? false : { pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: reduceMotion ? 0 : 0.45, delay: reduceMotion ? 0 : 0.15 }}
              />
            </svg>
          ) : status === 'PENDING' ? (
            <Clock3 className="size-7" strokeWidth={1.5} aria-hidden="true" />
          ) : ['FAILED', 'CANCELLED', 'EXPIRED'].includes(status) ? (
            <X className="size-7" strokeWidth={1.5} aria-hidden="true" />
          ) : (
            <CircleAlert className="size-7" strokeWidth={1.5} aria-hidden="true" />
          )}
        </motion.div>
      </div>
      <h1 className="text-2xl font-medium tracking-tight text-[#171717] sm:text-3xl">
        {title ?? message.title}
      </h1>
      <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-black/55">
        {description ?? message.description}
      </p>
      {children && <div className="mx-auto mt-7 max-w-sm">{children}</div>}
    </motion.section>
  );
}
