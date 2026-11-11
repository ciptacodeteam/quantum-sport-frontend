'use client';
import { useState } from 'react';
import Link from 'next/link';
import { UserRound } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { inHouseApi, type InHousePlan } from '@/api/admin/inhouseCoaching';
import type { CoachingPerson } from '@/api/admin/coaching';
import { useRoleAccess } from '@/hooks/useRoleAccess';
import { useAdminCourtSports } from '@/hooks/useAdminCourtSports';
import { getApiErrorMessage } from '@/lib/api-error';
import { formatCurrency } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { toast } from 'sonner';
const fieldClass =
  'h-11 rounded-md border-0 bg-muted/70 px-3 shadow-none hover:bg-muted focus-visible:bg-muted dark:bg-muted/70';
const buttonClass = 'rounded-md border-0 shadow-none';
const panelClass = 'min-w-0 gap-5 rounded-md border-0 bg-muted/20 py-5 shadow-none';
const emptyPlan = (staffId: string): Omit<InHousePlan, 'id' | 'staff'> => ({
  staffId,
  name: '',
  hours: 0,
  hourlyPrice: 0,
  courtHourlyShare: 0,
  extraParticipantHourlyPrice: 100000,
  isActive: true
});
export default function InHouseCoachPlans({
  coach
}: {
  coach: Pick<CoachingPerson, 'id' | 'name' | 'isInHouseCoach'>;
}) {
  const { branchId } = useAdminCourtSports();
  const { hasAccess, userRole } = useRoleAccess({ allowedRoles: ['ADMIN'] });
  const canEdit =
    hasAccess && ['ADMIN', 'SUPER_ADMIN'].includes(userRole ?? '') && coach.isInHouseCoach === true;
  const ready = canEdit && !!branchId && branchId !== 'all';
  const client = useQueryClient();
  const [detailId, setDetailId] = useState<string | null>(null);
  const [draft, setDraft] = useState(() => emptyPlan(coach.id));
  const [editing, setEditing] = useState<string>();
  const [editingCourtAmount, setEditingCourtAmount] = useState(false);
  const plans = useQuery({
    queryKey: ['admin', 'inhouse', 'plans', branchId],
    queryFn: inHouseApi.plans,
    enabled: ready,
    staleTime: 30000
  });
  const scopedPlans = (plans.data ?? []).filter((plan) => plan.staffId === coach.id);
  const detailPlan = scopedPlans.find((plan) => plan.id === detailId);
  const coachGroups = new Map<string, { staff: InHousePlan['staff']; plans: InHousePlan[] }>();
  for (const plan of scopedPlans) {
    const group = coachGroups.get(plan.staffId) ?? { staff: plan.staff, plans: [] };
    group.plans.push(plan);
    coachGroups.set(plan.staffId, group);
  }
  const save = useMutation({
    mutationFn: () => inHouseApi.savePlan(editing, { ...draft, staffId: coach.id }),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ['admin', 'inhouse'] });
      setEditing(undefined);
      setDraft(emptyPlan(coach.id));
      toast.success('Paket in-house disimpan.');
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Paket belum tersimpan.'))
  });
  if (!canEdit) return null;
  if (!ready) return <p>Pilih satu cabang terlebih dahulu.</p>;
  return (
    <section aria-label={`Paket dan tarif ${coach.name}`} className="space-y-5">
      <p className="text-muted-foreground text-sm">
        Kelola paket khusus {coach.name}. Harga paket berlaku untuk pembelian berikutnya.
      </p>
      {plans.isError && (
        <div role="alert" className="space-y-2 text-sm">
          <p>Paket belum dapat dimuat.</p>
          <Button variant="secondary" className={buttonClass} onClick={() => void plans.refetch()}>
            Coba lagi
          </Button>
        </div>
      )}
      <Dialog
        open={!!detailPlan}
        onOpenChange={(open) => {
          if (!open) setDetailId(null);
        }}
      >
        <DialogContent className="max-h-[85dvh] overflow-y-auto rounded-md sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Detail paket</DialogTitle>
            <DialogDescription>
              {detailPlan?.staff.name} · {detailPlan?.name}
            </DialogDescription>
          </DialogHeader>
          {detailPlan && (
            <div className="space-y-5">
              <div className="bg-muted/35 flex items-start justify-between gap-4 rounded-md p-4">
                <div>
                  <p className="text-muted-foreground text-xs">
                    Total harga paket · {detailPlan.hours} jam
                  </p>
                  <p className="mt-2 text-xl font-semibold tabular-nums">
                    {formatCurrency(detailPlan.hourlyPrice * detailPlan.hours)}
                  </p>
                </div>
                <Badge
                  variant={detailPlan.isActive ? 'lightSuccess' : 'lightNeutral'}
                  className="rounded-sm border-0"
                >
                  {detailPlan.isActive ? 'Aktif' : 'Nonaktif'}
                </Badge>
              </div>
              <dl className="grid grid-cols-2 gap-x-5 gap-y-4 text-sm [&>div]:space-y-1">
                <div>
                  <dt className="text-muted-foreground text-xs">Harga / jam</dt>
                  <dd className="font-medium tabular-nums">
                    {formatCurrency(detailPlan.hourlyPrice)}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground text-xs">Durasi paket</dt>
                  <dd className="font-medium">{detailPlan.hours} jam</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground text-xs">Lapangan / jam</dt>
                  <dd className="font-medium tabular-nums">
                    {formatCurrency(detailPlan.courtHourlyShare)}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground text-xs">Coach / jam</dt>
                  <dd className="font-medium tabular-nums">
                    {formatCurrency(detailPlan.hourlyPrice - detailPlan.courtHourlyShare)}
                  </dd>
                </div>
              </dl>
              <p className="text-muted-foreground bg-muted/20 rounded-md p-3 text-xs leading-relaxed">
                Tambahan peserta {formatCurrency(detailPlan.extraParticipantHourlyPrice)}/orang/jam
                untuk coach. Kuota terikat pada coach yang dipilih.
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="secondary" className={buttonClass} onClick={() => setDetailId(null)}>
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <div className="grid min-w-0 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_380px] 2xl:grid-cols-[minmax(0,1fr)_420px]">
        <Card className={panelClass}>
          <CardHeader className="flex flex-wrap items-center justify-between gap-3 px-5">
            <CardTitle className="flex items-center gap-2 text-sm leading-snug font-semibold">
              Paket & Tarif
            </CardTitle>
            {canEdit && (
              <Link
                href="/admin/coach-inhouse"
                className="text-primary w-fit text-sm leading-relaxed underline underline-offset-4"
              >
                Kelola profil & jadwal coach
              </Link>
            )}
          </CardHeader>
          <CardContent className="space-y-6 px-5">
            {plans.isPending ? (
              <p>Memuat paket…</p>
            ) : !scopedPlans.length ? (
              <p className="text-muted-foreground bg-muted/20 rounded-lg border border-dashed p-5 text-sm leading-relaxed">
                Belum ada paket. Pilih coach dan buat tarif satuan atau paket.
              </p>
            ) : (
              [...coachGroups.entries()]
                .sort(([, a], [, b]) => a.staff.name.localeCompare(b.staff.name, 'id'))
                .map(([staffId, group]) => (
                  <section
                    key={staffId}
                    aria-label={`Paket ${group.staff.name}`}
                    className="space-y-3 py-2 first:pt-0"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="flex min-w-0 items-center gap-2 text-sm font-semibold">
                        <UserRound className="text-muted-foreground size-4 shrink-0" />
                        {group.staff.name}
                      </h3>
                      <span className="text-muted-foreground text-xs">
                        {group.plans.length} paket ·{' '}
                        {group.plans.filter((plan) => plan.isActive).length} aktif
                      </span>
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 2xl:grid-cols-3">
                      {[...group.plans]
                        .sort((a, b) => a.hours - b.hours || a.name.localeCompare(b.name, 'id'))
                        .map((plan) => (
                          <article
                            key={plan.id}
                            data-admin-card
                            aria-label={`${group.staff.name} · ${plan.name}`}
                            className="bg-background flex min-w-0 flex-col gap-4 rounded-md p-4"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <h4 className="text-sm leading-relaxed font-semibold break-words">
                                  {plan.name}
                                </h4>
                                <p className="text-muted-foreground mt-1 text-xs">
                                  {plan.hours} jam coaching
                                </p>
                              </div>
                              <Badge
                                variant={plan.isActive ? 'lightSuccess' : 'lightNeutral'}
                                className="shrink-0 rounded-sm border-0 text-[10px]"
                              >
                                {plan.isActive ? 'Aktif' : 'Nonaktif'}
                              </Badge>
                            </div>
                            <div className="mt-auto">
                              <p className="text-muted-foreground text-xs">Total paket</p>
                              <p className="mt-1 text-lg font-semibold tabular-nums">
                                {formatCurrency(plan.hourlyPrice * plan.hours)}
                              </p>
                              <p className="text-muted-foreground mt-1 text-xs tabular-nums">
                                {formatCurrency(plan.hourlyPrice)}/jam
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="secondary"
                                size="sm"
                                className={`${buttonClass} bg-muted/50 flex-1`}
                                onClick={() => setDetailId(plan.id)}
                              >
                                Detail
                              </Button>
                              {canEdit && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className={buttonClass}
                                  onClick={() => {
                                    setEditing(plan.id);
                                    setDraft({
                                      staffId: plan.staffId,
                                      name: plan.name,
                                      hours: plan.hours,
                                      hourlyPrice: plan.hourlyPrice,
                                      courtHourlyShare: plan.courtHourlyShare,
                                      extraParticipantHourlyPrice: plan.extraParticipantHourlyPrice,
                                      isActive: plan.isActive
                                    });
                                  }}
                                >
                                  Edit
                                </Button>
                              )}
                            </div>
                          </article>
                        ))}
                    </div>
                  </section>
                ))
            )}
          </CardContent>
        </Card>
        {canEdit && (
          <Card className={`${panelClass} xl:sticky xl:top-6`}>
            <CardHeader className="gap-2 px-5">
              <CardTitle className="flex items-center gap-2 text-sm leading-snug font-semibold">
                {editing ? 'Edit paket' : 'Tambah paket'}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-5">
              <form
                className="space-y-5"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (
                    e.currentTarget.reportValidity() &&
                    Number.isInteger(draft.hours) &&
                    draft.hours > 0
                  )
                    save.mutate();
                }}
              >
                <div className="grid min-w-0 gap-2">
                  <Label htmlFor="plan-name">Nama paket</Label>
                  <Input
                    id="plan-name"
                    className={fieldClass}
                    required
                    maxLength={100}
                    value={draft.name}
                    onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                    placeholder="Paket 5 jam"
                  />
                </div>
                <div className="grid min-w-0 gap-2">
                  <Label htmlFor="plan-hours">Kuota jam</Label>
                  <Input
                    className={fieldClass}
                    id="plan-hours"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*[1-9][0-9]*"
                    required
                    placeholder="Ketik jumlah jam"
                    value={draft.hours || ''}
                    onChange={(e) => {
                      if (/^\d*$/.test(e.target.value)) {
                        setDraft({ ...draft, hours: Number(e.target.value) });
                      }
                    }}
                  />
                </div>
                <div className="grid min-w-0 gap-2">
                  <Label htmlFor="plan-price">Harga per jam (Rp)</Label>
                  <Input
                    id="plan-price"
                    className={fieldClass}
                    required
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={100000000}
                    value={draft.hourlyPrice || ''}
                    onChange={(e) => setDraft({ ...draft, hourlyPrice: Number(e.target.value) })}
                  />
                </div>
                <div className="grid min-w-0 gap-2">
                  <Label htmlFor="plan-court">Bagian lapangan per jam (Rp)</Label>
                  <Input
                    id="plan-court"
                    className={fieldClass}
                    required
                    type="number"
                    inputMode="numeric"
                    min={0}
                    max={draft.hourlyPrice}
                    value={
                      editingCourtAmount && draft.courtHourlyShare === 0
                        ? ''
                        : draft.courtHourlyShare
                    }
                    onFocus={() => setEditingCourtAmount(true)}
                    onBlur={() => setEditingCourtAmount(false)}
                    onChange={(e) =>
                      setDraft({ ...draft, courtHourlyShare: Number(e.target.value) })
                    }
                  />
                </div>
                <p className="text-muted-foreground bg-background/60 rounded-md p-3 text-xs leading-relaxed">
                  Kuota terikat pada coach. Perubahan tarif berlaku untuk pembelian berikutnya.
                </p>
                <label className="flex items-center gap-3 py-1 text-sm leading-relaxed">
                  <input
                    type="checkbox"
                    className="size-4 shrink-0"
                    checked={draft.isActive}
                    onChange={(e) => setDraft({ ...draft, isActive: e.target.checked })}
                  />{' '}
                  Paket aktif
                </label>
                <div className="flex flex-wrap gap-3 border-t pt-5">
                  <Button
                    type="submit"
                    className="h-10 w-full rounded-md border-0 px-4 shadow-none sm:w-auto"
                    disabled={
                      save.isPending ||
                      !draft.staffId ||
                      !Number.isInteger(draft.hours) ||
                      draft.hours < 1
                    }
                  >
                    Simpan paket
                  </Button>
                  {editing && (
                    <Button
                      type="button"
                      variant="ghost"
                      className="h-10 rounded-md border-0 px-4 shadow-none"
                      onClick={() => {
                        setEditing(undefined);
                        setDraft(emptyPlan(coach.id));
                      }}
                    >
                      Batal
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </section>
  );
}
