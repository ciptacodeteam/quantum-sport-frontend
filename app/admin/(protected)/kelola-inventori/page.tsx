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
    <main className="w-full min-w-0">
      <Section>
        <SectionHeader>
          <SectionTitle title="Kelola Inventori" />
          <SectionDescription description="Kelola alat, jumlah unit, harga, dan status inventori." />
        </SectionHeader>
        <SectionContent>
          <InventoryTable />
        </SectionContent>
      </Section>
    </main>
  );
};
export default ManageInventoryPage;
