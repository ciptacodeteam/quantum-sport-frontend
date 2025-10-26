import PaymentMethodTable from '@/components/admin/payment-methods/PaymentMethodTable';
import {
  Section,
  SectionContent,
  SectionDescription,
  SectionHeader,
  SectionTitle
} from '@/components/ui/section';

const ManagePaymentMethodPage = () => {
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
