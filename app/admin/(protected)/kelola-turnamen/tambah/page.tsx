import CreateTournamentForm from '@/components/admin/tournaments/CreateTournamentForm';
import {
  Section,
  SectionContent,
  SectionDescription,
  SectionHeader,
  SectionTitle
} from '@/components/ui/section';

const CreateTournamentPage = () => {
  return (
    <main>
      <Section>
        <SectionHeader>
          <SectionTitle title="Tambah Turnamen" />
          <SectionDescription description="Buat turnamen baru untuk klub Anda." />
        </SectionHeader>
        <SectionContent>
          <CreateTournamentForm />
        </SectionContent>
      </Section>
    </main>
  );
};
export default CreateTournamentPage;
