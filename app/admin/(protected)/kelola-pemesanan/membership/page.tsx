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
          <SectionTitle title="Kelola Pemesanan Value Pack" />
          <SectionDescription description="Atur dan pantau transaksi value pack pelanggan di sini." />
        </SectionHeader>
        <SectionContent>
          <MembershipTransactionTable />
        </SectionContent>
      </Section>
    </main>
  );
};

export default MembershipTransactionsPage;
