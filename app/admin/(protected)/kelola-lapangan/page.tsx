import CourtTable from '@/components/admin/courts/CourtTable';
import {
  Section,
  SectionContent,
  SectionDescription,
  SectionHeader,
  SectionTitle
} from '@/components/ui/section';

const ManageCourtPage = () => {
  return (
    <main>
      <Section>
        <SectionHeader>
          <SectionTitle title="Kelola Lapangan" />
          <SectionDescription description="Atur dan pantau lapangan Anda di sini." />
        </SectionHeader>
        <SectionContent>
          <CourtTable />
        </SectionContent>
      </Section>
    </main>
  );
};
export default ManageCourtPage;
