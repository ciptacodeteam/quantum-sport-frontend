'use client';

import StaffTable from '@/components/admin/staffs/StaffTable';
import CoachSelfView from '@/components/admin/staffs/CoachSelfView';
import { useQuery } from '@tanstack/react-query';
import { adminProfileQueryOptions } from '@/queries/admin/auth';
import { ROLE } from '@/lib/constants';
import { useRoleAccess } from '@/hooks/useRoleAccess';
import {
  Section,
  SectionContent,
  SectionDescription,
  SectionHeader,
  SectionTitle
} from '@/components/ui/section';

const ManageStaffPage = () => {
  const { data: me } = useQuery(adminProfileQueryOptions);
  const isCoach = me?.role?.toUpperCase?.() === ROLE.COACH;
  const isBallboy = me?.role?.toUpperCase?.() === ROLE.BALLBOY;

  // Allow ADMIN, COACH, and BALLBOY to access this page
  const { hasAccess, isLoading } = useRoleAccess({
    allowedRoles: [ROLE.ADMIN, ROLE.COACH, ROLE.BALLBOY]
  });

  if (isLoading || !hasAccess) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <main>
      <Section>
        <SectionHeader>
          <SectionTitle title={isCoach ? 'Profil & Jadwal Saya' : 'Kelola Karyawan'} />
          <SectionDescription
            description={
              isCoach
                ? 'Lihat profil dan jadwal mengajar Anda.'
                : 'Atur dan pantau karyawan Anda di sini.'
            }
          />
        </SectionHeader>
        <SectionContent>{isCoach || isBallboy ? <CoachSelfView /> : <StaffTable />}</SectionContent>
      </Section>
    </main>
  );
};
export default ManageStaffPage;
