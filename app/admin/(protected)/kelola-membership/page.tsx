'use client';

import MembershipTable from '@/components/admin/memberships/MembershipTable';
import {
  Section,
  SectionContent,
  SectionDescription,
  SectionHeader,
  SectionTitle
} from '@/components/ui/section';
import { useRoleAccess } from '@/hooks/useRoleAccess';
import { ROLE } from '@/lib/constants';

const ManageMembershipPage = () => {
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
          <SectionTitle title="Kelola Membership" />
          <SectionDescription description="Atur dan pantau membership Anda di sini." />
        </SectionHeader>
        <SectionContent>
          <MembershipTable />
        </SectionContent>
      </Section>
    </main>
  );
};
export default ManageMembershipPage;
