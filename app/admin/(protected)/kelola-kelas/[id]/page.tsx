import EditClassForm from '@/components/admin/classes/EditClassForm';
import {
  Section,
  SectionContent,
  SectionDescription,
  SectionHeader,
  SectionTitle
} from '@/components/ui/section';
import { createQueryClient } from '@/lib/query-client';
import { adminClassQueryOptions } from '@/queries/admin/class';
import type { IdParams } from '@/types';
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';

const EditClassPage = async ({ params }) => {
  const param = (await params) as IdParams;

  const queryClient = createQueryClient();

  await queryClient.prefetchQuery(adminClassQueryOptions(param.id));

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <main>
        <Section>
          <SectionHeader>
            <SectionTitle title="Tambah Kelas" />
            <SectionDescription description="Tambahkan kelas baru ke dalam sistem Anda di sini." />
          </SectionHeader>
          <SectionContent className="mt-4">
            <div className="md:max-w-2xl">
              <EditClassForm classId={param.id} />
            </div>
          </SectionContent>
        </Section>
      </main>
    </HydrationBoundary>
  );
};
export default EditClassPage;
