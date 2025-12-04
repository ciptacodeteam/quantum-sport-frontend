'use client';

import ClubTable from '@/components/admin/clubs/ClubTable';
import {
  Section,
  SectionContent,
  SectionDescription,
  SectionHeader,
  SectionTitle
} from '@/components/ui/section';
import { useRoleAccess } from '@/hooks/useRoleAccess';
import { ROLE } from '@/lib/constants';

const ManageClubPage = () => {
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
          <SectionTitle title="Kelola Club" />
          <SectionDescription description="Manage and monitor all clubs in the system." />
        </SectionHeader>
        <SectionContent>
          <ClubTable />
        </SectionContent>
      </Section>
    </main>
  );
};

export default ManageClubPage;
