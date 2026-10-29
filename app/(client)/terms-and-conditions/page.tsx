import MainHeader from '@/components/headers/MainHeader';
import { clubLocations } from '@/lib/club-locations';
import { getWhatsappMessageUrl } from '@/lib/utils';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Syarat & Ketentuan | Black Padel',
  description: 'Syarat & Ketentuan penggunaan layanan Black Padel'
};

const termsSections = [
  'Definisi',
  'Penggunaan Website',
  'Akun Pengguna',
  'Pemesanan Lapangan',
  'Harga dan Pembayaran',
  'Kebijakan Pembatalan',
  'Kebijakan Reschedule',
  'Peraturan Penggunaan Lapangan',
  'Keterlambatan',
  'Tanggung Jawab',
  'Perubahan Ketentuan',
  'Kontak'
];

export default function TermsAndConditionsPage() {
  return (
    <>
      <MainHeader backHref="/" title="Syarat & Ketentuan" withLogo={false} withBorder />
      <main className="terms-page mx-auto w-full max-w-7xl px-5 pt-24 pb-10 text-[#171717] sm:px-8 lg:pb-16 xl:pt-32">
        <header className="mb-6 border-b border-black/15 pb-6 lg:mb-10 lg:pb-8">
          <p className="mb-3 text-[10px] font-medium tracking-[0.16em] text-[#ad422b] uppercase">
            Black Padel
          </p>
          <h1 className="text-3xl font-medium tracking-tight sm:text-4xl">
            Syarat &amp; Ketentuan
          </h1>
        </header>
        <div className="grid items-start gap-8 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-14">
          <nav
            aria-label="Daftar isi syarat dan ketentuan"
            className="min-w-0 border border-black/15 bg-[#f8f8f6] p-4 lg:sticky lg:top-28 lg:p-5"
          >
            <h2 className="mb-3 text-xs font-medium tracking-[0.1em] uppercase">Daftar isi</h2>
            <ol className="grid grid-cols-2 gap-x-4 gap-y-2 lg:grid-cols-1">
              {termsSections.map((title, index) => (
                <li key={title}>
                  <a
                    href={`#ketentuan-${index + 1}`}
                    className="flex gap-2 py-1 text-xs leading-relaxed text-black/55 transition-colors hover:text-[#ad422b] focus-visible:outline-2 focus-visible:outline-[#ad422b]"
                  >
                    <span className="shrink-0 text-[#ad422b]">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <span>{title}</span>
                  </a>
                </li>
              ))}
            </ol>
          </nav>
          <article className="min-w-0 space-y-7 text-sm leading-relaxed text-black/65 sm:space-y-8 sm:leading-7 [&_strong]:font-medium [&_strong]:text-[#171717]">
            <p>
              Selamat datang di Black Padel. Dengan mengakses website kami dan melakukan pemesanan
              lapangan, Anda menyetujui untuk mematuhi Syarat & Ketentuan berikut. Harap membaca
              dengan saksama sebelum menggunakan layanan kami.
            </p>

            {/* Section 1 */}
            <section
              id="ketentuan-1"
              className="scroll-mt-28 space-y-3 border-t border-black/15 pt-6 sm:pt-8"
            >
              <h2 className="text-lg font-medium tracking-tight text-[#171717] sm:text-xl">
                1. Definisi
              </h2>
              <ul className="list-disc space-y-2 pl-5 marker:text-[#ad422b]">
                <li>
                  <strong>&ldquo;Kami&rdquo; / &ldquo;Black Padel&rdquo;:</strong> Pengelola
                  penyewaan lapangan padel.
                </li>
                <li>
                  <strong>&ldquo;Pelanggan&rdquo; / &ldquo;Anda&rdquo;:</strong> Individu atau pihak
                  yang melakukan pemesanan lapangan melalui website.
                </li>
                <li>
                  <strong>&ldquo;Layanan&rdquo;:</strong> Fasilitas booking lapangan padel yang
                  disediakan melalui website.
                </li>
              </ul>
            </section>

            {/* Section 2 */}
            <section
              id="ketentuan-2"
              className="scroll-mt-28 space-y-3 border-t border-black/15 pt-6 sm:pt-8"
            >
              <h2 className="text-lg font-medium tracking-tight text-[#171717] sm:text-xl">
                2. Penggunaan Website
              </h2>
              <p>Dengan menggunakan website ini, Anda menyatakan bahwa:</p>
              <ul className="list-disc space-y-2 pl-5 marker:text-[#ad422b]">
                <li>Informasi yang Anda berikan adalah benar dan akurat</li>
                <li>
                  Anda tidak akan menggunakan website untuk tindakan ilegal atau yang merugikan
                  pihak lain
                </li>
                <li>Anda tidak mencoba meretas, merusak, atau mengganggu sistem kami</li>
              </ul>
            </section>

            {/* Section 3 */}
            <section
              id="ketentuan-3"
              className="scroll-mt-28 space-y-3 border-t border-black/15 pt-6 sm:pt-8"
            >
              <h2 className="text-lg font-medium tracking-tight text-[#171717] sm:text-xl">
                3. Akun Pengguna
              </h2>
              <p>
                Untuk melakukan pemesanan, Anda mungkin perlu membuat akun. Anda bertanggung jawab
                untuk:
              </p>
              <ul className="list-disc space-y-2 pl-5 marker:text-[#ad422b]">
                <li>Menjaga kerahasiaan akun dan password</li>
                <li>Mengawasi aktivitas yang terjadi pada akun Anda</li>
                <li>Memberikan data yang valid</li>
              </ul>
              <p>Kami berhak menonaktifkan akun yang melakukan pelanggaran.</p>
            </section>

            {/* Section 4 */}
            <section
              id="ketentuan-4"
              className="scroll-mt-28 space-y-3 border-t border-black/15 pt-6 sm:pt-8"
            >
              <h2 className="text-lg font-medium tracking-tight text-[#171717] sm:text-xl">
                4. Pemesanan Lapangan
              </h2>
              <ul className="list-disc space-y-2 pl-5 marker:text-[#ad422b]">
                <li>Pemesanan dianggap berhasil setelah pembayaran dikonfirmasi oleh sistem.</li>
                <li>
                  Anda wajib memastikan jadwal yang dipilih sudah benar sebelum melakukan
                  pembayaran.
                </li>
                <li>Kami tidak menjamin ketersediaan lapangan sebelum transaksi selesai.</li>
              </ul>
            </section>

            {/* Section 5 */}
            <section
              id="ketentuan-5"
              className="scroll-mt-28 space-y-3 border-t border-black/15 pt-6 sm:pt-8"
            >
              <h2 className="text-lg font-medium tracking-tight text-[#171717] sm:text-xl">
                5. Harga dan Pembayaran
              </h2>
              <ul className="list-disc space-y-2 pl-5 marker:text-[#ad422b]">
                <li>
                  Harga sewa lapangan dapat berubah sewaktu-waktu tanpa pemberitahuan terlebih
                  dahulu.
                </li>
                <li>Semua pembayaran harus dilakukan melalui metode yang tersedia di website.</li>
                <li>Jika terjadi double payment, pelanggan berhak mengajukan refund.</li>
              </ul>
            </section>

            {/* Section 6 */}
            <section
              id="ketentuan-6"
              className="scroll-mt-28 space-y-3 border-t border-black/15 pt-6 sm:pt-8"
            >
              <h2 className="text-lg font-medium tracking-tight text-[#171717] sm:text-xl">
                6. Kebijakan Pembatalan
              </h2>
              <p>Pembatalan mengikuti aturan berikut:</p>

              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-[#171717] sm:text-base">
                    a. Pembatalan oleh Pelanggan
                  </h3>
                  <p>
                    Pembatalan tidak dapat dilakukan oleh pelanggan. Namun, jika ada kondisi khusus,
                    silakan hubungi kami untuk diskusi lebih lanjut.
                  </p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-[#171717] sm:text-base">
                    b. Pembatalan oleh Black Padel
                  </h3>
                  <p>Kami berhak membatalkan pemesanan jika terjadi:</p>
                  <ul className="list-disc space-y-2 pl-5 marker:text-[#ad422b]">
                    <li>Kerusakan fasilitas</li>
                    <li>Kendala operasional</li>
                  </ul>
                  <p className="mt-2">Pelanggan berhak mendapatkan penjadwalan ulang.</p>
                </div>
              </div>
            </section>

            {/* Section 7 */}
            <section
              id="ketentuan-7"
              className="scroll-mt-28 space-y-3 border-t border-black/15 pt-6 sm:pt-8"
            >
              <h2 className="text-lg font-medium tracking-tight text-[#171717] sm:text-xl">
                7. Kebijakan Reschedule
              </h2>
              <ul className="list-disc space-y-2 pl-5 marker:text-[#ad422b]">
                <li>Tidak bisa refund, hanya bisa reschedule</li>
                <li>Reschedule maksimal H-2 (minimal 48 jam sebelum jadwal bermain)</li>
                <li>Reschedule hanya berlaku sekali per pemesanan</li>
              </ul>
            </section>

            {/* Section 8 */}
            <section
              id="ketentuan-8"
              className="scroll-mt-28 space-y-3 border-t border-black/15 pt-6 sm:pt-8"
            >
              <h2 className="text-lg font-medium tracking-tight text-[#171717] sm:text-xl">
                8. Peraturan Penggunaan Lapangan
              </h2>
              <p>Pelanggan wajib:</p>
              <ul className="list-disc space-y-2 pl-5 marker:text-[#ad422b]">
                <li>Menggunakan fasilitas secara wajar</li>
                <li>Tidak merusak properti atau peralatan</li>
                <li>Tidak melakukan tindakan yang membahayakan diri sendiri atau orang lain</li>
                <li>Mengikuti instruksi staf Black Padel</li>
              </ul>
              <p>
                Jika terjadi kerusakan karena kelalaian pelanggan, biaya penggantian akan dibebankan
                kepada pelanggan.
              </p>
            </section>

            {/* Section 9 */}
            <section
              id="ketentuan-9"
              className="scroll-mt-28 space-y-3 border-t border-black/15 pt-6 sm:pt-8"
            >
              <h2 className="text-lg font-medium tracking-tight text-[#171717] sm:text-xl">
                9. Keterlambatan (Late Arrival)
              </h2>
              <ul className="list-disc space-y-2 pl-5 marker:text-[#ad422b]">
                <li>Waktu sewa tidak dapat diperpanjang jika pelanggan terlambat.</li>
                <li>Tidak ada pengembalian dana untuk waktu bermain yang hilang.</li>
                <li>Jika pelanggan tidak hadir hingga sesi berakhir, pemesanan dianggap hangus.</li>
              </ul>
            </section>

            {/* Section 10 */}
            <section
              id="ketentuan-10"
              className="scroll-mt-28 space-y-3 border-t border-black/15 pt-6 sm:pt-8"
            >
              <h2 className="text-lg font-medium tracking-tight text-[#171717] sm:text-xl">
                10. Tanggung Jawab
              </h2>
              <p>Black Padel tidak bertanggung jawab atas:</p>
              <ul className="list-disc space-y-2 pl-5 marker:text-[#ad422b]">
                <li>Cedera pribadi akibat kelalaian pelanggan</li>
                <li>Kehilangan barang pribadi di area lapangan</li>
                <li>Gangguan layanan akibat kondisi di luar kendali pengelola</li>
              </ul>
            </section>

            {/* Section 11 */}
            <section
              id="ketentuan-11"
              className="scroll-mt-28 space-y-3 border-t border-black/15 pt-6 sm:pt-8"
            >
              <h2 className="text-lg font-medium tracking-tight text-[#171717] sm:text-xl">
                11. Perubahan Ketentuan
              </h2>
              <p>Kami berhak mengubah Syarat & Ketentuan kapan saja.</p>
              <p>Perubahan berlaku setelah dipublikasikan pada halaman ini.</p>
            </section>

            {/* Section 12 */}
            <section
              id="ketentuan-12"
              className="scroll-mt-28 space-y-3 border-t border-black/15 pt-6 sm:pt-8"
            >
              <h2 className="text-lg font-medium tracking-tight text-[#171717] sm:text-xl">
                12. Kontak
              </h2>
              <p>Untuk pertanyaan atau bantuan, hubungi:</p>
              <div className="space-y-3 border border-black/15 bg-[#f8f8f6] p-4 sm:p-5">
                <p>
                  <strong>Email:</strong>{' '}
                  <a
                    href="mailto:quantumsportsandsocialclub@gmail.com"
                    className="break-words text-[#ad422b] underline-offset-4 hover:underline"
                  >
                    quantumsportsandsocialclub@gmail.com
                  </a>
                </p>
                <p>
                  <strong>WhatsApp:</strong>{' '}
                  <a
                    href={getWhatsappMessageUrl(
                      '+628131626241',
                      'Halo, saya ingin bertanya tentang Black Padel.'
                    )}
                    className="break-words text-[#ad422b] underline-offset-4 hover:underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    +62 813-1626-241
                  </a>
                </p>
                <p>
                  <strong>Alamat Venue:</strong> {clubLocations[0].address}
                </p>
              </div>
            </section>
          </article>
        </div>
      </main>
    </>
  );
}
