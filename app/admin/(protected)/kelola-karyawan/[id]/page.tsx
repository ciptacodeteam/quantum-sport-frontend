import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { IconArrowLeft } from '@tabler/icons-react';
import StaffSettingsCard from '@/components/admin/staffs/StaffSettingsCard';
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
      <main className="w-full min-w-0">
        <Button asChild variant="ghost" size="sm" className="text-muted-foreground mb-4 -ml-2">
          <Link href="/admin/kelola-karyawan">
            <IconArrowLeft />
            Daftar karyawan
          </Link>
        </Button>
        <Section>
          <SectionHeader>
            <SectionTitle title="Edit Karyawan" />
            <SectionDescription description="Perbarui profil dan pengaturan akses karyawan." />
          </SectionHeader>
          <SectionContent className="mt-4">
            <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
              <StaffSettingsCard
                title="Informasi karyawan"
                description="Kelola foto, kontak, peran, dan status akun."
              >
                <EditStaffForm staffId={param.id} />
              </StaffSettingsCard>
              <div className="min-w-0 space-y-5">
                <ResetStaffPassword staffId={param.id} />
                <RevokeStaffAccess staffId={param.id} />
              </div>
            </div>
          </SectionContent>
        </Section>
      </main>
    </HydrationBoundary>
  );
};
export default EditStaffPage;
