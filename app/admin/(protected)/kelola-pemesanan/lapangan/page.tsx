import BookingTable from '@/components/admin/bookings/BookingTable';
import {
  Section,
  SectionContent,
  SectionDescription,
  SectionHeader,
  SectionTitle
} from '@/components/ui/section';

type ManageBookingPageProps = {
  searchParams?: Promise<{
    courtSport?: string;
  }>;
};

const ManageBookingPage = async ({ searchParams }: ManageBookingPageProps) => {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const courtSport = resolvedSearchParams?.courtSport === 'TENNIS' ? 'TENNIS' : 'PADEL';
  const courtSportLabel = courtSport === 'TENNIS' ? 'Tennis' : 'Padel';

  return (
    <main className="w-full min-w-0">
      <Section className="min-w-0 bg-transparent pt-0">
        <SectionHeader className="px-0">
          <SectionTitle title={`Kelola Pemesanan Lapangan ${courtSportLabel}`} />
          <SectionDescription
            description={`Atur dan pantau pemesanan lapangan ${courtSportLabel.toLowerCase()} Anda di sini.`}
          />
        </SectionHeader>
        <SectionContent className="min-w-0 px-0">
          <BookingTable courtSport={courtSport} />
        </SectionContent>
      </Section>
    </main>
  );
};
export default ManageBookingPage;
