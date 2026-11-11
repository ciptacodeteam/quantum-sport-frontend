import { adminApi } from '@/lib/adminApi';
export type InHousePlan = {
  id: string;
  staffId: string;
  name: string;
  hours: 1 | 5 | 10;
  hourlyPrice: number;
  courtHourlyShare: number;
  extraParticipantHourlyPrice: number;
  isActive: boolean;
  staff: { id: string; name: string; isActive: boolean; coachType: string | null };
};
export type InHouseWallet = {
  id: string;
  userId: string;
  staffId: string;
  packageName: string;
  totalMinutes: number;
  remainingMinutes: number;
  _count: { usages: number };
  hourlyPrice: number;
  courtHourlyShare: number;
  extraParticipantHourlyPrice: number;
  user: { id: string; name: string; phone: string };
  staff: { id: string; name: string; coachType: string | null; isActive: boolean };
  invoice: { id: string; number: string; total: number; status: string } | null;
};
export type InHouseUsage = {
  id: string;
  minutes: number;
  participants: number;
  courtAmount: number;
  coachAmount: number;
  extraAmount: number;
  restoredAt: string | null;
  startAt: string;
  endAt: string;
  wallet: { packageName: string; staff: { name: string }; user: { name: string } };
  bookingCoach: { booking: { invoice: { id: string; number: string } | null } };
};
export type InHouseChoice = (
  | { walletId: string; planId?: never }
  | { planId: string; walletId?: never }
) & {
  courtSlotId: string;
  coachSlotId: string;
  participants: number;
};
export const inHouseApi = {
  plans: async () => (await adminApi.get('/inhouse-coaching/plans')).data.data as InHousePlan[],
  savePlan: async (id: string | undefined, input: Omit<InHousePlan, 'id' | 'staff'>) =>
    (
      await (id
        ? adminApi.put(`/inhouse-coaching/plans/${id}`, input)
        : adminApi.post('/inhouse-coaching/plans', input))
    ).data.data,
  wallets: async (userId?: string, availableOnly = false) =>
    (
      await adminApi.get('/inhouse-coaching/wallets', {
        params: { userId, availableOnly: availableOnly ? 'true' : undefined }
      })
    ).data.data as InHouseWallet[],
  deleteWallet: async (id: string) =>
    (await adminApi.delete(`/inhouse-coaching/wallets/${id}`)).data.data,
  sell: async (input: {
    packageId: string;
    userId: string;
    paymentMethodId: string;
    requestId: string;
  }) => (await adminApi.post('/inhouse-coaching/sales', input)).data.data,
  usage: async (userId?: string) =>
    (await adminApi.get('/inhouse-coaching/usage', { params: { userId } })).data
      .data as InHouseUsage[]
};
