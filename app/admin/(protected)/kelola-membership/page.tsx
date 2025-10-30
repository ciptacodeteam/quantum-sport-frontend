import MembershipTable from '@/components/admin/memberships/MembershipTable';
import {
  Section,
  SectionContent,
  SectionDescription,
  SectionHeader,
  SectionTitle
} from '@/components/ui/section';

const ManageMembershipPage = () => {
  return (
    <main>
      <Section>
        <SectionHeader>
          <SectionTitle title="Kelola Membership" />
          <SectionDescription description="Atur dan pantau membership Anda di sini." />
        </SectionHeader>
        <SectionContent>
          <MembershipTable />
        </SectionContent>
      </Section>
    </main>
  );
};
export default ManageMembershipPage;
