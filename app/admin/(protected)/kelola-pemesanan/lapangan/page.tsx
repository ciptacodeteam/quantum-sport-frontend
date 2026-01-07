import BookingTable from '@/components/admin/bookings/BookingTable';
import {
  Section,
  SectionContent,
  SectionDescription,
  SectionHeader,
  SectionTitle
} from '@/components/ui/section';

const ManageBookingPage = () => {
  return (
    <main>
      <Section>
        <SectionHeader>
          <SectionTitle title="Kelola Pemesanan Lapangan" />
          <SectionDescription description="Atur dan pantau pemesanan lapangan Anda di sini." />
        </SectionHeader>
        <SectionContent>
          <BookingTable />
        </SectionContent>
      </Section>
    </main>
  );
};
export default ManageBookingPage;
