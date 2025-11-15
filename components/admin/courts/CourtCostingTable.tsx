'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ManagedDialog } from '@/components/ui/dialog-context';
import { formatSlotTimeRange } from '@/lib/time-utils';
import { adminCourtCostingQueryOptions } from '@/queries/admin/court';
import type { Slot } from '@/types/model';
import { IconPlus } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { createColumnHelper } from '@tanstack/react-table';
import dayjs from 'dayjs';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useMemo } from 'react';
import CreateCourtCostForm from './CreateCourtCostForm';

type Props = {
  courtId: string;
};

const CourtCostingTable = ({ courtId }: Props) => {
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
            {dayjs(getValue()).format('DD/MM/YYYY')}
          </div>
        )
      })
    ],
    [colHelper]
  );

  const { data, isPending } = useQuery(adminCourtCostingQueryOptions(courtId));

  const normalizedData = useMemo(() => {
    if (!data) {
      return [];
    }

    return data.map((entry) => ({
      ...entry,
      slots: [...(entry.slots || [])].sort((a, b) => dayjs(a.startAt).diff(dayjs(b.startAt)))
    }));
  }, [data]);

  return (
    <DataTable
      loading={isPending}
      data={normalizedData || []}
      columns={columns}
      enableRowSelection={false}
      enableColumnVisibility={false}
      getSubRows={(row) => {
        // Only expand for top-level date rows, not for sub rows
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
        <ManagedDialog id="create-court-costing">
          <DialogTrigger asChild>
            <Button>
              <IconPlus />
              Tambah
            </Button>
          </DialogTrigger>
          <DialogContent className="lg:min-w-xl">
            <DialogHeader className="mb-4">
              <DialogTitle>Buat Cost Lapangan</DialogTitle>
            </DialogHeader>
            <CreateCourtCostForm courtId={courtId} />
          </DialogContent>
        </ManagedDialog>
      }
    />
  );
};
export default CourtCostingTable;
