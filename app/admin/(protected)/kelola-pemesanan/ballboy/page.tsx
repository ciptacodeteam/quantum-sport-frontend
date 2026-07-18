import BookedBallboyTable from '@/components/admin/booked-ballboys/BookedBallboyTable';
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
          <SectionTitle title="Kelola Pemesanan Ballboy" />
          <SectionDescription description="Daftar ballboy yang dipesan oleh pelanggan." />
        </SectionHeader>
        <SectionContent>
          <BookedBallboyTable />
        </SectionContent>
      </Section>
    </main>
  );
}
