type User = { name?: string | null; phone?: string | null };
export default function CustomerInfoCard({ user }: { user: User }) {
  if (!user) return null;
  return (
    <section className="border border-black/15 bg-white p-5 sm:p-6">
      <h2 className="mb-5 text-lg font-medium">Informasi pelanggan</h2>
      <dl className="grid gap-5 text-sm sm:grid-cols-2">
        <div>
          <dt className="mb-1 text-black/45">Nama</dt>
          <dd className="break-words">{user.name || '—'}</dd>
        </div>
        <div>
          <dt className="mb-1 text-black/45">Nomor WhatsApp</dt>
          <dd>{user.phone || '—'}</dd>
        </div>
      </dl>
    </section>
  );
}
