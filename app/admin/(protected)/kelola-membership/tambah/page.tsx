import CreateMembershipForm from '@/components/admin/memberships/CreateMembershipForm';
import {
  Section,
  SectionContent,
  SectionDescription,
  SectionHeader,
  SectionTitle
} from '@/components/ui/section';

const CreateMembershipPage = () => {
  return (
    <main>
      <Section>
        <SectionHeader>
          <SectionTitle title="Tambah Membership" />
          <SectionDescription description="Tambahkan membership baru ke dalam sistem Anda di sini." />
        </SectionHeader>
        <SectionContent className="mt-4">
          <CreateMembershipForm />
        </SectionContent>
      </Section>
    </main>
  );
};
export default CreateMembershipPage;
