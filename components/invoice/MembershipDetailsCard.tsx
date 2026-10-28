import dayjs from '@/lib/dayjs';

type Props = {
  membershipUser: {
    startDate?: string | Date | null;
    endDate?: string | Date | null;
    membership?: { name: string; sessions?: number; duration?: number };
  };
};
const dateLabel = (value?: string | Date | null) =>
  value && dayjs(value).isValid() ? dayjs(value).tz('Asia/Jakarta').format('D MMM YYYY') : null;

export default function MembershipDetailsCard({ membershipUser }: Props) {
  const membership = membershipUser.membership;
  if (!membership) return null;
  const start = dateLabel(membershipUser.startDate);
  const end = dateLabel(membershipUser.endDate);
  const hours =
    typeof membership.sessions === 'number' &&
    Number.isFinite(membership.sessions) &&
    membership.sessions > 0
      ? membership.sessions
      : null;
  const duration =
    typeof membership.duration === 'number' &&
    Number.isFinite(membership.duration) &&
    membership.duration > 0
      ? membership.duration
      : null;

  return (
    <section aria-label="Paket yang dibeli" className="space-y-4">
      <h3 className="text-base font-medium tracking-tight">{membership.name}</h3>
      <dl className="space-y-3 text-sm">
        {hours !== null && (
          <div className="flex flex-wrap justify-between gap-x-5 gap-y-1">
            <dt className="text-black/50">Waktu bermain</dt>
            <dd>{hours} jam</dd>
          </div>
        )}
        {start && end ? (
          <div className="flex flex-wrap justify-between gap-x-5 gap-y-1">
            <dt className="text-black/50">Masa berlaku</dt>
            <dd>
              {start} - {end}
            </dd>
          </div>
        ) : (
          <>
            {start && (
              <div className="flex flex-wrap justify-between gap-x-5 gap-y-1">
                <dt className="text-black/50">Mulai</dt>
                <dd>{start}</dd>
              </div>
            )}
            {end && (
              <div className="flex flex-wrap justify-between gap-x-5 gap-y-1">
                <dt className="text-black/50">Berlaku hingga</dt>
                <dd>{end}</dd>
              </div>
            )}
            {duration !== null && (
              <div className="flex flex-wrap justify-between gap-x-5 gap-y-1">
                <dt className="text-black/50">Masa berlaku</dt>
                <dd>{duration} hari</dd>
              </div>
            )}
          </>
        )}
      </dl>
    </section>
  );
}
