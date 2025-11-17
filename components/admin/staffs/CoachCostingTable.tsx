'use client';

import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ManagedDialog } from '@/components/ui/dialog-context';
import { Badge } from '@/components/ui/badge';
import { adminCoachCostingQueryOptions, adminStaffQueryOptions } from '@/queries/admin/staff';
import { type Slot } from '@/types/model';
import { IconPlus } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { createColumnHelper } from '@tanstack/react-table';
import dayjs from 'dayjs';
import { formatSlotTime, formatSlotTimeRange } from '@/lib/time-utils';
import { useMemo } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import CreateCoachCostForm from './CreateCoachCostForm';
import { ROLE } from '@/lib/constants';
import {
  Section,
  SectionContent,
  SectionDescription,
  SectionHeader,
  SectionTitle
} from '@/components/ui/section';
import { Separator } from '@/components/ui/separator';

type Props = {
  coachId: string;
};

const CoachCostingTable = ({ coachId }: Props) => {
  const { data: staff, isPending: isStaffPending } = useQuery(adminStaffQueryOptions(coachId));

  const colHelper = createColumnHelper<{ date: string; slots: Slot[] }>();

  const columns = useMemo(
    () => [
      colHelper.accessor('date', {
        header: 'Tanggal',
        cell: ({ row, getValue }) => (
          <div className="flex items-center gap-2">
            {row.getCanExpand() ? (
              <Button
                variant="ghost"
                size="icon"
                className="opacity-50"
                {...{
                  onClick: row.getToggleExpandedHandler(),
                  style: { cursor: 'pointer' }
                }}
              >
                {row.getIsExpanded() ? (
                  <ChevronDown className="rotate-180 transition-transform" />
                ) : (
                  <ChevronRight />
                )}
              </Button>
            ) : null}
            {formatSlotTime(getValue(), 'DD/MM/YYYY')}
          </div>
        )
      })
    ],
    [colHelper]
  );

  const { data, isPending } = useQuery(adminCoachCostingQueryOptions(coachId));

  const normalizedData = useMemo(() => {
    if (!data) {
      return [];
    }

    // Sort by date ascending with robust parsing, then sort slots by start time ascending
    const getTimeValue = (v: unknown) => {
      const d = dayjs(v as string);
      return d.isValid() ? d.valueOf() : Number.POSITIVE_INFINITY;
    };

    return [...data]
      .sort((a, b) => getTimeValue(a.date) - getTimeValue(b.date))
      .map((entry) => ({
        ...entry,
        slots: [...(entry.slots || [])].sort((a, b) => {
          const aT = dayjs(a.startAt);
          const bT = dayjs(b.startAt);
          const aV = aT.isValid() ? aT.valueOf() : Number.POSITIVE_INFINITY;
          const bV = bT.isValid() ? bT.valueOf() : Number.POSITIVE_INFINITY;
          return aV - bV;
        })
      }));
  }, [data]);

  if (!isStaffPending && staff && String(staff?.role) !== String(ROLE.COACH)) {
    return null;
  }

  return (
    <>
      <Separator className="mt-8 mb-4" />

      <Section>
        <SectionHeader>
          <SectionTitle title="Jadwal & Biaya Pelatih" />
          <SectionDescription description="Pantau jadwal dan atur biaya slot pelatih di sini." />
        </SectionHeader>
        <SectionContent>
          <DataTable
            loading={isPending || isStaffPending}
            data={normalizedData}
            columns={columns}
            enableRowSelection={false}
            enableColumnVisibility={false}
            getSubRows={(row) => {
              if (!('isSubRow' in row)) {
                if (Array.isArray(row.slots) && row.slots.length) {
                  return [{ ...row, isSubRow: true }];
                }
              }

              return undefined;
            }}
            enableExpandAllRows
            renderSubRow={(row) => (
              <div className="-mt-5 mb-4 overflow-x-auto px-4">
                <DataTable
                  data={row.slots || []}
                  enableGlobalSearch={false}
                  enableColumnVisibility={false}
                  enablePagination={false}
                  enablePageSize={false}
                  columns={[
                    {
                      accessorKey: 'startAt',
                      header: 'Waktu Mulai',
                      cell: ({ row, getValue }) => {
                        const slot = row.original as Slot;
                        return formatSlotTimeRange(getValue(), slot.endAt);
                      }
                    },
                    {
                      accessorKey: 'isAvailable',
                      header: 'Status',
                      cell: (info) => (
                        <Badge variant={info.getValue() ? 'lightSuccess' : 'lightDestructive'}>
                          {info.getValue() ? 'Tersedia' : 'Tidak Tersedia'}
                        </Badge>
                      )
                    },
                    {
                      accessorKey: 'price',
                      header: 'Harga (IDR)',
                      cell: (info) =>
                        info.getValue().toLocaleString('id-ID', {
                          style: 'currency',
                          currency: 'IDR',
                          minimumFractionDigits: 0
                        })
                    }
                  ]}
                  enableRowSelection={false}
                />
              </div>
            )}
            addButton={
              <ManagedDialog id="create-coach-costing">
                <DialogTrigger asChild>
                  <Button>
                    <IconPlus />
                    Tambah
                  </Button>
                </DialogTrigger>
                <DialogContent className="lg:min-w-xl">
                  <DialogHeader className="mb-4">
                    <DialogTitle>Buat Cost Coach</DialogTitle>
                  </DialogHeader>
                  <CreateCoachCostForm coachId={coachId} />
                </DialogContent>
              </ManagedDialog>
            }
          />
        </SectionContent>
      </Section>
    </>
  );
};

export default CoachCostingTable;
