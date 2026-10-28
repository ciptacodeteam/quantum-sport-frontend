export const TENNIS_BRANCH_ID = 'cemara';
export function branchSupportsTennis(branchId?: string | null) {
  return branchId === TENNIS_BRANCH_ID;
}
