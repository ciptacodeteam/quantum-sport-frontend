'use client';

import PromoCodeTable from '@/components/admin/promo-codes/PromoCodeTable';
import {
  Section,
  SectionContent,
  SectionDescription,
  SectionHeader,
  SectionTitle
} from '@/components/ui/section';
import { useRoleAccess } from '@/hooks/useRoleAccess';
import { ROLE } from '@/lib/constants';

const ManagePromoCodePage = () => {
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
          <SectionTitle title="Kelola Promo Code" />
          <SectionDescription description="Atur dan pantau kode promo Anda di sini." />
        </SectionHeader>
        <SectionContent>
          <PromoCodeTable />
        </SectionContent>
      </Section>
    </main>
  );
};

export default ManagePromoCodePage;
