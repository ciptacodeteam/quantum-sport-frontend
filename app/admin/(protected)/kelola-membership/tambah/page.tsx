import CreateMembershipForm from '@/components/admin/memberships/CreateMembershipForm';
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

const CreateMembershipPage = () => {
  return (
    <main className="w-full min-w-0">
      <Section className="gap-6">
        <SectionHeader className="gap-3">
          <Button asChild variant="ghost" size="sm" className="text-muted-foreground -ml-2 w-fit">
            <Link href="/admin/kelola-membership">
              <ArrowLeft />
              Kembali ke daftar Value Pack
            </Link>
          </Button>
          <SectionTitle title="Tambah Value Pack" className="text-2xl tracking-tight" />
          <SectionDescription description="Buat paket bermain dengan harga, kuota jam, dan benefit untuk pelanggan." />
        </SectionHeader>
        <SectionContent>
          <CreateMembershipForm />
        </SectionContent>
      </Section>
    </main>
  );
};
export default CreateMembershipPage;
