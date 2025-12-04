'use client';

import CourtTable from '@/components/admin/courts/CourtTable';
import {
  Section,
  SectionContent,
  SectionDescription,
  SectionHeader,
  SectionTitle
} from '@/components/ui/section';
import { useRoleAccess } from '@/hooks/useRoleAccess';
import { ROLE } from '@/lib/constants';

const ManageCourtPage = () => {
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
          <SectionTitle title="Kelola Lapangan" />
          <SectionDescription description="Atur dan pantau lapangan Anda di sini." />
        </SectionHeader>
        <SectionContent>
          <CourtTable />
        </SectionContent>
      </Section>
    </main>
  );
};
export default ManageCourtPage;
