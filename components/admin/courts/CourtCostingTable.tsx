'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { NumberInput } from '@/components/ui/number-input';
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { ManagedDialog, useDialog } from '@/components/ui/dialog-context';
import { formatSlotTimeRange } from '@/lib/time-utils';
import { adminCourtCostingQueryOptionsById } from '@/queries/admin/court';
import {
  adminUpdateSlotPriceMutationOptions,
  adminUpdateSlotAvailabilityMutationOptions
} from '@/mutations/admin/court';
import type { Slot } from '@/types/model';
import { IconPencil, IconPlus, IconPower } from '@tabler/icons-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createColumnHelper } from '@tanstack/react-table';
import dayjs from 'dayjs';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useMemo, useState } from 'react';
import CreateCourtCostForm from './CreateCourtCostForm';

type Props = {
  courtId: string;
};

type ToggleSlotModalProps = {
  slot: Slot;
  courtId: string;
  dialogId: string;
};

type EditSlotModalProps = {
  slot: Slot;
  courtId: string;
  dialogId: string;
};

const ToggleSlotModal = ({ slot, courtId, dialogId }: ToggleSlotModalProps) => {
  const { closeDialog } = useDialog();
  const queryClient = useQueryClient();
  const isAvailable = slot.isAvailable;

  const { mutate: updateSlotAvailability, isPending: isUpdating } = useMutation(
    adminUpdateSlotAvailabilityMutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: adminCourtCostingQueryOptionsById(courtId).queryKey
        });
        closeDialog(dialogId);
      }
    })
  );

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Ubah Status Slot</DialogTitle>
        <DialogDescription>
          Slot: {formatSlotTimeRange(slot.startAt, slot.endAt)}
          <br />
          Status saat ini: <strong>{isAvailable ? 'Tersedia' : 'Tidak Tersedia'}</strong>
        </DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <Button variant="outline" onClick={() => closeDialog(dialogId)}>
          Batal
        </Button>
        <Button
          variant={isAvailable ? 'destructive' : 'default'}
          onClick={() => {
            updateSlotAvailability({ slotId: slot.id, isAvailable: !isAvailable });
          }}
          disabled={isUpdating}
        >
          {isUpdating ? 'Memproses...' : isAvailable ? 'Nonaktifkan' : 'Aktifkan'}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
};

const EditSlotModal = ({ slot, courtId, dialogId }: EditSlotModalProps) => {
  const { closeDialog } = useDialog();
  const queryClient = useQueryClient();
  const [price, setPrice] = useState(slot.price || 0);
  const [discountPrice, setDiscountPrice] = useState(slot.discountPrice || 0);

  const isDiscountInvalid = (discountPrice || 0) > (price || 0);

  const { mutate: updateSlotPrice, isPending: isUpdating } = useMutation(
    adminUpdateSlotPriceMutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: adminCourtCostingQueryOptionsById(courtId).queryKey
        });
        closeDialog(dialogId);
      }
    })
  );

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Ubah Harga Slot</DialogTitle>
        <DialogDescription>Slot: {formatSlotTimeRange(slot.startAt, slot.endAt)}</DialogDescription>
      </DialogHeader>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          updateSlotPrice({
            slotId: slot.id,
            price: price || 0,
            discountPrice: discountPrice || 0
          });
        }}
      >
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <p className="text-sm font-medium">Harga Normal</p>
            <NumberInput
              thousandSeparator="."
              decimalSeparator=","
              prefix="Rp "
              min={0}
              allowNegative={false}
              placeholder="e.g. Rp 100.000"
              value={price}
              onValueChange={(value) => setPrice(value || 0)}
              withControl={false}
            />
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Harga Diskon</p>
            <NumberInput
              thousandSeparator="."
              decimalSeparator=","
              prefix="Rp "
              min={0}
              allowNegative={false}
              placeholder="e.g. Rp 80.000"
              value={discountPrice}
              onValueChange={(value) => setDiscountPrice(value || 0)}
              withControl={false}
            />
            {isDiscountInvalid && (
              <p className="text-destructive text-xs">
                Harga diskon tidak boleh melebihi harga normal.
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => closeDialog(dialogId)}>
            Batal
          </Button>
          <Button type="submit" disabled={isUpdating || isDiscountInvalid}>
            {isUpdating ? 'Memproses...' : 'Simpan'}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
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

  const { data, isPending } = useQuery(adminCourtCostingQueryOptionsById(courtId));

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
                cell: (info) => {
                  const slot = info.row.original as Slot;
                  const isAvailable = info.getValue() as boolean;
                  return (
                    <Badge variant={isAvailable ? 'lightSuccess' : 'lightDestructive'}>
                      {isAvailable ? 'Tersedia' : 'Tidak Tersedia'}
                    </Badge>
                  );
                }
              },
              {
                accessorKey: 'price',
                header: 'Harga (IDR)',
                cell: (info) => {
                  const slot = info.row.original as Slot;
                  const normalPrice = slot.price || 0;
                  const discountPrice = slot.discountPrice || 0;
                  const formattedNormal = normalPrice.toLocaleString('id-ID', {
                    style: 'currency',
                    currency: 'IDR',
                    minimumFractionDigits: 0
                  });
                  const formattedDiscount = discountPrice.toLocaleString('id-ID', {
                    style: 'currency',
                    currency: 'IDR',
                    minimumFractionDigits: 0
                  });

                  if (discountPrice > 0 && discountPrice < normalPrice) {
                    return (
                      <div className="flex flex-col text-xs">
                        <span className="text-muted-foreground line-through">
                          {formattedNormal}
                        </span>
                        <span className="font-semibold text-green-700">{formattedDiscount}</span>
                      </div>
                    );
                  }

                  return formattedNormal;
                }
              },
              {
                id: 'actions',
                header: 'Aksi',
                cell: (info) => {
                  const slot = info.row.original as Slot;
                  const dialogId = `toggle-slot-${slot.id}`;
                  const dialogEditId = `edit-slot-${slot.id}`;
                  return (
                    <div className="flex justify-end gap-2">
                      <ManagedDialog id={dialogEditId}>
                        <DialogTrigger asChild>
                          <Button size="icon" variant="lightInfo">
                            <IconPencil />
                          </Button>
                        </DialogTrigger>
                        <EditSlotModal slot={slot} courtId={courtId} dialogId={dialogEditId} />
                      </ManagedDialog>
                      <ManagedDialog id={dialogId}>
                        <DialogTrigger asChild>
                          <Button size="icon" variant="lightInfo">
                            <IconPower />
                          </Button>
                        </DialogTrigger>
                        <ToggleSlotModal slot={slot} courtId={courtId} dialogId={dialogId} />
                      </ManagedDialog>
                    </div>
                  );
                }
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
