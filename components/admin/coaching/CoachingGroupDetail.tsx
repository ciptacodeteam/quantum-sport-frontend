'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { coachingGroupApi } from '@/api/admin/coachingGroup';
import { useRoleAccess } from '@/hooks/useRoleAccess';
import { useAdminCourtSports } from '@/hooks/useAdminCourtSports';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import CoachingCatalog from './CoachingCatalog';

export default function CoachingGroupDetail({ groupId }: { groupId: string }) {
  const { hasAccess, isLoading } = useRoleAccess({ allowedRoles: ['ADMIN'] });
  const { branchId } = useAdminCourtSports();
  const independent = groupId === 'independent';
  const query = useQuery({
    queryKey: ['admin', 'coaching-groups'],
    queryFn: () => coachingGroupApi.list(),
    enabled: hasAccess && !independent
  });
  const group = query.data?.find((item) => item.id === groupId);
  if (isLoading || !hasAccess) return <p>Memuat...</p>;
  return (
    <main className="min-w-0 space-y-6">
      <Button variant="outline" asChild>
        <Link href="/admin/coaching-groups">← Kembali ke Grup Coaching</Link>
      </Button>
      {!independent && query.isPending ? (
        <p>Memuat grup...</p>
      ) : !independent && query.isError ? (
        <div role="alert" className="space-y-3">
          <p>Detail grup belum dapat dimuat.</p>
          <Button onClick={() => void query.refetch()}>Coba lagi</Button>
        </div>
      ) : !independent && !group ? (
        <p role="alert">Grup coaching tidak ditemukan.</p>
      ) : (
        <>
          <div className="space-y-3 rounded-xl border p-5">
            <div className="flex items-center gap-3">
              {group && (
                <Avatar className="size-12 rounded-lg">
                  <AvatarImage src={group.logo || undefined} alt={group.name} />
                  <AvatarFallback className="rounded-lg">
                    {group.name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              )}
              <h1 className="text-2xl font-semibold">{group?.name ?? 'Coach Independen'}</h1>
              {group && (
                <Badge variant={group.isActive ? 'lightSuccess' : 'lightNeutral'}>
                  {group.isActive ? 'Aktif' : 'Nonaktif'}
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground text-sm">
              {group?.description ||
                (independent
                  ? 'Coach yang belum tergabung dalam grup coaching.'
                  : 'Informasi grup dan daftar member coach.')}
            </p>
            {group && (
              <dl className="grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-muted-foreground">Olahraga</dt>
                  <dd>
                    {group.sports
                      .map((sport) => (sport === 'PADEL' ? 'Padel' : 'Tennis'))
                      .join(' & ')}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Cabang layanan</dt>
                  <dd>{group.branches.map((item) => item.branch.name).join(', ')}</dd>
                </div>
              </dl>
            )}
          </div>
          <CoachingCatalog key={`${groupId}:${branchId}`} groupId={groupId} />
        </>
      )}
    </main>
  );
}
