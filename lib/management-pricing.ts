export type ManagementCustomer = {
  isManagement?: boolean;
  managementValidFrom?: string | Date | null;
  managementValidUntil?: string | Date | null;
};
export type ManagementTariff = {
  managementCourtHourlyPrice?: number | null;
  managementCoachHourlyPrice?: number | null;
};
const dateKey = (value: string | Date) =>
  value instanceof Date ? value.toISOString().slice(0, 10) : value.slice(0, 10);
/** Used only by dashboard in-house quotes; the server verifies customer eligibility again. */
export function managementInHouseRate(
  customer: ManagementCustomer | null | undefined,
  playingAt: string,
  tariff: ManagementTariff
) {
  if (!customer?.isManagement) return null;
  const day = dateKey(playingAt);
  if (customer.managementValidFrom && day < dateKey(customer.managementValidFrom)) return null;
  if (customer.managementValidUntil && day > dateKey(customer.managementValidUntil)) return null;
  if (tariff.managementCourtHourlyPrice == null || tariff.managementCoachHourlyPrice == null)
    return null;
  return { court: tariff.managementCourtHourlyPrice, coach: tariff.managementCoachHourlyPrice };
}
