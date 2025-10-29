import CreateStaffForm from '@/components/admin/staffs/CreateStaffForm';
import {
  Section,
  SectionContent,
  SectionDescription,
  SectionHeader,
  SectionTitle
} from '@/components/ui/section';

const CreateStaffPage = () => {
  return (
    <main>
      <Section>
        <SectionHeader>
          <SectionTitle title="Tambah Karyawan" />
          <SectionDescription description="Tambahkan karyawan baru ke dalam sistem Anda di sini." />
        </SectionHeader>
        <SectionContent className="mt-4">
          <div className="md:max-w-2xl">
            <CreateStaffForm />
          </div>
        </SectionContent>
      </Section>
    </main>
  );
};
export default CreateStaffPage;
