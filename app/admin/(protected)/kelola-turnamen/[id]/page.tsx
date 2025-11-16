import EditTournamentForm from '@/components/admin/tournaments/EditTournamentForm';
import {
  Section,
  SectionContent,
  SectionDescription,
  SectionHeader,
  SectionTitle
} from '@/components/ui/section';
import { adminTournamentQueryOptions } from '@/queries/admin/tournament';
import { HydrationBoundary, QueryClient, dehydrate } from '@tanstack/react-query';

type Props = {
  params: Promise<{ id: string }>;
};

const EditTournamentPage = async ({ params }: Props) => {
  const { id } = await params;

  const queryClient = new QueryClient();

  await queryClient.prefetchQuery(adminTournamentQueryOptions(id));

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <main>
        <Section>
          <SectionHeader>
            <SectionTitle title="Edit Turnamen" />
            <SectionDescription description="Perbarui informasi turnamen Anda." />
          </SectionHeader>
          <SectionContent>
            <EditTournamentForm tournamentId={id} />
          </SectionContent>
        </Section>
      </main>
    </HydrationBoundary>
  );
};
export default EditTournamentPage;
