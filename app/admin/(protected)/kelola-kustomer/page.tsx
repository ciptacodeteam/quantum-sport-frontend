import CustomerTable from '@/components/admin/customers/CustomerTable';
import {
  Section,
  SectionContent,
  SectionDescription,
  SectionHeader,
  SectionTitle
} from '@/components/ui/section';

const ManageCustomerPage = () => {
  return (
    <main>
      <Section>
        <SectionHeader>
          <SectionTitle title="Kelola Kustomer" />
          <SectionDescription description="Atur dan pantau kustomer Anda di sini." />
        </SectionHeader>
        <SectionContent>
          <CustomerTable />
        </SectionContent>
      </Section>
    </main>
  );
};
export default ManageCustomerPage;
