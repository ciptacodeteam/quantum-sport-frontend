'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import DatePickerInput from '@/components/ui/date-picker-input';
import { NumberInput } from '@/components/ui/number-input';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { ManagedDialog, useDialog } from '@/components/ui/dialog-context';
import MultiSelectInput from '@/components/ui/multi-select-input';
import { daysOfWeek, hoursInDay } from '@/lib/constants';
import { formatSlotTimeRange } from '@/lib/time-utils';
import { adminCourtCostingQueryOptionsById } from '@/queries/admin/court';
import {
  adminBulkUpdateCourtSlotPricingMutationOptions,
  adminUpdateSlotPriceMutationOptions,
  adminUpdateSlotAvailabilityMutationOptions
} from '@/mutations/admin/court';
import type { Slot } from '@/types/model';
import { IconPencil, IconPlus, IconPower } from '@tabler/icons-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createColumnHelper } from '@tanstack/react-table';
import dayjs from 'dayjs';
import { ChevronDown, ChevronRight, Tags } from 'lucide-react';
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

type BulkEditSlotPriceModalProps = {
  courtId: string;
  dialogId: string;
  schedules: { date: string; slots: Slot[] }[];
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

const dayNumber = (date: dayjs.ConfigType) => {
  const jsDay = dayjs(date).day();
  return jsDay === 0 ? 7 : jsDay;
};

const formatHour = (hour: number) => `${hour.toString().padStart(2, '0')}:00`;

const BulkEditSlotPriceModal = ({ courtId, dialogId, schedules }: BulkEditSlotPriceModalProps) => {
  const { closeDialog } = useDialog();
  const queryClient = useQueryClient();
  const [fromDate, setFromDate] = useState(dayjs().toDate());
  const [toDate, setToDate] = useState(dayjs().add(7, 'day').toDate());
  const [days, setDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [startHour, setStartHour] = useState(17);
  const [endHour, setEndHour] = useState(22);
  const [price, setPrice] = useState(0);
  const [discountPrice, setDiscountPrice] = useState(0);

  const isDiscountInvalid = discountPrice > price;
  const isHourRangeInvalid = endHour <= startHour;
  const isDateRangeInvalid = dayjs(toDate).isBefore(dayjs(fromDate), 'day');

  const affectedSlotCount = useMemo(() => {
    const from = dayjs(fromDate).startOf('day');
    const to = dayjs(toDate).endOf('day');
    const selectedDays = new Set(days);

    return schedules.reduce((count, schedule) => {
      const scheduleDate = dayjs(schedule.date);

      if (
        scheduleDate.isBefore(from) ||
        scheduleDate.isAfter(to) ||
        !selectedDays.has(dayNumber(scheduleDate))
      ) {
        return count;
      }

      const slotCount = (schedule.slots || []).filter((slot) => {
        const hour = dayjs(slot.startAt).hour();
        return hour >= startHour && hour < endHour;
      }).length;

      return count + slotCount;
    }, 0);
  }, [days, endHour, fromDate, schedules, startHour, toDate]);

  const { mutate: bulkUpdateSlotPricing, isPending: isUpdating } = useMutation(
    adminBulkUpdateCourtSlotPricingMutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: adminCourtCostingQueryOptionsById(courtId).queryKey
        });
        queryClient.invalidateQueries({
          queryKey: ['courts', 'slots']
        });
        closeDialog(dialogId);
      }
    })
  );

  const submitDisabled =
    isUpdating ||
    isDiscountInvalid ||
    isHourRangeInvalid ||
    isDateRangeInvalid ||
    days.length === 0 ||
    affectedSlotCount === 0;

  return (
    <DialogContent className="lg:min-w-xl">
      <DialogHeader>
        <DialogTitle>Bulk Edit Harga Slot</DialogTitle>
        <DialogDescription>
          Update harga beberapa slot sekaligus berdasarkan tanggal, hari, dan jam.
        </DialogDescription>
      </DialogHeader>

      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          bulkUpdateSlotPricing({
            courtId,
            data: {
              fromDate: dayjs(fromDate).format('YYYY-MM-DD'),
              toDate: dayjs(toDate).format('YYYY-MM-DD'),
              days,
              startHour,
              endHour,
              price,
              discountPrice
            }
          });
        }}
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field>
            <FieldLabel>Dari Tanggal</FieldLabel>
            <DatePickerInput
              value={fromDate}
              onValueChange={(date) => {
                if (date) {
                  setFromDate(date);
                }
              }}
            />
          </Field>
          <Field>
            <FieldLabel>Sampai Tanggal</FieldLabel>
            <DatePickerInput
              value={toDate}
              onValueChange={(date) => {
                if (date) {
                  setToDate(date);
                }
              }}
            />
            {isDateRangeInvalid && (
              <FieldError>Tanggal akhir tidak boleh sebelum tanggal mulai.</FieldError>
            )}
          </Field>
        </div>

        <Field>
          <FieldLabel>Hari</FieldLabel>
          <MultiSelectInput
            options={daysOfWeek.map((day) => ({
              label: day.label,
              value: day.value.toString()
            }))}
            value={daysOfWeek
              .filter((day) => days.includes(day.value))
              .map((day) => ({
                label: day.label,
                value: day.value.toString()
              }))}
            onChange={(selectedOptions) =>
              setDays(selectedOptions.map((option) => parseInt(option.value)))
            }
            placeholder="Pilih hari"
            emptyIndicator="Tidak ada hari tersedia"
          />
          {days.length === 0 && <FieldError>Pilih minimal satu hari.</FieldError>}
        </Field>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field>
            <FieldLabel>Jam Mulai</FieldLabel>
            <MultiSelectInput
              options={hoursInDay.slice(0, 24).map((hour) => ({
                label: hour.label,
                value: hour.value.toString()
              }))}
              value={[{ label: formatHour(startHour), value: startHour.toString() }]}
              onChange={(selectedOptions) => {
                const selected = selectedOptions.at(-1);
                if (selected) {
                  setStartHour(parseInt(selected.value));
                }
              }}
              placeholder="Pilih jam mulai"
              emptyIndicator="Tidak ada jam tersedia"
            />
          </Field>
          <Field>
            <FieldLabel>Jam Selesai</FieldLabel>
            <MultiSelectInput
              options={[...hoursInDay.slice(1), { label: '24:00', value: 24 }].map((hour) => ({
                label: hour.label,
                value: hour.value.toString()
              }))}
              value={[{ label: formatHour(endHour), value: endHour.toString() }]}
              onChange={(selectedOptions) => {
                const selected = selectedOptions.at(-1);
                if (selected) {
                  setEndHour(parseInt(selected.value));
                }
              }}
              placeholder="Pilih jam selesai"
              emptyIndicator="Tidak ada jam tersedia"
            />
            {isHourRangeInvalid && <FieldError>Jam selesai harus lebih besar.</FieldError>}
          </Field>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field>
            <FieldLabel>Harga Normal</FieldLabel>
            <NumberInput
              thousandSeparator="."
              decimalSeparator=","
              prefix="Rp "
              min={0}
              allowNegative={false}
              placeholder="e.g. Rp 250.000"
              value={price}
              onValueChange={(value) => setPrice(value || 0)}
              withControl={false}
            />
          </Field>
          <Field>
            <FieldLabel>Harga Diskon</FieldLabel>
            <NumberInput
              thousandSeparator="."
              decimalSeparator=","
              prefix="Rp "
              min={0}
              allowNegative={false}
              placeholder="e.g. Rp 200.000"
              value={discountPrice}
              onValueChange={(value) => setDiscountPrice(value || 0)}
              withControl={false}
            />
            {isDiscountInvalid && (
              <FieldError>Harga diskon tidak boleh melebihi harga normal.</FieldError>
            )}
          </Field>
        </div>

        <div className="bg-muted/40 rounded-md border px-3 py-2 text-sm">
          {affectedSlotCount} slot cocok dengan filter ini.
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => closeDialog(dialogId)}>
            Batal
          </Button>
          <Button type="submit" disabled={submitDisabled}>
            {isUpdating ? 'Memproses...' : 'Terapkan'}
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
        <div className="flex flex-wrap items-center gap-2">
          <ManagedDialog id="bulk-edit-court-slot-pricing">
            <DialogTrigger asChild>
              <Button variant="outline">
                <Tags />
                Bulk Edit Harga
              </Button>
            </DialogTrigger>
            <BulkEditSlotPriceModal
              courtId={courtId}
              dialogId="bulk-edit-court-slot-pricing"
              schedules={normalizedData}
            />
          </ManagedDialog>
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
        </div>
      }
    />
  );
};
export default CourtCostingTable;
