import { expect, it } from 'vitest';
import { nextScheduleDateAfterClose } from './booking-date-rollover';
const end = '2030-02-02';
it.each([
  ['2030-01-02T23:29:59.999+07:00', null],
  ['2030-01-02T23:30:00+07:00', '2030-01-03'],
  ['2030-01-02T23:59:59+07:00', '2030-01-03'],
  ['2030-01-03T00:00:00+07:00', '2030-01-03']
])('advances an elapsed timetable at %s in WIB', (now, expected) => {
  expect(nextScheduleDateAfterClose('2030-01-02', end, ['06:00', '23:00'], Date.parse(now))).toBe(
    expected
  );
});
it('uses configured last hours rather than assuming every venue closes at midnight', () => {
  expect(
    nextScheduleDateAfterClose(
      '2030-01-02',
      end,
      ['06:00', '20:00'],
      Date.parse('2030-01-02T20:30:00+07:00')
    )
  ).toBe('2030-01-03');
});
it('does not skip a manually selected future date or unknown/empty operating hours', () => {
  const now = Date.parse('2030-01-02T23:45:00+07:00');
  expect(nextScheduleDateAfterClose('2030-01-05', end, ['06:00', '23:00'], now)).toBeNull();
  expect(nextScheduleDateAfterClose('2030-01-02', end, [], now)).toBeNull();
});
it('never advances beyond the booking window', () => {
  expect(
    nextScheduleDateAfterClose(
      '2030-01-02',
      '2030-01-02',
      ['23:00'],
      Date.parse('2030-01-02T23:45:00+07:00')
    )
  ).toBeNull();
});
