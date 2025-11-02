import EditCourtForm from '@/components/admin/courts/EditCourtForm';
import {
  Section,
  SectionContent,
  SectionDescription,
  SectionHeader,
  SectionTitle
} from '@/components/ui/section';
import { createQueryClient } from '@/lib/query-client';
import { adminCourtCostingQueryOptions, adminCourtQueryOptions } from '@/queries/admin/court';
import type { IdParams } from '@/types';
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CourtCostingTable from '@/components/admin/courts/CourtCostingTable';

const EditCourtPage = async ({ params }) => {
  const param = (await params) as IdParams;

  const queryClient = createQueryClient();

  await queryClient.prefetchQuery(adminCourtQueryOptions(param.id));
  await queryClient.prefetchQuery(adminCourtCostingQueryOptions(param.id));

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Section>
        <SectionHeader>
          <SectionTitle title="Edit Lapangan" />
          <SectionDescription description="Edit data lapangan yang telah tersedia." />
        </SectionHeader>
        <SectionContent>
          <Tabs defaultValue="edit" className="mt-2">
            <TabsList>
              <TabsTrigger value="edit">Edit</TabsTrigger>
              <TabsTrigger value="costing">Costing</TabsTrigger>
            </TabsList>
            <TabsContent value="edit">
              <div className="mt-4">
                <EditCourtForm courtId={param.id} />
              </div>
            </TabsContent>
            <TabsContent value="costing">
              <div className="mt-4">
                <CourtCostingTable courtId={param.id} />
              </div>
            </TabsContent>
          </Tabs>
        </SectionContent>
      </Section>
    </HydrationBoundary>
  );
};
export default EditCourtPage;
