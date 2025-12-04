'use client';

import PaymentMethodTable from '@/components/admin/payment-methods/PaymentMethodTable';
import {
  Section,
  SectionContent,
  SectionDescription,
  SectionHeader,
  SectionTitle
} from '@/components/ui/section';
import { useRoleAccess } from '@/hooks/useRoleAccess';
import { ROLE } from '@/lib/constants';

const ManagePaymentMethodPage = () => {
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
          <SectionTitle title="Kelola Metode Pembayaran" />
          <SectionDescription description="Atur dan pantau metode pembayaran Anda di sini." />
        </SectionHeader>
        <SectionContent>
          <PaymentMethodTable />
        </SectionContent>
      </Section>
    </main>
  );
};
export default ManagePaymentMethodPage;
