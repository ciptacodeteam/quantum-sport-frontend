'use client';

import { useState } from 'react';
import { updateBookingDescriptionApi } from '@/api/admin/booking';
import { useHasRole } from '@/hooks/useRoleAccess';
import { parseBookingAdminNote } from '@/lib/booking-admin-note';
import { getApiErrorMessage } from '@/lib/api-error';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import BookingAdminNotes from './BookingAdminNotes';

export default function BookingDescription({
  bookingId,
  note,
  onSuccess
}: {
  bookingId: string;
  note: string | null | undefined;
  onSuccess: () => void;
}) {
  const canEdit = useHasRole(['ADMIN', 'CASHIER']);
  const [saved, setSaved] = useState(note ?? null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const parsed = parseBookingAdminNote(saved ?? '');
  const startEditing = () => {
    // Use the original text rather than the translated display of generated notes.
    const history = new Set(parsed.history.map((entry) => entry.raw));
    setDraft(
      (saved ?? '')
        .split('\n')
        .filter((line) => !history.has(line))
        .join('\n')
        .trim()
    );
    setError('');
    setEditing(true);
  };
  const save = async () => {
    setPending(true);
    setError('');
    try {
      const result = await updateBookingDescriptionApi(bookingId, {
        description: draft.trim(),
        expectedAdminNote: saved
      });
      setSaved(result.data.adminNote);
      setEditing(false);
      onSuccess();
    } catch (cause) {
      setError(getApiErrorMessage(cause, 'Description gagal disimpan. Silakan coba lagi.'));
    } finally {
      setPending(false);
    }
  };
  return (
    <section aria-label="Description pemesanan" className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-medium">Description</h3>
        {canEdit && !editing && (
          <Button type="button" size="sm" variant="outline" onClick={startEditing}>
            Edit description
          </Button>
        )}
      </div>
      {editing ? (
        <form
          className="space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            void save();
          }}
        >
          <Textarea
            aria-label="Description"
            value={draft}
            maxLength={1000}
            disabled={pending}
            onChange={(event) => setDraft(event.target.value)}
            rows={4}
          />
          {error && (
            <p role="alert" className="text-destructive text-sm">
              {error}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={() => setEditing(false)}
            >
              Batal
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? 'Menyimpan…' : 'Simpan description'}
            </Button>
          </div>
        </form>
      ) : (
        <p className="bg-muted/40 rounded-lg p-3 text-sm break-words whitespace-pre-wrap">
          {parsed.note || 'Belum ada description.'}
        </p>
      )}
      {parsed.history.length > 0 && (
        <BookingAdminNotes note={parsed.history.map((entry) => entry.raw).join('\n')} />
      )}
    </section>
  );
}
