import MainHeader from '@/components/headers/MainHeader';
import { getWhatsappMessageUrl } from '@/lib/utils';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Syarat & Ketentuan | Quantum Padel',
  description: 'Syarat & Ketentuan penggunaan layanan Quantum Padel'
};

export default function TermsAndConditionsPage() {
  return (
    <>
      <MainHeader backHref="/" title="Syarat & Ketentuan" withLogo={false} withBorder />
      <div className="mx-auto mt-28 mb-16 max-w-3xl px-4 lg:mt-32 lg:px-0">
        <div className="space-y-8">
          {/* Header */}
          <div className="space-y-2">
            <h1 className="text-2xl font-bold lg:text-3xl">Quantum Padel</h1>
            <p className="text-muted-foreground text-xs lg:text-sm">
              Terakhir diperbarui:{' '}
              {new Date().toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              })}
            </p>
          </div>

          <div className="prose prose-slate mt-2 max-w-none space-y-6 text-sm lg:text-base">
            <p>
              Selamat datang di Quantum Padel. Dengan mengakses website kami dan melakukan pemesanan
              lapangan, Anda menyetujui untuk mematuhi Syarat & Ketentuan berikut. Harap membaca
              dengan saksama sebelum menggunakan layanan kami.
            </p>

            <hr className="border-border my-8" />

            {/* Section 1 */}
            <section className="space-y-3">
              <h2 className="text-xl font-semibold lg:text-2xl">1. Definisi</h2>
              <ul className="list-disc space-y-2 pl-6">
                <li>
                  <strong>&ldquo;Kami&rdquo; / &ldquo;Quantum Padel&rdquo;:</strong> Pengelola
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

            <hr className="border-border my-8" />

            {/* Section 2 */}
            <section className="space-y-3">
              <h2 className="text-xl font-semibold lg:text-2xl">2. Penggunaan Website</h2>
              <p>Dengan menggunakan website ini, Anda menyatakan bahwa:</p>
              <ul className="list-disc space-y-2 pl-6">
                <li>Informasi yang Anda berikan adalah benar dan akurat</li>
                <li>
                  Anda tidak akan menggunakan website untuk tindakan ilegal atau yang merugikan
                  pihak lain
                </li>
                <li>Anda tidak mencoba meretas, merusak, atau mengganggu sistem kami</li>
              </ul>
            </section>

            <hr className="border-border my-8" />

            {/* Section 3 */}
            <section className="space-y-3">
              <h2 className="text-xl font-semibold lg:text-2xl">3. Akun Pengguna</h2>
              <p>
                Untuk melakukan pemesanan, Anda mungkin perlu membuat akun. Anda bertanggung jawab
                untuk:
              </p>
              <ul className="list-disc space-y-2 pl-6">
                <li>Menjaga kerahasiaan akun dan password</li>
                <li>Mengawasi aktivitas yang terjadi pada akun Anda</li>
                <li>Memberikan data yang valid</li>
              </ul>
              <p>Kami berhak menonaktifkan akun yang melakukan pelanggaran.</p>
            </section>

            <hr className="border-border my-8" />

            {/* Section 4 */}
            <section className="space-y-3">
              <h2 className="text-xl font-semibold lg:text-2xl">4. Pemesanan Lapangan</h2>
              <ul className="list-disc space-y-2 pl-6">
                <li>Pemesanan dianggap berhasil setelah pembayaran dikonfirmasi oleh sistem.</li>
                <li>
                  Anda wajib memastikan jadwal yang dipilih sudah benar sebelum melakukan
                  pembayaran.
                </li>
                <li>Kami tidak menjamin ketersediaan lapangan sebelum transaksi selesai.</li>
              </ul>
            </section>

            <hr className="border-border my-8" />

            {/* Section 5 */}
            <section className="space-y-3">
              <h2 className="text-xl font-semibold lg:text-2xl">5. Harga dan Pembayaran</h2>
              <ul className="list-disc space-y-2 pl-6">
                <li>
                  Harga sewa lapangan dapat berubah sewaktu-waktu tanpa pemberitahuan terlebih
                  dahulu.
                </li>
                <li>Semua pembayaran harus dilakukan melalui metode yang tersedia di website.</li>
                <li>Jika terjadi double payment, pelanggan berhak mengajukan refund.</li>
              </ul>
            </section>

            <hr className="border-border my-8" />

            {/* Section 6 */}
            <section className="space-y-3">
              <h2 className="text-xl font-semibold lg:text-2xl">6. Kebijakan Pembatalan</h2>
              <p>Pembatalan mengikuti aturan berikut:</p>

              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold">a. Pembatalan oleh Pelanggan</h3>
                  <p>
                    Pembatalan tidak dapat dilakukan oleh pelanggan. Namun, jika ada kondisi khusus,
                    silakan hubungi kami untuk diskusi lebih lanjut.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold">b. Pembatalan oleh Quantum Padel</h3>
                  <p>Kami berhak membatalkan pemesanan jika terjadi:</p>
                  <ul className="list-disc space-y-2 pl-6">
                    <li>Kerusakan fasilitas</li>
                    <li>Force majeure</li>
                    <li>Kendala operasional</li>
                  </ul>
                  <p className="mt-2">
                    Pelanggan berhak mendapatkan refund penuh atau penjadwalan ulang.
                  </p>
                </div>
              </div>
            </section>

            <hr className="border-border my-8" />

            {/* Section 7 */}
            <section className="space-y-3">
              <h2 className="text-xl font-semibold lg:text-2xl">7. Kebijakan Reschedule</h2>
              <ul className="list-disc space-y-2 pl-6">
                <li>Tidak bisa refund, hanya bisa reschedule</li>
                <li>Reschedule maksimal H-3 (3 hari sebelum jadwal bermain)</li>
                <li>Reschedule hanya berlaku sekali per pemesanan</li>
              </ul>
            </section>

            <hr className="border-border my-8" />

            {/* Section 8 */}
            <section className="space-y-3">
              <h2 className="text-xl font-semibold lg:text-2xl">
                8. Peraturan Penggunaan Lapangan
              </h2>
              <p>Pelanggan wajib:</p>
              <ul className="list-disc space-y-2 pl-6">
                <li>Menggunakan fasilitas secara wajar</li>
                <li>Tidak merusak properti atau peralatan</li>
                <li>Tidak melakukan tindakan yang membahayakan diri sendiri atau orang lain</li>
                <li>Mengikuti instruksi staf Quantum Padel</li>
              </ul>
              <p>
                Jika terjadi kerusakan karena kelalaian pelanggan, biaya penggantian akan dibebankan
                kepada pelanggan.
              </p>
            </section>

            <hr className="border-border my-8" />

            {/* Section 9 */}
            <section className="space-y-3">
              <h2 className="text-xl font-semibold lg:text-2xl">9. Keterlambatan (Late Arrival)</h2>
              <ul className="list-disc space-y-2 pl-6">
                <li>Waktu sewa tidak dapat diperpanjang jika pelanggan terlambat.</li>
                <li>Tidak ada pengembalian dana untuk waktu bermain yang hilang.</li>
                <li>Jika pelanggan tidak hadir hingga sesi berakhir, pemesanan dianggap hangus.</li>
              </ul>
            </section>

            <hr className="border-border my-8" />

            {/* Section 10 */}
            <section className="space-y-3">
              <h2 className="text-xl font-semibold lg:text-2xl">10. Force Majeure</h2>
              <p>
                Force majeure meliputi: hujan deras, bencana alam, listrik padam, atau kejadian tak
                terduga lainnya.
              </p>
              <p>Dalam kondisi seperti ini:</p>
              <ul className="list-disc space-y-2 pl-6">
                <li>Pelanggan dapat meminta refund penuh, atau</li>
                <li>Menjadwalkan ulang tanpa biaya tambahan</li>
              </ul>
            </section>

            <hr className="border-border my-8" />

            {/* Section 11 */}
            <section className="space-y-3">
              <h2 className="text-xl font-semibold lg:text-2xl">11. Tanggung Jawab</h2>
              <p>Quantum Padel tidak bertanggung jawab atas:</p>
              <ul className="list-disc space-y-2 pl-6">
                <li>Cedera pribadi akibat kelalaian pelanggan</li>
                <li>Kehilangan barang pribadi di area lapangan</li>
                <li>Gangguan layanan akibat kondisi di luar kendali pengelola</li>
              </ul>
            </section>

            <hr className="border-border my-8" />

            {/* Section 12 */}
            <section className="space-y-3">
              <h2 className="text-xl font-semibold lg:text-2xl">12. Perubahan Ketentuan</h2>
              <p>Kami berhak mengubah Syarat & Ketentuan kapan saja.</p>
              <p>Perubahan berlaku setelah dipublikasikan pada halaman ini.</p>
            </section>

            <hr className="border-border my-8" />

            {/* Section 13 */}
            <section className="space-y-3">
              <h2 className="text-xl font-semibold lg:text-2xl">13. Kontak</h2>
              <p>Untuk pertanyaan atau bantuan, hubungi:</p>
              <div className="space-y-2 pl-6">
                <p>
                  <strong>Email:</strong>{' '}
                  <a
                    href="mailto:quantumsportsandsocialclub@gmail.com"
                    className="text-primary hover:underline"
                  >
                    quantumsportsandsocialclub@gmail.com
                  </a>
                </p>
                <p>
                  <strong>WhatsApp:</strong>{' '}
                  <a
                    href={getWhatsappMessageUrl(
                      '+6282311160880',
                      'Halo, saya ingin bertanya tentang Quantum Sport & Social Club.'
                    )}
                    className="text-primary hover:underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    +62 812-3456-7890
                  </a>
                </p>
                <p>
                  <strong>Alamat Venue:</strong> JI. Cemara No.51, Pulo Brayan Bengkel Baru, Kec.
                  Medan Tim., Kota Medan, Sumatera Utara 20237
                </p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </>
  );
}
