'use client';

import InventoryTable from '@/components/admin/inventories/InventoryTable';
import {
  Section,
  SectionContent,
  SectionDescription,
  SectionHeader,
  SectionTitle
} from '@/components/ui/section';
import { useRoleAccess } from '@/hooks/useRoleAccess';
import { ROLE } from '@/lib/constants';

const ManageInventoryPage = () => {
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
          <SectionTitle title="Kelola Inventori" />
          <SectionDescription description="Atur dan pantau inventori produk Anda di sini." />
        </SectionHeader>
        <SectionContent>
          <InventoryTable />
        </SectionContent>
      </Section>
    </main>
  );
};
export default ManageInventoryPage;
