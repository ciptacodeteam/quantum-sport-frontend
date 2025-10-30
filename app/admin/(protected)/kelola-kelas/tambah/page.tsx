import CreateClassForm from '@/components/admin/classes/CreateClassForm';
import {
  SectionHeader,
  SectionTitle,
  SectionDescription,
  SectionContent,
  Section
} from '@/components/ui/section';

const CreateClassPage = () => {
  return (
    <main>
      <Section>
        <SectionHeader>
          <SectionTitle title="Tambah Kelas" />
          <SectionDescription description="Tambahkan kelas baru ke dalam sistem Anda di sini." />
        </SectionHeader>
        <SectionContent className="mt-4">
          <CreateClassForm />
        </SectionContent>
      </Section>
    </main>
  );
};
export default CreateClassPage;
