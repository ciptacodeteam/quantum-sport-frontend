'use client';

import StaffTable from '@/components/admin/staffs/StaffTable';
import CoachSelfView from '@/components/admin/staffs/CoachSelfView';
import { useQuery } from '@tanstack/react-query';
import { adminProfileQueryOptions } from '@/queries/admin/auth';
import { ROLE } from '@/lib/constants';
import {
  Section,
  SectionContent,
  SectionDescription,
  SectionHeader,
  SectionTitle
} from '@/components/ui/section';

const ManageStaffPage = () => {
  const { data: me } = useQuery(adminProfileQueryOptions);
  const isCoach = me?.role?.toUpperCase?.() === ROLE.COACH;

  return (
    <main>
      <Section>
        <SectionHeader>
          <SectionTitle title={isCoach ? 'Profil & Jadwal Saya' : 'Kelola Karyawan'} />
          <SectionDescription
            description={
              isCoach
                ? 'Lihat profil dan jadwal mengajar Anda.'
                : 'Atur dan pantau karyawan Anda di sini.'
            }
          />
        </SectionHeader>
        <SectionContent>{isCoach ? <CoachSelfView /> : <StaffTable />}</SectionContent>
      </Section>
    </main>
  );
};
export default ManageStaffPage;
