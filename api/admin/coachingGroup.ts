import { adminApi } from '@/lib/adminApi';
export type CoachingGroupSummary = { id: string; name: string };
export type CoachingGroupInput = {
  name: string;
  logo?: File;
  removeLogo?: boolean;
  description: string;
  sports: ('PADEL' | 'TENNIS')[];
  branchIds: string[];
  isActive: boolean;
};
export type CoachingGroup = Omit<
  CoachingGroupInput,
  'branchIds' | 'logo' | 'description' | 'removeLogo'
> & {
  id: string;
  logo: string | null;
  description: string | null;
  branches: { branchId: string; branch: { id: string; name: string } }[];
  coaches: { staffId: string }[];
};
export const coachingGroupApi = {
  remove: (id: string) => adminApi.delete(`/coaching-groups/${encodeURIComponent(id)}`),
  list: async (branchId?: string | null) =>
    (await adminApi.get('/coaching-groups', { params: { branchId: branchId || undefined } })).data
      .data as CoachingGroup[],
  save: (id: string | undefined, data: CoachingGroupInput) => {
    const { logo, removeLogo, ...fields } = data;
    const form = new FormData();
    form.append('data', JSON.stringify(fields));
    if (logo) form.append('logo', logo);
    if (removeLogo) form.append('removeLogo', 'true');
    const config = { headers: { 'Content-Type': 'multipart/form-data' } };
    return id
      ? adminApi.put(`/coaching-groups/${id}`, form, config)
      : adminApi.post('/coaching-groups', form, config);
  }
};
