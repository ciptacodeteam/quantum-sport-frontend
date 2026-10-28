import { formatBookingDate } from '@/lib/booking-display';
import type {
  AdminBookedInventoryListItem,
  BookedCourtSlot
} from '@/queries/admin/bookedInventory';

export const inventoryCategoryLabels: Record<string, string> = {
  bola: 'Bola',
  raket: 'Raket',
  coach: 'Pelatih',
  ballboy: 'Ballboy',
  inventory: 'Inventori lain'
};
export const hasText = (value?: string | null): value is string =>
  !!value?.trim() && !['-', 'n/a', 'null', 'undefined'].includes(value.trim().toLowerCase());
export const hasAmount = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);
export const itemCustomer = (item: AdminBookedInventoryListItem) =>
  item.booking?.customer ?? item.booking?.user ?? item.customer;
export const itemInvoice = (item: AdminBookedInventoryListItem) =>
  item.booking?.invoice ?? item.invoice;
export const itemCategory = (item: AdminBookedInventoryListItem): string =>
  item.category || item.itemType || 'inventory';
export const inventoryStatusLabels: Record<string, string> = {
  CONFIRMED: 'Dikonfirmasi',
  HOLD: 'Menunggu',
  CANCELLED: 'Dibatalkan'
};
export const paymentStatusLabels: Record<string, string> = {
  PAID: 'Lunas',
  PENDING: 'Menunggu pembayaran',
  AWAITING_CONFIRMATION: 'Menunggu konfirmasi',
  CANCELLED: 'Dibatalkan',
  EXPIRED: 'Kedaluwarsa',
  REFUNDED: 'Dikembalikan'
};
export type InventorySchedule = { court?: string; date: string; start: string; end: string };
function normalize(slot: BookedCourtSlot): InventorySchedule | null {
  const start = slot.slot?.startAt ?? slot.startAt;
  const end = slot.slot?.endAt ?? slot.endAt;
  if (!start || !end) return null;
  const startLocal = formatBookingDate(start, 'YYYY-MM-DD HH:mm');
  const endLocal = formatBookingDate(end, 'YYYY-MM-DD HH:mm');
  if (startLocal === '-' || endLocal === '-') return null;
  return {
    court: hasText(slot.court?.name) ? slot.court.name : undefined,
    date: startLocal.slice(0, 10),
    start: startLocal,
    end: endLocal
  };
}
export function itemSchedules(item: AdminBookedInventoryListItem): InventorySchedule[] {
  const courtSlots = item.booking?.courtSlots?.length
    ? item.booking.courtSlots
    : (item.courtSlots ?? []);
  if (item.slot) {
    const session = normalize({ ...item.slot, court: item.slot.court });
    if (!session) return [];
    const matching = courtSlots
      .map(normalize)
      .filter(
        (slot): slot is InventorySchedule =>
          !!slot && slot.start < session.end && slot.end > session.start
      );
    return [{ ...session, court: session.court ?? matching.find((slot) => slot.court)?.court }];
  }
  const unique = new Map<string, InventorySchedule>();
  for (const raw of courtSlots) {
    const slot = normalize(raw);
    if (slot) unique.set(`${slot.court}-${slot.start}-${slot.end}`, slot);
  }
  return [...unique.values()].sort((a, b) => a.start.localeCompare(b.start));
}
export const scheduleDate = (schedule: InventorySchedule) =>
  formatBookingDate(schedule.start, 'DD MMM YYYY');
export const scheduleTime = (schedule: InventorySchedule) =>
  `${schedule.start.slice(11)}–${schedule.end.slice(11)} WIB`;
