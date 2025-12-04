'use client';

import TournamentTable from '@/components/admin/tournaments/TournamentTable';
import {
  Section,
  SectionContent,
  SectionDescription,
  SectionHeader,
  SectionTitle
} from '@/components/ui/section';
import { useRoleAccess } from '@/hooks/useRoleAccess';
import { ROLE } from '@/lib/constants';

const ManageTournamentPage = () => {
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
          <SectionTitle title="Kelola Turnamen" />
          <SectionDescription description="Atur dan pantau turnamen Anda di sini." />
        </SectionHeader>
        <SectionContent>
          <TournamentTable />
        </SectionContent>
      </Section>
    </main>
  );
};
export default ManageTournamentPage;
