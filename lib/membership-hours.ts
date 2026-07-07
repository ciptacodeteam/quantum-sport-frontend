export type MembershipType = 'ALL_HOUR' | 'HAPPY_HOUR' | 'AFTER_HOUR';

export const membershipTypeLabels: Record<MembershipType, string> = {
  ALL_HOUR: 'All Hour',
  HAPPY_HOUR: 'Happy Hour',
  AFTER_HOUR: 'After Hour'
};

export const membershipTypeDescriptions: Record<MembershipType, string> = {
  ALL_HOUR: 'Semua jam',
  HAPPY_HOUR: '06:00 - 15:00',
  AFTER_HOUR: '15:00 - 00:00'
};

export function getHourFromTime(value: string | Date) {
  if (value instanceof Date) {
    return value.getHours();
  }

  const time = value.includes(' - ') ? value.split(' - ')[0] : value;
  const match = time.match(/(?:T|\s|^)(\d{2}):(\d{2})/);
  if (!match) return null;

  const hour = Number(match[1]);
  return Number.isFinite(hour) ? hour : null;
}

export function isTimeAllowedForMembershipType(
  membershipType: MembershipType | null | undefined,
  value: string | Date
) {
  if (!membershipType || membershipType === 'ALL_HOUR') return true;

  const hour = getHourFromTime(value);
  if (hour === null) return false;

  if (membershipType === 'HAPPY_HOUR') {
    return hour >= 6 && hour < 15;
  }

  return hour >= 15 && hour < 24;
}
