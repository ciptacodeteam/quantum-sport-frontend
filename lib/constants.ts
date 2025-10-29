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
