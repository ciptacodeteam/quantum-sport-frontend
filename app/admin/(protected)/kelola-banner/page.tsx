'use client';

import BannerTable from '@/components/admin/banners/BannerTable';
import {
  Section,
  SectionContent,
  SectionDescription,
  SectionHeader,
  SectionTitle
} from '@/components/ui/section';
import { useRoleAccess } from '@/hooks/useRoleAccess';
import { ROLE } from '@/lib/constants';

const ManageBannerPage = () => {
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
          <SectionTitle title="Kelola Banner" />
          <SectionDescription description="Atur dan pantau banner Anda di sini." />
        </SectionHeader>
        <SectionContent>
          <BannerTable />
        </SectionContent>
      </Section>
    </main>
  );
};
export default ManageBannerPage;
