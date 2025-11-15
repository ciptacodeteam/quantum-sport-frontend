import type { BadgeVariant } from '@/components/ui/badge';

export const SUPPORT_CIPTACODE_PHONE_NUMBER = '+6285360027891';
export const SUPPORT_PHONE_NUMBER = '+6281234567890';

const ACTIVE = 1;
const INACTIVE = 0;

export const STATUS = {
  ACTIVE,
  INACTIVE
};

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

export enum Role {
  ADMIN = 'ADMIN',
  USER = 'USER',
  BALLBOY = 'BALLBOY',
  COACH = 'COACH'
}

export enum Gender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  ALL = 'ALL'
}

export const GENDER_MAP: Record<Gender, string> = {
  [Gender.MALE]: 'Male',
  [Gender.FEMALE]: 'Female',
  [Gender.ALL]: 'All'
};

export const GENDER_OPTIONS: Array<{ label: string; value: Gender }> = [
  { label: 'Male', value: Gender.MALE },
  { label: 'Female', value: Gender.FEMALE },
  { label: 'All', value: Gender.ALL }
];

export const GENDER_BADGE_VARIANT: Record<Gender, BadgeVariant['variant']> = {
  [Gender.MALE]: 'lightInfo',
  [Gender.FEMALE]: 'lightInfo',
  [Gender.ALL]: 'lightSuccess'
};

export const ROLE_MAP: Record<Role, string> = {
  [Role.ADMIN]: 'Admin',
  [Role.USER]: 'User',
  [Role.BALLBOY]: 'Ballboy',
  [Role.COACH]: 'Coach'
};

export const ROLE_OPTIONS: Array<{ label: string; value: Role }> = [
  { label: 'Admin', value: Role.ADMIN },
  { label: 'User', value: Role.USER },
  { label: 'Ballboy', value: Role.BALLBOY },
  { label: 'Coach', value: Role.COACH }
];

export const ROLE_BADGE_VARIANT: Record<Role, BadgeVariant['variant']> = {
  [Role.ADMIN]: 'lightSuccess',
  [Role.USER]: 'lightNeutral',
  [Role.BALLBOY]: 'lightInfo',
  [Role.COACH]: 'lightWarning'
};

export enum SlotType {
  COURT = 'COURT',
  COACH = 'COACH',
  BALLBOY = 'BALLBOY'
}

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
];

export const hoursInDay = Array.from({ length: 24 }, (_, i) => ({
  label: i === 0 ? '00:00' : i < 10 ? `0${i}:00` : `${i}:00`,
  value: i
}));
