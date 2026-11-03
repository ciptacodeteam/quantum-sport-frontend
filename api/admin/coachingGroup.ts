import { adminApi } from '@/lib/adminApi';
export type CoachingGroupSummary = { id: string; name: string };
export type CoachingGroupInput = {
  name: string;
  logo: string;
  description: string;
  sports: ('PADEL' | 'TENNIS')[];
  branchIds: string[];
  isActive: boolean;
};
export type CoachingGroup = Omit<CoachingGroupInput, 'branchIds' | 'logo' | 'description'> & {
  id: string;
  logo: string | null;
  description: string | null;
  branches: { branchId: string; branch: { id: string; name: string } }[];
  coaches: { staffId: string }[];
};
export const coachingGroupApi = {
  list: async (branchId?: string | null) =>
    (await adminApi.get('/coaching-groups', { params: { branchId: branchId || undefined } })).data
      .data as CoachingGroup[],
  save: (id: string | undefined, data: CoachingGroupInput) =>
    id ? adminApi.put(`/coaching-groups/${id}`, data) : adminApi.post('/coaching-groups', data)
};
