import BannerTable from '@/components/admin/banners/BannerTable';
import {
  Section,
  SectionContent,
  SectionDescription,
  SectionHeader,
  SectionTitle
} from '@/components/ui/section';

const ManageBannerPage = () => {
  return (
    <main>
      <Section>
        <SectionHeader>
          <SectionTitle title="Kelola Banner" />
          <SectionDescription description="Atur dan pantau banner Anda di sini." />
        </SectionHeader>
        <SectionContent>
          <BannerTable />
        </SectionContent>
      </Section>
    </main>
  );
};
export default ManageBannerPage;
