import InventoryTable from '@/components/admin/inventories/InventoryTable';
import {
  Section,
  SectionContent,
  SectionDescription,
  SectionHeader,
  SectionTitle
} from '@/components/ui/section';

const ManageInventoryPage = () => {
  return (
    <main>
      <Section>
        <SectionHeader>
          <SectionTitle title="Kelola Inventori" />
          <SectionDescription description="Atur dan pantau inventori produk Anda di sini." />
        </SectionHeader>
        <SectionContent>
          <InventoryTable />
        </SectionContent>
      </Section>
    </main>
  );
};
export default ManageInventoryPage;
