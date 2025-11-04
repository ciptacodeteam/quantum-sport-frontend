import TournamentTable from '@/components/admin/tournaments/TournamentTable';
import {
  Section,
  SectionContent,
  SectionDescription,
  SectionHeader,
  SectionTitle
} from '@/components/ui/section';

const ManageTournamentPage = () => {
  return (
    <main>
      <Section>
        <SectionHeader>
          <SectionTitle title="Kelola Turnamen" />
          <SectionDescription description="Atur dan pantau turnamen Anda di sini." />
        </SectionHeader>
        <SectionContent>
          <TournamentTable />
        </SectionContent>
      </Section>
    </main>
  );
};
export default ManageTournamentPage;

