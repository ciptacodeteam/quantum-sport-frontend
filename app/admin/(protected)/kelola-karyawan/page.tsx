import StaffTable from '@/components/admin/staffs/StaffTable';
import {
  Section,
  SectionContent,
  SectionDescription,
  SectionHeader,
  SectionTitle
} from '@/components/ui/section';

const ManageStaffPage = () => {
  return (
    <main>
      <Section>
        <SectionHeader>
          <SectionTitle title="Kelola Karyawan" />
          <SectionDescription description="Atur dan pantau karyawan Anda di sini." />
        </SectionHeader>
        <SectionContent>
          <StaffTable />
        </SectionContent>
      </Section>
    </main>
  );
};
export default ManageStaffPage;
