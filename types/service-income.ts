export type ServiceIncomeFilters = {
  coachType?: 'PADEL' | 'TENNIS' | 'PADEL_TENNIS';
  clubId?: string;
  staffId?: string;
  service?: 'COACH' | 'BALLBOY' | 'INHOUSE';
};
export type ServiceIncomeRow = {
  id: string;
  invoiceId: string;
  invoiceNumber: string;
  bookingId: string;
  customerName: string;
  branchId: string;
  branchName: string;
  paidAt: string;
  service: 'COACH' | 'BALLBOY';
  staffId: string | null;
  staffName: string;
  clubId: string | null;
  clubName: string;
  startAt: string;
  endAt: string;
  hours: number;
  isClubSettled?: boolean;
  description?: string | null;
  servicePrice: number;
  discount: number;
  amount: number;
};
export type ServiceIncomeReport = {
  inHouse?: {
    sessions: number;
    hours: number;
    coachAmount: number;
    extraAmount: number;
    rows: {
      id: string;
      bookingId: string;
      invoiceId: string | null;
      invoiceNumber: string | null;
      customerName: string;
      staffId: string;
      staffName: string;
      packageName: string;
      startAt: string;
      endAt: string;
      hours: number;
      participants: number | null;
      coachAmount: number;
      extraAmount: number | null;
    }[];
  };
  dateRange: { startDate: string; endDate: string };
  summary: {
    totalAmount: number;
    coachAmount: number;
    ballboyAmount: number;
    unassignedAmount: number;
    invoiceCount: number;
    sessions: number;
    clubCount: number;
  };
  clubs: {
    id: string;
    name: string;
    coachAmount: number;
    ballboyAmount: number;
    totalAmount: number;
    sessions: number;
    hours: number;
  }[];
  staff: {
    id: string;
    name: string;
    service: 'COACH' | 'BALLBOY';
    clubName: string;
    sessions: number;
    hours: number;
    amount: number;
  }[];
  rows: ServiceIncomeRow[];
  options: { clubs: { id: string; name: string }[]; staff: { id: string; name: string }[] };
};
