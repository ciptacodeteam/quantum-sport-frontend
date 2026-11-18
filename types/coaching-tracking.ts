export type CoachingPackage = {
  id: string;
  name: string;
  coachName: string;
  coachType: string | null;
  branchName: string;
  status: 'ACTIVE' | 'EXHAUSTED' | 'SUSPENDED';
  totalHours: number;
  remainingHours: number;
  usedHours: number;
  createdAt: string;
  purchaseInvoice: { number: string; status: string } | null;
  usage: Array<{
    id: string;
    hours: number;
    participants: number;
    createdAt: string;
    restoredAt: string | null;
    status: string;
    startAt: string;
    endAt: string;
    courtName: string | null;
    branchName: string;
    invoiceNumber: string | null;
  }>;
};
