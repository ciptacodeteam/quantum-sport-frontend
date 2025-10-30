import EditMembershipForm from '@/components/admin/memberships/EditMembershipForm';
import {
  Section,
  SectionContent,
  SectionDescription,
  SectionHeader,
  SectionTitle
} from '@/components/ui/section';
import { createQueryClient } from '@/lib/query-client';
import { adminMembershipQueryOptions } from '@/queries/admin/membership';
import type { IdParams } from '@/types';
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';

const EditMembershipPage = async ({ params }) => {
  const param = (await params) as IdParams;

  const queryClient = createQueryClient();

  await queryClient.prefetchQuery(adminMembershipQueryOptions(param.id));

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <main>
        <Section>
          <SectionHeader>
            <SectionTitle title="Kelola Membership" />
            <SectionDescription description="Atur dan pantau membership Anda di sini." />
          </SectionHeader>
          <SectionContent className="mt-4">
            <EditMembershipForm membershipId={param.id} />
          </SectionContent>
        </Section>
      </main>
    </HydrationBoundary>
  );
};
export default EditMembershipPage;
