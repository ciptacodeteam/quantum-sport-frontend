import BookedInventoryTable from '@/components/admin/booked-inventories/BookedInventoryTable';
import {
  Section,
  SectionContent,
  SectionDescription,
  SectionHeader,
  SectionTitle
} from '@/components/ui/section';

export default function Page() {
  return (
    <main>
      <Section>
        <SectionHeader>
          <SectionTitle title="Kelola Pemesanan Inventori" />
          <SectionDescription description="Daftar inventori yang dipesan oleh pelanggan." />
        </SectionHeader>
        <SectionContent>
          <BookedInventoryTable />
        </SectionContent>
      </Section>
    </main>
  );
}
