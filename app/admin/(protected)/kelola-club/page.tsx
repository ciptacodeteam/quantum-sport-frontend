import ClubTable from '@/components/admin/clubs/ClubTable';
import {
  Section,
  SectionContent,
  SectionDescription,
  SectionHeader,
  SectionTitle
} from '@/components/ui/section';

const ManageClubPage = () => {
  return (
    <main>
      <Section>
        <SectionHeader>
          <SectionTitle title="Kelola Club" />
          <SectionDescription description="Manage and monitor all clubs in the system." />
        </SectionHeader>
        <SectionContent>
          <ClubTable />
        </SectionContent>
      </Section>
    </main>
  );
};

export default ManageClubPage;

