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
    <main className="w-full min-w-0">
      <Section className="min-w-0 bg-transparent pt-0">
        <SectionHeader className="px-0">
          <SectionTitle title="Pemesanan Inventori" />
          <SectionDescription description="Pantau inventori dan layanan tambahan yang dipesan pelanggan." />
        </SectionHeader>
        <SectionContent className="min-w-0 px-0">
          <BookedInventoryTable />
        </SectionContent>
      </Section>
    </main>
  );
}
