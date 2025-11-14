import TournamentTable from '@/components/admin/tournaments/TournamentTable';
import {
  Section,
  SectionContent,
  SectionDescription,
  SectionHeader,
  SectionTitle
} from '@/components/ui/section';

export default function TournamentsPage() {
  return (
    <main>
      <Section>
        <SectionHeader>
          <SectionTitle title="Kelola Turnamen" />
          <SectionDescription description="Manage tournaments including create, edit, and delete operations" />
        </SectionHeader>
        <SectionContent>
          <TournamentTable />
        </SectionContent>
      </Section>
    </main>
  );
}
