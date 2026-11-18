import type { TrackedPackage } from '@/types/membership-tracking';

/** Reconcile current booking states to the wallet; these are not historical snapshots. */
export function membershipUsageBalance(pack: TrackedPackage) {
  const usage = [...pack.usage].sort(
    (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt) || a.id.localeCompare(b.id)
  );
  let balance = pack.remainingHours;
  const rows = usage.map((entry) => {
    const outHours = ['CONFIRMED', 'HOLD'].includes(entry.status) ? entry.hours : 0;
    const balanceAfter = balance;
    balance += outHours;
    return { entry, outHours, balanceAfter };
  });

  return {
    rows,
    // Includes debt settlement/transfers and older changes absent from booking history.
    otherMutationHours: balance - pack.totalHours,
    balanceBeforeUsage: balance
  };
}
