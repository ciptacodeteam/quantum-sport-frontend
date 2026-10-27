'use client';

import StaffTable from '@/components/admin/staffs/StaffTable';
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
  const { hasAccess, isLoading } = useRoleAccess({
    allowedRoles: [ROLE.ADMIN]
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
          <SectionTitle title="Kelola Karyawan" />
          <SectionDescription description="Atur dan pantau karyawan Anda di sini." />
        </SectionHeader>
        <SectionContent>
          <StaffTable />
        </SectionContent>
      </Section>
    </main>
  );
};
export default ManageStaffPage;
