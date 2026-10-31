import EditCourtForm from '@/components/admin/courts/EditCourtForm';
import {
  Section,
  SectionContent,
  SectionDescription,
  SectionHeader,
  SectionTitle
} from '@/components/ui/section';
import { createQueryClient } from '@/lib/query-client';
import { adminCourtCostingQueryOptionsById, adminCourtQueryOptions } from '@/queries/admin/court';
import type { IdParams } from '@/types';
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CourtCostingTable from '@/components/admin/courts/CourtCostingTable';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CalendarDays, Settings2 } from 'lucide-react';
import Link from 'next/link';

const EditCourtPage = async ({ params }) => {
  const param = (await params) as IdParams;

  const queryClient = createQueryClient();

  await queryClient.prefetchQuery(adminCourtQueryOptions(param.id));
  await queryClient.prefetchQuery(adminCourtCostingQueryOptionsById(param.id));

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Section className="gap-6">
        <SectionHeader className="gap-3">
          <Button asChild variant="ghost" size="sm" className="text-muted-foreground -ml-2 w-fit">
            <Link href="/admin/kelola-lapangan">
              <ArrowLeft />
              Kembali ke daftar lapangan
            </Link>
          </Button>
          <SectionTitle title="Pengaturan Lapangan" className="text-2xl tracking-tight" />
          <SectionDescription description="Kelola informasi lapangan, jadwal ketersediaan, dan harga dalam satu tempat." />
        </SectionHeader>
        <SectionContent>
          <Tabs defaultValue="edit" className="gap-6">
            <TabsList className="h-auto w-full justify-start rounded-xl p-1 sm:w-fit">
              <TabsTrigger
                value="edit"
                className="px-3 py-2.5 text-xs sm:px-4 sm:text-sm [&>svg]:hidden sm:[&>svg]:block"
              >
                <Settings2 />
                Informasi Lapangan
              </TabsTrigger>
              <TabsTrigger
                value="costing"
                className="px-3 py-2.5 text-xs sm:px-4 sm:text-sm [&>svg]:hidden sm:[&>svg]:block"
              >
                <CalendarDays />
                Jadwal & Harga
              </TabsTrigger>
            </TabsList>
            <TabsContent value="edit">
              <div>
                <EditCourtForm courtId={param.id} />
              </div>
            </TabsContent>
            <TabsContent value="costing">
              <div>
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
