import EditStaffForm from '@/components/admin/staffs/EditStaffForm';
import RevokeStaffAccess from '@/components/admin/staffs/RevokeStaffAccess';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
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
import { IconInfoCircle } from '@tabler/icons-react';
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
          <SectionContent className="mt-4 grid grid-cols-1 justify-center xl:grid-cols-2">
            <div className="md:max-w-2xl">
              <EditStaffForm staffId={param.id} />
            </div>
            <div>
              <Section>
                <SectionHeader>
                  <SectionTitle title="Reset Password Karyawan" />
                  <SectionDescription description="Kirim tautan reset password ke email karyawan ini." />
                </SectionHeader>
                <SectionContent>
                  <Alert variant="info" className="mb-4">
                    <IconInfoCircle />
                    <AlertDescription>
                      Dengan mengklik tombol di bawah, anda akan generate password baru untuk
                      karyawan ini.
                    </AlertDescription>
                  </Alert>
                  <Button variant="secondaryInfo" className="mt-6 md:mt-0">
                    Reset Password
                  </Button>
                </SectionContent>
              </Section>
              <Separator className="my-4" />
              <RevokeStaffAccess staffId={param.id} />
            </div>
          </SectionContent>
        </Section>
      </main>
    </HydrationBoundary>
  );
};
export default EditStaffPage;
