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
          <SectionDescription description="Tambahkan turnamen baru ke dalam sistem Anda di sini." />
        </SectionHeader>
        <SectionContent className="mt-4">
          <CreateTournamentForm />
        </SectionContent>
      </Section>
    </main>
  );
};
export default CreateTournamentPage;
