import InvoiceTable from '@/components/admin/invoices/InvoiceTable';
import {
  Section,
  SectionContent,
  SectionDescription,
  SectionHeader,
  SectionTitle
} from '@/components/ui/section';

export default function AdminKelolaTransaksiPage() {
  return (
    <main>
      <Section>
        <SectionHeader>
          <SectionTitle title="Kelola Transaksi" />
          <SectionDescription description="Daftar seluruh invoice transaksi." />
        </SectionHeader>
        <SectionContent>
          <InvoiceTable />
        </SectionContent>
      </Section>
    </main>
  );
}
