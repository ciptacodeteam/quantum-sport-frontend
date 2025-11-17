import type { BadgeVariant } from '@/components/ui/badge';

export const SUPPORT_CIPTACODE_PHONE_NUMBER = '+6285360027891';
export const SUPPORT_PHONE_NUMBER = '+6281234567890';

const ACTIVE = 1;
const INACTIVE = 0;

export const STATUS = {
  ACTIVE,
  INACTIVE
} as const;

export type Status = (typeof STATUS)[keyof typeof STATUS];

export const STATUS_MAP: Record<number, string> = {
  [ACTIVE]: 'Active',
  [INACTIVE]: 'Inactive'
};

export const STATUS_OPTIONS: Array<{ label: string; value: number }> = [
  { label: 'Active', value: ACTIVE },
  { label: 'Inactive', value: INACTIVE }
];

export const STATUS_BADGE_VARIANT: Record<number, BadgeVariant['variant']> = {
  [ACTIVE]: 'lightSuccess',
  [INACTIVE]: 'lightDestructive'
};

export const ROLE = {
  ADMIN: 'ADMIN',
  USER: 'USER',
  BALLBOY: 'BALLBOY',
  COACH: 'COACH',
  CASHIER: 'CASHIER'
} as const;

export type Role = keyof typeof ROLE;

export const GENDER = {
  MALE: 'MALE',
  FEMALE: 'FEMALE',
  ALL: 'ALL'
} as const;

export type Gender = keyof typeof GENDER;

export const GENDER_MAP: Record<Gender, string> = {
  [GENDER.MALE]: 'Male',
  [GENDER.FEMALE]: 'Female',
  [GENDER.ALL]: 'All'
};

export const GENDER_OPTIONS: Array<{ label: string; value: Gender }> = [
  { label: 'Male', value: GENDER.MALE },
  { label: 'Female', value: GENDER.FEMALE },
  { label: 'All', value: GENDER.ALL }
];

export const GENDER_BADGE_VARIANT: Record<Gender, BadgeVariant['variant']> = {
  [GENDER.MALE]: 'lightInfo',
  [GENDER.FEMALE]: 'lightInfo',
  [GENDER.ALL]: 'lightSuccess'
};

export const ROLE_MAP: Record<Role, string> = {
  [ROLE.ADMIN]: 'Admin',
  [ROLE.USER]: 'User',
  [ROLE.BALLBOY]: 'Ballboy',
  [ROLE.COACH]: 'Coach',
  [ROLE.CASHIER]: 'Cashier'
};

export const ROLE_OPTIONS: Array<{ label: string; value: Role }> = [
  { label: 'Admin', value: ROLE.ADMIN },
  { label: 'User', value: ROLE.USER },
  { label: 'Ballboy', value: ROLE.BALLBOY },
  { label: 'Coach', value: ROLE.COACH },
  { label: 'Cashier', value: ROLE.CASHIER }
];

export const ROLE_BADGE_VARIANT: Record<Role, BadgeVariant['variant']> = {
  [ROLE.ADMIN]: 'lightSuccess',
  [ROLE.USER]: 'lightNeutral',
  [ROLE.BALLBOY]: 'lightInfo',
  [ROLE.COACH]: 'lightWarning',
  [ROLE.CASHIER]: 'lightDestructive'
};

export const SlotType = {
  COURT: 'COURT',
  COACH: 'COACH',
  BALLBOY: 'BALLBOY'
} as const;

export type SlotType = keyof typeof SlotType;

export const SLOT_TYPE_MAP: Record<SlotType, string> = {
  [SlotType.COURT]: 'Court',
  [SlotType.COACH]: 'Coach',
  [SlotType.BALLBOY]: 'Ballboy'
};

export const SLOT_TYPE_OPTIONS: Array<{ label: string; value: SlotType }> = [
  { label: 'Court', value: SlotType.COURT },
  { label: 'Coach', value: SlotType.COACH },
  { label: 'Ballboy', value: SlotType.BALLBOY }
];

export const SLOT_TYPE_BADGE_VARIANT: Record<SlotType, BadgeVariant['variant']> = {
  [SlotType.COURT]: 'lightSuccess',
  [SlotType.COACH]: 'lightWarning',
  [SlotType.BALLBOY]: 'lightInfo'
};

export const BookingStatus = {
  HOLD: 'HOLD', // temporary hold on slots before payment (expiry)
  CONFIRMED: 'CONFIRMED', // paid; slots locked
  CANCELLED: 'CANCELLED'
} as const;

export type BookingStatus = keyof typeof BookingStatus;

export const BOOKING_STATUS_MAP: Record<BookingStatus, string> = {
  [BookingStatus.HOLD]: 'Hold',
  [BookingStatus.CONFIRMED]: 'Confirmed',
  [BookingStatus.CANCELLED]: 'Cancelled'
};

export const BOOKING_STATUS_OPTIONS: Array<{ label: string; value: BookingStatus }> = [
  { label: 'Hold', value: BookingStatus.HOLD },
  { label: 'Confirmed', value: BookingStatus.CONFIRMED },
  { label: 'Cancelled', value: BookingStatus.CANCELLED }
];

export const BOOKING_STATUS_BADGE_VARIANT: Record<BookingStatus, BadgeVariant['variant']> = {
  [BookingStatus.HOLD]: 'lightWarning',
  [BookingStatus.CONFIRMED]: 'lightSuccess',
  [BookingStatus.CANCELLED]: 'lightDestructive'
};

export const daysOfWeek = [
  { label: 'Senin', value: 1 },
  { label: 'Selasa', value: 2 },
  { label: 'Rabu', value: 3 },
  { label: 'Kamis', value: 4 },
  { label: 'Jumat', value: 5 },
  { label: 'Sabtu', value: 6 },
  { label: 'Minggu', value: 7 }
] as const;

export const hoursInDay = Array.from({ length: 24 }, (_, i) => ({
  label: i === 0 ? '00:00' : i < 10 ? `0${i}:00` : `${i}:00`,
  value: i
}));

export const dummyNotification = [
  {
    id: '1',
    read: false,
    title: 'Pembayaran Berhasil',
    content: 'Pembayaran untuk booking lapangan telah berhasil diproses.',
    time: '2 jam yang lalu'
  },
  {
    id: '2',
    read: false,
    title: 'Booking Dikonfirmasi',
    content: 'Booking Anda untuk tanggal 15 Januari 2024 telah dikonfirmasi.',
    time: '5 jam yang lalu'
  },
  {
    id: '3',
    read: true,
    title: 'Reminder: Booking Besok',
    content: 'Jangan lupa, Anda memiliki booking besok pukul 14:00.',
    time: '1 hari yang lalu'
  },
  {
    id: '4',
    read: true,
    title: 'Pembayaran Berhasil',
    content: 'Pembayaran untuk kelas telah berhasil diproses.',
    time: '2 hari yang lalu'
  },
  {
    id: '5',
    read: false,
    title: 'Kelas Baru Tersedia',
    content: 'Kelas baru "Padel untuk Pemula" sekarang tersedia untuk didaftar.',
    time: '3 hari yang lalu'
  }
];