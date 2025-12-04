'use client';

import PartnershipTable from '@/components/admin/partnerships/PartnershipTable';
import {
  Section,
  SectionContent,
  SectionDescription,
  SectionHeader,
  SectionTitle
} from '@/components/ui/section';
import { useRoleAccess } from '@/hooks/useRoleAccess';
import { ROLE } from '@/lib/constants';

const ManagePartnershipPage = () => {
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
          <SectionTitle title="Kelola Partnership" />
          <SectionDescription description="Atur dan pantau partnership Anda di sini." />
        </SectionHeader>
        <SectionContent>
          <PartnershipTable />
        </SectionContent>
      </Section>
    </main>
  );
};
export default ManagePartnershipPage;
