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
import { adminCourtCostingQueryOptionsById, adminCourtQueryOptions } from '@/queries/admin/court';
import {
  adminBulkDisableCourtSlotsMutationOptions,
  adminBulkUpdateCourtSlotPricingMutationOptions,
  adminUpdateSlotPriceMutationOptions,
  adminUpdateSlotAvailabilityMutationOptions
} from '@/mutations/admin/court';
import type { Slot } from '@/types/model';
import { IconPencil, IconPlus, IconPower } from '@tabler/icons-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createColumnHelper } from '@tanstack/react-table';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import 'dayjs/locale/id';
import { CalendarDays, ChevronDown, ChevronRight, CircleCheck, Clock3, Tags } from 'lucide-react';
import { useMemo, useState } from 'react';
import CreateCourtCostForm from './CreateCourtCostForm';

dayjs.extend(utc);
dayjs.extend(timezone);

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

type BulkEditSlotsModalProps = {
  mode?: 'pricing' | 'disable';
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
          {slot.scheduleClosed && (
            <>
              Ditutup oleh aturan jadwal. Ubah hari atau jam melalui Atur Jadwal Otomatis.
              <br />
            </>
          )}
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
          disabled={isUpdating || Boolean(slot.scheduleClosed)}
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

const BulkEditSlotsModal = ({
  courtId,
  dialogId,
  schedules,
  mode = 'pricing'
}: BulkEditSlotsModalProps) => {
  const isDisabling = mode === 'disable';
  const { closeDialog } = useDialog();
  const queryClient = useQueryClient();
  const [fromDate, setFromDate] = useState(dayjs().toDate());
  const [toDate, setToDate] = useState(dayjs().add(7, 'day').toDate());
  const [days, setDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [startHour, setStartHour] = useState(17);
  const [endHour, setEndHour] = useState(22);
  const [price, setPrice] = useState(0);
  const [discountPrice, setDiscountPrice] = useState(0);
  const [followRollingWindow, setFollowRollingWindow] = useState(true);
  const {
    data: court,
    isPending: isCourtLoading,
    isError: isCourtError
  } = useQuery(adminCourtQueryOptions(courtId));
  const rollingMonths = court?.bookingWindowMonths;
  const followsRolling = Boolean(rollingMonths && followRollingWindow);
  const today = dayjs().tz('Asia/Jakarta');
  const rollingEnd = today
    .startOf('day')
    .add(rollingMonths ?? 1, 'month')
    .endOf('day');

  const isDiscountInvalid = !isDisabling && discountPrice > price;
  const isHourRangeInvalid = endHour <= startHour;
  const isDateRangeInvalid = !followsRolling && dayjs(toDate).isBefore(dayjs(fromDate), 'day');

  const affectedSlotCount = useMemo(() => {
    const now = dayjs().tz('Asia/Jakarta');
    const from = followsRolling ? dayjs(now.format('YYYY-MM-DD')) : dayjs(fromDate).startOf('day');
    const to = followsRolling
      ? from.add(rollingMonths ?? 1, 'month').endOf('day')
      : dayjs(toDate).endOf('day');
    const selectedDays = new Set(days);

    return schedules.reduce((count, schedule) => {
      const scheduleDate = dayjs(dayjs.utc(schedule.date).format('YYYY-MM-DD'));

      if (
        scheduleDate.isBefore(from) ||
        scheduleDate.isAfter(to) ||
        !selectedDays.has(dayNumber(scheduleDate))
      ) {
        return count;
      }

      const slotCount = (schedule.slots || []).filter((slot) => {
        const hour = dayjs(slot.startAt).hour();
        return (
          hour >= startHour &&
          hour < endHour &&
          (!followsRolling ||
            dayjs(slot.startAt).isAfter(dayjs(now.format('YYYY-MM-DDTHH:mm:ss')))) &&
          (!isDisabling || (slot.isAvailable && !slot.scheduleClosed))
        );
      }).length;

      return count + slotCount;
    }, 0);
  }, [
    days,
    endHour,
    fromDate,
    schedules,
    startHour,
    toDate,
    isDisabling,
    followsRolling,
    rollingMonths
  ]);

  const onBulkSuccess = () => {
    queryClient.invalidateQueries({
      queryKey: adminCourtCostingQueryOptionsById(courtId).queryKey
    });
    queryClient.invalidateQueries({ queryKey: ['courts', 'slots'] });
    queryClient.invalidateQueries({ queryKey: ['admin', 'courts', 'slots'] });
    queryClient.invalidateQueries({ queryKey: ['admin', 'courts', courtId] });
    closeDialog(dialogId);
  };

  const { mutate: bulkDisableSlots, isPending: isDisablingSlots } = useMutation(
    adminBulkDisableCourtSlotsMutationOptions({ onSuccess: onBulkSuccess })
  );

  const { mutate: bulkUpdateSlotPricing, isPending: isUpdating } = useMutation(
    adminBulkUpdateCourtSlotPricingMutationOptions({
      onSuccess: onBulkSuccess
    })
  );

  const submitDisabled =
    isUpdating ||
    isDisablingSlots ||
    isCourtLoading ||
    isCourtError ||
    isDiscountInvalid ||
    isHourRangeInvalid ||
    isDateRangeInvalid ||
    days.length === 0 ||
    (!followsRolling && affectedSlotCount === 0);

  return (
    <DialogContent className="lg:min-w-xl">
      <DialogHeader>
        <DialogTitle>{isDisabling ? 'Bulk Nonaktifkan Slot' : 'Bulk Edit Harga Slot'}</DialogTitle>
        <DialogDescription>
          {isDisabling
            ? 'Nonaktifkan beberapa slot sekaligus berdasarkan tanggal, hari, dan jam. Slot yang sudah dibooking akan dilewati.'
            : 'Update harga beberapa slot sekaligus berdasarkan tanggal, hari, dan jam.'}
        </DialogDescription>
      </DialogHeader>

      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (submitDisabled) return;
          const filter = {
            followRollingWindow: followsRolling,
            fromDate: followsRolling
              ? today.format('YYYY-MM-DD')
              : dayjs(fromDate).format('YYYY-MM-DD'),
            toDate: followsRolling
              ? rollingEnd.format('YYYY-MM-DD')
              : dayjs(toDate).format('YYYY-MM-DD'),
            days,
            startHour,
            endHour
          };
          if (isDisabling) {
            bulkDisableSlots({
              courtId,
              data: filter
            });
            return;
          }
          bulkUpdateSlotPricing({
            courtId,
            data: {
              ...filter,
              price,
              discountPrice
            }
          });
        }}
      >
        {isCourtError && (
          <p role="alert">Pengaturan jadwal gagal dimuat. Buka kembali form untuk mencoba lagi.</p>
        )}
        {rollingMonths && (
          <Field>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={followRollingWindow}
                onChange={(event) => setFollowRollingWindow(event.target.checked)}
              />
              Ikuti rolling window
            </label>
            <p className="text-muted-foreground text-sm">
              {followsRolling
                ? `Aturan berlaku mulai sekarang untuk ${rollingMonths} bulan ke depan, termasuk tanggal baru saat jadwal diperpanjang otomatis. Batas saat ini ${rollingEnd.format('DD/MM/YYYY')} (waktu Jakarta).`
                : 'Perubahan hanya berlaku pada slot dalam rentang tanggal yang dipilih.'}
            </p>
          </Field>
        )}
        {!followsRolling && (
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
        )}

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

        {!isDisabling && (
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
        )}

        <div className="bg-muted/40 rounded-md border px-3 py-2 text-sm" aria-live="polite">
          {isDisabling
            ? `${affectedSlotCount} slot tersedia akan dinonaktifkan.`
            : `${affectedSlotCount} slot cocok dengan filter ini.`}
          {followsRolling && (
            <p className="mt-1">
              Aturan juga diterapkan ke slot baru. Booking yang sudah ada dilewati.
            </p>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => closeDialog(dialogId)}>
            Batal
          </Button>
          <Button
            type="submit"
            variant={isDisabling ? 'destructive' : 'default'}
            disabled={submitDisabled}
          >
            {isUpdating || isDisablingSlots
              ? 'Memproses...'
              : isDisabling
                ? followsRolling
                  ? 'Simpan Aturan Penutupan'
                  : 'Nonaktifkan Slot'
                : followsRolling
                  ? 'Simpan Aturan Harga'
                  : 'Terapkan'}
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
      colHelper.accessor((row) => dayjs.utc(row.date).format('DD/MM/YYYY'), {
        id: 'date',
        header: 'Tanggal',
        sortingFn: (a, b) =>
          dayjs.utc(a.original.date).valueOf() - dayjs.utc(b.original.date).valueOf(),
        cell: ({ row, getValue }) => (
          <div className="flex items-center gap-2">
            {row.getCanExpand() ? (
              <Button
                variant="ghost"
                size="icon"
                aria-label={`${row.getIsExpanded() ? 'Tutup' : 'Lihat'} slot ${getValue()}`}
                className="text-muted-foreground size-8"
                {...{
                  onClick: row.getToggleExpandedHandler(),
                  style: { cursor: 'pointer' }
                }}
              >
                {row.getIsExpanded() ? <ChevronDown /> : <ChevronRight />}
              </Button>
            ) : null}
            <div className="space-y-1">
              <span className="font-medium">{getValue()}</span>
              <p className="text-muted-foreground text-xs">
                {dayjs.utc(row.original.date).locale('id').format('dddd')}
              </p>
            </div>
          </div>
        )
      }),
      colHelper.display({
        id: 'hours',
        header: 'Rentang Jam',
        cell: ({ row }) => {
          const slots = row.original.slots;
          return slots.length ? (
            <span className="text-muted-foreground text-sm">
              {formatSlotTimeRange(slots[0].startAt, slots.at(-1)!.endAt)}
            </span>
          ) : (
            '-'
          );
        }
      }),
      colHelper.display({
        id: 'availability',
        header: 'Ketersediaan',
        cell: ({ row }) => {
          const slots = row.original.slots;
          const available = slots.filter((slot) => slot.isAvailable && !slot.scheduleClosed).length;
          return (
            <div className="flex items-center gap-2">
              <Badge variant={available ? 'lightSuccess' : 'lightDestructive'}>
                {available} tersedia
              </Badge>
              <span className="text-muted-foreground text-xs">dari {slots.length} slot</span>
            </div>
          );
        }
      }),
      colHelper.display({
        id: 'prices',
        header: 'Harga per Jam',
        cell: ({ row }) => {
          const prices = row.original.slots.map((slot) =>
            slot.discountPrice && slot.discountPrice < slot.price ? slot.discountPrice : slot.price
          );
          if (!prices.length) return '-';
          const min = Math.min(...prices),
            max = Math.max(...prices);
          const currency = (value: number) => `Rp ${value.toLocaleString('id-ID')}`;
          return (
            <span className="text-sm font-medium">
              {currency(min)}
              {min !== max ? ` – ${currency(max)}` : ''}
            </span>
          );
        }
      })
    ],
    [colHelper]
  );

  const { data, isPending } = useQuery(adminCourtCostingQueryOptionsById(courtId));
  const { data: court } = useQuery(adminCourtQueryOptions(courtId));

  const normalizedData = useMemo(() => {
    if (!data) {
      return [];
    }

    return data.map((entry) => ({
      ...entry,
      slots: [...(entry.slots || [])].sort((a, b) => dayjs(a.startAt).diff(dayjs(b.startAt)))
    }));
  }, [data]);

  const totalSlots = normalizedData.reduce((count, entry) => count + entry.slots.length, 0);
  const availableSlots = normalizedData.reduce(
    (count, entry) =>
      count + entry.slots.filter((slot) => slot.isAvailable && !slot.scheduleClosed).length,
    0
  );
  const actions = (
    <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center">
      <ManagedDialog id="bulk-edit-court-slot-pricing">
        <DialogTrigger asChild>
          <Button variant="outline">
            <Tags />
            Bulk Edit Harga
          </Button>
        </DialogTrigger>
        <BulkEditSlotsModal
          courtId={courtId}
          dialogId="bulk-edit-court-slot-pricing"
          schedules={normalizedData}
        />
      </ManagedDialog>
      <ManagedDialog id="bulk-disable-court-slots">
        <DialogTrigger asChild>
          <Button variant="outline">
            <IconPower />
            Bulk Nonaktifkan Slot
          </Button>
        </DialogTrigger>
        <BulkEditSlotsModal
          courtId={courtId}
          dialogId="bulk-disable-court-slots"
          schedules={normalizedData}
          mode="disable"
        />
      </ManagedDialog>
      <ManagedDialog id="create-court-costing">
        <DialogTrigger asChild>
          <Button>
            <IconPlus />
            Atur Jadwal Otomatis
          </Button>
        </DialogTrigger>
        <DialogContent className="lg:min-w-xl">
          <DialogHeader className="mb-4">
            <DialogTitle>Atur Jadwal Berjalan</DialogTitle>
          </DialogHeader>
          <CreateCourtCostForm courtId={courtId} />
        </DialogContent>
      </ManagedDialog>
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-3">
        {[
          {
            label: 'Window Booking',
            value: court?.bookingWindowMonths
              ? `${court.bookingWindowMonths} bulan ke depan`
              : 'Rentang tanggal',
            detail: court?.bookingWindowMonths
              ? 'Diperpanjang otomatis setiap hari'
              : 'Mengikuti jadwal yang tersimpan',
            Icon: CalendarDays
          },
          {
            label: 'Tanggal Terjadwal',
            value: `${normalizedData.length} hari`,
            detail: `${totalSlots} slot dalam jadwal`,
            Icon: Clock3
          },
          {
            label: 'Slot Tersedia',
            value: `${availableSlots} slot`,
            detail: `Dari ${totalSlots} slot dalam jadwal`,
            Icon: CircleCheck
          }
        ].map(({ label, value, detail, Icon }) => (
          <div key={label} className="bg-card flex items-start gap-3 rounded-xl border p-4 sm:p-5">
            <div className="bg-primary/10 text-primary rounded-lg p-2.5">
              <Icon className="size-5" />
            </div>
            <div className="min-w-0">
              <p className="text-muted-foreground text-xs font-medium">{label}</p>
              <p className="mt-1 text-lg font-semibold tracking-tight">{isPending ? '—' : value}</p>
              <p className="text-muted-foreground mt-1 text-xs">{detail}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="bg-card overflow-hidden rounded-xl border">
        <div className="flex flex-col gap-4 border-b p-4 sm:p-5 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h2 className="font-semibold">Daftar Jadwal</h2>
            <p className="text-muted-foreground mt-1 text-sm">
              Buka tanggal untuk melihat dan mengatur slot per jam.
            </p>
          </div>
          {actions}
        </div>
        <div className="p-4 sm:p-5">
          <DataTable
            loading={isPending}
            data={normalizedData || []}
            columns={columns}
            enableRowSelection={false}
            enableColumnVisibility={false}
            searchPlaceholder="Cari tanggal: 30/10/2026"
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
            expandAllLabels={{ expand: 'Buka Semua Tanggal', collapse: 'Tutup Semua Tanggal' }}
            renderSubRow={(row) => (
              <div className="overflow-x-auto px-1 pb-3 sm:px-4">
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
                              <span className="font-semibold text-green-700">
                                {formattedDiscount}
                              </span>
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
                                <Button
                                  size="icon"
                                  variant="lightInfo"
                                  aria-label={`Ubah harga ${formatSlotTimeRange(slot.startAt, slot.endAt)}`}
                                >
                                  <IconPencil />
                                </Button>
                              </DialogTrigger>
                              <EditSlotModal
                                slot={slot}
                                courtId={courtId}
                                dialogId={dialogEditId}
                              />
                            </ManagedDialog>
                            <ManagedDialog id={dialogId}>
                              <DialogTrigger asChild>
                                <Button
                                  size="icon"
                                  variant="lightInfo"
                                  aria-label={`Ubah status ${formatSlotTimeRange(slot.startAt, slot.endAt)}`}
                                >
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
          />
        </div>
      </div>
    </div>
  );
};
export default CourtCostingTable;
