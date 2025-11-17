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
import { useMemo } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import CreateStaffCostForm from './CreateStaffCostForm';
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
  staffId: string;
};

const StaffCostingTable = ({ staffId }: Props) => {
  const { data: staff, isPending: isStaffPending } = useQuery(adminStaffQueryOptions(staffId));

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

  const { data, isPending } = useQuery(adminCoachCostingQueryOptions(staffId));

  // Only show costing table for non-admin staff (coach, ballboy, etc.)
  if (!isStaffPending && staff && String(staff?.role) === String(ROLE.ADMIN)) {
    return null;
  }

  const getRoleLabel = () => {
    if (!staff) return 'Karyawan';
    const role = String(staff.role).toLowerCase();
    return role.charAt(0).toUpperCase() + role.slice(1);
  };

  return (
    <>
      <Separator className="mt-8 mb-4" />

      <Section>
        <SectionHeader>
          <SectionTitle title={`Jadwal & Biaya ${getRoleLabel()}`} />
          <SectionDescription
            description={`Pantau jadwal dan atur biaya slot ${getRoleLabel().toLowerCase()} di sini.`}
          />
        </SectionHeader>
        <SectionContent>
          <DataTable
            loading={isPending || isStaffPending}
            data={data || []}
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
                      cell: ({ row, getValue }) =>
                        `${dayjs(getValue()).format('HH:mm')} - ${dayjs(
                          (row.original as Slot).endAt
                        ).format('HH:mm')}`
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
              <ManagedDialog id="create-staff-costing">
                <DialogTrigger asChild>
                  <Button>
                    <IconPlus />
                    Tambah
                  </Button>
                </DialogTrigger>
                <DialogContent className="lg:min-w-xl">
                  <DialogHeader className="mb-4">
                    <DialogTitle>Buat Cost {getRoleLabel()}</DialogTitle>
                  </DialogHeader>
                  <CreateStaffCostForm staffId={staffId} />
                </DialogContent>
              </ManagedDialog>
            }
          />
        </SectionContent>
      </Section>
    </>
  );
};

export default StaffCostingTable;
