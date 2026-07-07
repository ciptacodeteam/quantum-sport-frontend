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
    <main>
      <Section>
        <SectionHeader>
          <SectionTitle title={`Kelola Pemesanan Lapangan ${courtSportLabel}`} />
          <SectionDescription
            description={`Atur dan pantau pemesanan lapangan ${courtSportLabel.toLowerCase()} Anda di sini.`}
          />
        </SectionHeader>
        <SectionContent>
          <BookingTable courtSport={courtSport} />
        </SectionContent>
      </Section>
    </main>
  );
};
export default ManageBookingPage;
