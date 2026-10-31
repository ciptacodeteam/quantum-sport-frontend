import MembershipTransactionTable from '@/components/admin/membership-transactions/MembershipTransactionTable';
import AppSectionHeader from '@/components/ui/app-section-header';
export default function MembershipDebtPage() {
  return (
    <main className="flex w-full min-w-0 flex-col gap-6">
      <AppSectionHeader
        title="Tunggakan Value Pack"
        description="Pantau saldo kuota minus pelanggan di seluruh cabang."
        className="mb-0 pb-0"
      />
      <MembershipTransactionTable debtsOnly />
    </main>
  );
}
