import EditMembershipForm from '@/components/admin/memberships/EditMembershipForm';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
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
      <main className="w-full min-w-0">
        <Section className="gap-6">
          <SectionHeader className="gap-3">
            <Button asChild variant="ghost" size="sm" className="text-muted-foreground -ml-2 w-fit">
              <Link href="/admin/kelola-membership">
                <ArrowLeft />
                Kembali ke daftar Value Pack
              </Link>
            </Button>
            <SectionTitle title="Edit Value Pack" className="text-2xl tracking-tight" />
            <SectionDescription description="Perbarui informasi, harga, kuota jam, dan benefit Value Pack." />
          </SectionHeader>
          <SectionContent>
            <EditMembershipForm membershipId={param.id} />
          </SectionContent>
        </Section>
      </main>
    </HydrationBoundary>
  );
};
export default EditMembershipPage;
