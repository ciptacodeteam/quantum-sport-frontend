import MembershipTransactionTable from '@/components/admin/membership-transactions/MembershipTransactionTable';
import {
  Section,
  SectionContent,
  SectionDescription,
  SectionHeader,
  SectionTitle
} from '@/components/ui/section';

const MembershipTransactionsPage = () => {
  return (
    <main>
      <Section>
        <SectionHeader>
          <SectionTitle title="Kelola Pemesanan Membership" />
          <SectionDescription description="Atur dan pantau transaksi membership pelanggan di sini." />
        </SectionHeader>
        <SectionContent>
          <MembershipTransactionTable />
        </SectionContent>
      </Section>
    </main>
  );
};

export default MembershipTransactionsPage;
