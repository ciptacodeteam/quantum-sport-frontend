import EditTournamentForm from '@/components/admin/tournaments/EditTournamentForm';
import {
  Section,
  SectionContent,
  SectionDescription,
  SectionHeader,
  SectionTitle
} from '@/components/ui/section';
import { createQueryClient } from '@/lib/query-client';
import { adminTournamentQueryOptions } from '@/queries/admin/tournament';
import type { IdParams } from '@/types';
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';

const EditTournamentPage = async ({ params }: { params: Promise<IdParams> }) => {
  const param = await params;

  const queryClient = createQueryClient();

  await queryClient.prefetchQuery(adminTournamentQueryOptions(param.id));

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <main>
        <Section>
          <SectionHeader>
            <SectionTitle title="Edit Turnamen" />
            <SectionDescription description="Perbarui informasi turnamen di sini." />
          </SectionHeader>
          <SectionContent className="mt-4">
            <EditTournamentForm tournamentId={param.id} />
          </SectionContent>
        </Section>
      </main>
    </HydrationBoundary>
  );
};
export default EditTournamentPage;
