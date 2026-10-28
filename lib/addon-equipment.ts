/** Maximum concurrent sessions, treating touching boundaries as non-overlapping. */
export function countConcurrentSessions(ranges: { start: number; end: number }[]) {
  const events = ranges.flatMap(({ start, end }) => [
    { time: start, change: 1 },
    { time: end, change: -1 }
  ]);
  events.sort((a, b) => a.time - b.time || a.change - b.change);
  let active = 0;
  let peak = 0;
  for (const event of events) {
    active += event.change;
    peak = Math.max(peak, active);
  }
  return Math.max(1, peak);
}

/** Standalone equipment is reserved for the selected Jakarta calendar day. */
export function getEquipmentDayRange(date: string) {
  const start = new Date(`${date}T00:00:00+07:00`);
  return {
    startAt: start.toISOString(),
    endAt: new Date(start.getTime() + 86400000).toISOString()
  };
}
