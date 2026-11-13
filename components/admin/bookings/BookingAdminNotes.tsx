import { parseBookingAdminNote } from '@/lib/booking-admin-note';
import { formatBookingDate } from '@/lib/booking-display';

export default function BookingAdminNotes({ note }: { note: string }) {
  const parsed = parseBookingAdminNote(note);
  return (
    <div className="min-w-0 space-y-4">
      {parsed.note && (
        <section aria-label="Catatan admin" className="space-y-1.5">
          <h3 className="text-muted-foreground text-sm font-medium">Catatan admin</h3>
          <p className="bg-muted/40 max-h-40 overflow-y-auto rounded-lg p-3 text-sm leading-relaxed break-words whitespace-pre-wrap">
            {parsed.note}
          </p>
        </section>
      )}
      {parsed.history.length > 0 && (
        <section aria-label="Riwayat perubahan" className="space-y-2">
          <h3 className="text-muted-foreground text-sm font-medium">
            Riwayat perubahan ({parsed.history.length})
          </h3>
          <ol className="max-h-64 space-y-3 overflow-y-auto overscroll-contain pr-1">
            {parsed.history.map((entry, index) => (
              <li
                key={`${entry.at}-${index}`}
                className="bg-muted/40 space-y-1.5 rounded-lg p-3 text-sm"
              >
                <p className="font-medium">{entry.title}</p>
                <p className="text-muted-foreground text-xs">
                  {formatBookingDate(entry.at, 'DD MMM YYYY · HH:mm:ss')} WIB · Admin
                </p>
                <p className="leading-relaxed break-words whitespace-pre-line">
                  {entry.description}
                </p>
                <details className="text-muted-foreground text-xs">
                  <summary className="cursor-pointer">Detail teknis</summary>
                  <p className="mt-2 break-all whitespace-pre-wrap">{entry.raw}</p>
                </details>
              </li>
            ))}
          </ol>
        </section>
      )}
    </div>
  );
}
