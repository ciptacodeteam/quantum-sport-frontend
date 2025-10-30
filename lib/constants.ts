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

export enum BookingStatus {
  HOLD = 'HOLD', // temporary hold on slots before payment (expiry)
  CONFIRMED = 'CONFIRMED', // paid; slots locked
  CANCELLED = 'CANCELLED'
}

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
