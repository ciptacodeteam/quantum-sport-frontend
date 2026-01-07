import BookedCoachTable from '@/components/admin/booked-coaches/BookedCoachTable';
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
          <SectionTitle title="Kelola Pemesanan Coach" />
          <SectionDescription description="Daftar coach yang dipesan oleh pelanggan." />
        </SectionHeader>
        <SectionContent>
          <BookedCoachTable />
        </SectionContent>
      </Section>
    </main>
  );
}
