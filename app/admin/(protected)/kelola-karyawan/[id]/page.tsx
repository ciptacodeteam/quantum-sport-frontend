import CoachCostingTable from '@/components/admin/staffs/CoachCostingTable';
import EditStaffForm from '@/components/admin/staffs/EditStaffForm';
import ResetStaffPassword from '@/components/admin/staffs/ResetStaffPassword';
import RevokeStaffAccess from '@/components/admin/staffs/RevokeStaffAccess';
import {
  Section,
  SectionContent,
  SectionDescription,
  SectionHeader,
  SectionTitle
} from '@/components/ui/section';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Role } from '@/lib/constants';
import { createQueryClient } from '@/lib/query-client';
import { adminCoachCostingQueryOptions, adminStaffQueryOptions } from '@/queries/admin/staff';
import { type IdParams } from '@/types';
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';

const EditStaffPage = async ({ params }) => {
  const param = (await params) as IdParams;

  const queryClient = createQueryClient();

  const staff = await queryClient.fetchQuery(adminStaffQueryOptions(param.id));
  const roleValue = staff.role;
  const normalizedRole = typeof roleValue === 'string' ? roleValue.trim().toUpperCase() : '';

  const role = Role;

  const isCoach =
    normalizedRole === role.COACH ||
    roleValue === role.COACH ||
    roleValue === 'coach' ||
    roleValue === 'COACH' ||
    roleValue === 1 ||
    roleValue === '1';

  if (isCoach) {
    await queryClient.prefetchQuery(adminCoachCostingQueryOptions(param.id));
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <main>
        <Section>
          <SectionHeader>
            <SectionTitle title="Kelola Karyawan" />
            <SectionDescription description="Atur dan pantau karyawan Anda di sini." />
          </SectionHeader>
          <SectionContent className="mt-4">
            <Tabs defaultValue="edit" className="mt-2">
              <TabsList>
                <TabsTrigger value="edit">Edit</TabsTrigger>
                {isCoach ? <TabsTrigger value="costing">Costing</TabsTrigger> : null}
              </TabsList>
              <TabsContent value="edit">
                <div className="mt-4 grid grid-cols-1 justify-center xl:grid-cols-2 xl:gap-x-6">
                  <div className="md:max-w-3xl">
                    <EditStaffForm staffId={param.id} />
                  </div>
                  <Separator className="mt-10 mb-6 block xl:hidden" />
                  <div>
                    <ResetStaffPassword staffId={param.id} />
                    <Separator className="my-4" />
                    <RevokeStaffAccess staffId={param.id} />
                  </div>
                </div>
              </TabsContent>
              {isCoach ? (
                <TabsContent value="costing">
                  <div className="mt-4">
                    <CoachCostingTable coachId={param.id} />
                  </div>
                </TabsContent>
              ) : null}
            </Tabs>
          </SectionContent>
        </Section>
      </main>
    </HydrationBoundary>
  );
};
export default EditStaffPage;
