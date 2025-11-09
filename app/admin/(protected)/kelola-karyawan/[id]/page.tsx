import CoachCostingTable from '@/components/admin/staffs/StaffCostingTable';
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
import { createQueryClient } from '@/lib/query-client';
import { adminStaffQueryOptions } from '@/queries/admin/staff';
import { type IdParams } from '@/types';
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';

const EditStaffPage = async ({ params }) => {
  const param = (await params) as IdParams;

  const queryClient = createQueryClient();

  await queryClient.prefetchQuery(adminStaffQueryOptions(param.id));

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <main>
        <Section>
          <SectionHeader>
            <SectionTitle title="Kelola Karyawan" />
            <SectionDescription description="Atur dan pantau karyawan Anda di sini." />
          </SectionHeader>
          <SectionContent className="mt-4">
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
            <CoachCostingTable staffId={param.id} />
          </SectionContent>
        </Section>
      </main>
    </HydrationBoundary>
  );
};
export default EditStaffPage;
