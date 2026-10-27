import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { IconArrowLeft } from '@tabler/icons-react';
import StaffSettingsCard from '@/components/admin/staffs/StaffSettingsCard';
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
    <main className="w-full min-w-0">
      <Button asChild variant="ghost" size="sm" className="text-muted-foreground mb-4 -ml-2">
        <Link href="/admin/kelola-karyawan">
          <IconArrowLeft />
          Daftar karyawan
        </Link>
      </Button>
      <Section>
        <SectionHeader>
          <SectionTitle title="Tambah Karyawan" />
          <SectionDescription description="Tambahkan karyawan baru ke dalam sistem Anda di sini." />
        </SectionHeader>
        <SectionContent className="mt-4">
          <StaffSettingsCard
            title="Profil dan akses akun"
            description="Lengkapi informasi karyawan dan pilih peran aksesnya."
          >
            <CreateStaffForm />
          </StaffSettingsCard>
        </SectionContent>
      </Section>
    </main>
  );
};
export default CreateStaffPage;
