import BanCustomerAccess from '@/components/admin/customers/BanCustomerAccess';
import EditCustomerForm from '@/components/admin/customers/EditCustomerForm';
import ResetCustomerPassword from '@/components/admin/customers/ResetCustomerPassword';
import {
  Section,
  SectionContent,
  SectionDescription,
  SectionHeader,
  SectionTitle
} from '@/components/ui/section';
import { Separator } from '@/components/ui/separator';
import { createQueryClient } from '@/lib/query-client';
import { adminCustomerQueryOptions } from '@/queries/admin/customer';
import { type IdParams } from '@/types';
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';

const EditCustomerPage = async ({ params }) => {
  const param = (await params) as IdParams;

  const queryClient = createQueryClient();

  await queryClient.prefetchQuery(adminCustomerQueryOptions(param.id));

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <main>
        <Section>
          <SectionHeader>
            <SectionTitle title="Edit Kustomer" />
            <SectionDescription description="Perbarui informasi kustomer Anda di sini." />
          </SectionHeader>
          <SectionContent className="mt-4 grid grid-cols-1 justify-center xl:grid-cols-2 xl:gap-x-6">
            <div className="md:max-w-3xl">
              <EditCustomerForm customerId={param.id} />
            </div>
            <Separator className="mt-10 mb-6 block xl:hidden" />
            <div>
              <ResetCustomerPassword customerId={param.id} />
              <Separator className="my-4" />
              <BanCustomerAccess customerId={param.id} />
            </div>
          </SectionContent>
        </Section>
      </main>
    </HydrationBoundary>
  );
};
export default EditCustomerPage;
