import PartnershipTable from '@/components/admin/partnerships/PartnershipTable';
import {
  Section,
  SectionContent,
  SectionDescription,
  SectionHeader,
  SectionTitle
} from '@/components/ui/section';

const ManagePartnershipPage = () => {
  return (
    <main>
      <Section>
        <SectionHeader>
          <SectionTitle title="Kelola Partnership" />
          <SectionDescription description="Atur dan pantau partnership Anda di sini." />
        </SectionHeader>
        <SectionContent>
          <PartnershipTable />
        </SectionContent>
      </Section>
    </main>
  );
};
export default ManagePartnershipPage;


