import ClassTable from '@/components/admin/classes/ClassTable';
import {
  Section,
  SectionContent,
  SectionDescription,
  SectionHeader,
  SectionTitle
} from '@/components/ui/section';

const ManageClassPage = () => {
  return (
    <main>
      <Section>
        <SectionHeader>
          <SectionTitle title="Kelola Kelas" />
          <SectionDescription description="Atur dan pantau kelas Anda di sini." />
        </SectionHeader>
        <SectionContent>
          <ClassTable />
        </SectionContent>
      </Section>
    </main>
  );
};
export default ManageClassPage;
