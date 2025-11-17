enum Role {
  ADMIN = 'ADMIN',
  COACH = 'COACH',
  BALLBOY = 'BALLBOY',
  CASHIER = 'CASHIER'
}

export type AdminProfile = {
  id: string;
  name: string;
  email: string;
  role: Role;
  phone: string | null;
  joinedAt: Date | null;
  isActive: boolean;
  image: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type UserProfile = {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image: string | null;
  phone: string;
  phoneVerified: boolean;
  banned: boolean;
  banReason: string | null;
  banExpires: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type Customer = UserProfile;

export type Inventory = {
  id: string;
  name: string;
  description: string;
  quantity: number;
  price: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type InventoryAvailability = {
  id: string;
  name: string;
  description: string;
  price: number;
  totalQuantity: number;
  availableQuantity: number;
  bookedQuantity: number;
};

export type CoachAvailability = {
  slotId: string;
  coach: {
    id: string;
    name: string;
    email?: string | null;
    phone?: string | null;
    image?: string | null;
    role?: string;
  };
  price: number;
  startAt: string;
  endAt: string;
};

export type PaymentMethod = {
  id: string;
  name: string;
  isActive: boolean;
  fees: number;
  percentage: string;
  channel: string | null;
  logo: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type Banner = {
  id: string;
  isActive: boolean;
  image: string | null;
  link: string | null;
  sequence: number;
  startAt: Date | null;
  endAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type Partnership = {
  id: string;
  name: string;
  description: string | null;
  logo: string | null; // absolute URL from GET
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type Court = {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  image: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type Tournament = {
  id: string;
  name: string;
  description: string | null;
  rules: string | null;
  rulesHtml: string | null;
  image: string | null;
  startDate: Date;
  endDate: Date;
  startTime: string;
  endTime: string;
  maxTeams: number;
  teamSize: number;
  entryFee: number;
  location: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type ClubJoinRequest = {
  id: string;
  clubId: string;
  userId: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    image?: string | null;
  };
};

export type Club = {
  id: string;
  name: string;
  description: string | null;
  logo: string | null;
  rules: string | null;
  leaderId: string;
  visibility: 'PUBLIC' | 'PRIVATE';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count: {
    clubMember: number;
  };

  leader?: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    image?: string | null;
  };
  clubMember?: Array<{
    user: {
      id: string;
      name: string;
      image?: string | null;
    };
  }>;
  joinRequests?: ClubJoinRequest[];
  isMember?: boolean;
  hasRequestedToJoin?: boolean;
};

export type Staff = {
  id: string;
  name: string;
  email: string;
  role: Role;
  phone: string | null;
  isActive: boolean;
  image: string | null;
  joinedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type Membership = {
  id: string;
  name: string;
  description: string | null;
  content: string | null;
  contentHtml: string | null;
  price: number;
  sessions: number;
  duration: number; // in days
  sequence: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  features: [];

  benefits?: MembershipBenefit[];
  membershipUser?: MembershipUser[];
};

export type MembershipBenefit = {
  id: string;
  membershipId: string;
  benefit: string;
  createdAt: Date;
  updatedAt: Date;

  membership?: Membership;
};

export type MembershipUser = {
  id: string;
  membershipId: string;
  userId: string;
  startDate: Date;
  endDate: Date | null;
  remainingSessions: number;
  remainingDuration: number; // in days
  isExpired: boolean;
  isSuspended: boolean;
  suspensionReason: string | null;
  suspensionEndDate: Date | null;
  createdAt: Date;
  updatedAt: Date;

  user?: UserProfile;
  membership?: Membership;
};

enum Gender {
  MALE,
  FEMALE,
  ALL
}

export type Class = {
  id: string;
  name: string;
  description: string | null;
  content: string | null;
  organizerName: string | null;
  speakerName: string | null;
  image: string | null;
  startDate: Date;
  endDate: Date;
  startTime: string;
  endTime: string;
  price: number;
  sessions: number;
  capacity: number;
  remaining: number;
  maxBookingPax: number;
  gender: Gender;
  ageMin: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type ClassBooking = {
  id: string;
  classId: string;
  userId: string;
  status: BookingStatus;
  totalPrice: number;
  processingFee: number;
  createdAt: Date;
  updatedAt: Date;
  cancelledAt: Date | null;
  cancellationReason: string | null;

  user?: UserProfile;
  class?: Class;
  details?: ClassBookingDetail[];
  invoice?: Invoice;
};

export type ClassBookingDetail = {
  id: string;
  classBookingId: string;
  date: Date;
  time: string;
  price: number;
  attendance: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type Invoice = {
  id: string;
  bookingId: string;
  classBookingId: string | null;
  membershipUserId: string | null;
  number: string;
  userId: string;
  paymentId: string | null;
  subtotal: number;
  processingFee: number;
  total: number;
  status: PaymentStatus;

  issuedAt: Date;
  dueDate: Date | null;
  paidAt: Date | null;
  cancelledAt: Date | null;
  createdAt: Date;
  updatedAt: Date;

  user?: UserProfile;
  payment?: Payment;
  booking?: Booking;
  classBooking?: ClassBooking;
  membershipUser?: MembershipUser;
};

enum BookingStatus {
  HOLD = 'HOLD', // temporary hold on slots before payment (expiry)
  CONFIRMED = 'CONFIRMED', // paid; slots locked
  CANCELLED = 'CANCELLED'
}

enum PaymentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  FAILED = 'FAILED',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED'
}

enum SlotType {
  COURT,
  COACH,
  BALLBOY
}

export type Slot = {
  id: string;
  type: SlotType;
  courtId: string | null;
  staffId: string | null;
  startAt: Date;
  endAt: Date;
  price: number;
  isAvailable: boolean;
  createdAt: Date;
  updatedAt: Date;

  court?: Court;
  staff?: Staff;
};

export type Booking = {
  id: string;
  userId: string;
  status: BookingStatus;
  totalPrice: number;
  processingFee: number;
  createdAt: Date;
  updatedAt: Date;
  holdExpiresAt: Date | null;
  cancelledAt: Date | null;
  cancellationReason: string | null;

  user?: UserProfile;
  details?: BookingDetail[];
  inventories?: Inventory[];
  ballboys?: Staff[];
  coaches?: Staff[];
  invoice?: Invoice;
};

export type BookingDetail = {
  id: string;
  bookingId: string;
  slotId: string;
  courtId: string | null;
  price: number;
  createdAt: Date;
  updatedAt: Date;

  booking?: Booking;
  slot?: Slot;
  court?: Court;
};

export type BookingInventory = {
  id: string;
  bookingId: string;
  inventoryId: string;
  quantity: number;
  price: number;
  createdAt: Date;
  updatedAt: Date;

  booking?: Booking;
  inventory?: Inventory;
};

export type BookingBallboy = Omit<BookingInventory, 'inventory', 'inventoryId', 'quantity'> & {
  slotId: string;
  slot?: Slot;
};

export type BookingCoachType = {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;

  bookingCoach?: BookingCoach[];
  coachTypeStaffPrices?: CoachTypeStaffPrice[];
};

export type CoachTypeStaffPrice = {
  id: string;
  staffId: string;
  coachTypeId: string;
  basePrice: number;
  createdAt: Date;
  updatedAt: Date;

  staff?: Staff;
  coachType?: BookingCoachType;
};

export type BookingCoach = {
  id: string;
  bookingId: string;
  slotId: string;
  bookingCoachTypeId: string;
  price: number;
  createdAt: Date;
  updatedAt: Date;

  booking?: Booking;
  slot?: Slot;
  bookingCoachType?: BookingCoachType;
};

export type CourtCostSchedule = {
  id: string;
  courtId: string;
  startAt: string;
  endAt: string;
  price: number;
  isAvailable: boolean;
  createdAt: Date;
  updatedAt: Date;

  court?: Court;
};

export type NotificationAudience = 'USER' | 'ADMIN' | 'ALL';
export type NotificationType =
  | 'ADMIN_PUSH'
  | 'BOOKING_REMINDER'
  | 'PAYMENT_SUCCESS'
  | 'PAYMENT_FAILED'
  | 'SYSTEM';

export type Notification = {
  id: string;
  userId: string | null;
  audience: NotificationAudience;
  type: NotificationType;
  title: string;
  message: string | null;
  data: any | null;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
  updatedAt: string;
  user?: UserProfile;
};

export type StatItem = {
  value: number;
  formatted?: string;
  percentageChange: number;
  trend: 'up' | 'down';
  description: string;
  subtitle: string;
};

export type DashboardStats = {
  totalRevenue: StatItem;
  totalSales: StatItem;
  newCustomers: StatItem;
  activeAccounts: StatItem;
};

export type DailyTransactionData = {
  date: string;
  total: number;
};

export type DailyTransactionSummary = {
  period: string;
  totalTransactions: number;
  totalRevenue: number;
  averagePerDay: number;
  daysWithTransactions: number;
  dateRange: {
    start: string;
    end: string;
  };
};

export type DailyTransactionsResponse = {
  chartData: DailyTransactionData[];
  summary: DailyTransactionSummary;
};

export type TransactionPeriod = '7days' | '30days' | '3months';

export type OngoingBookingCourt = {
  courtId: string;
  courtName: string;
  courtImage: string;
  slotStart: string;
  slotEnd: string;
  price: number;
};

export type OngoingBookingCoach = {
  coachId?: string;
  coachName: string;
  coachImage?: string;
  slotStart: string;
  slotEnd: string;
  price?: number;
};

export type OngoingBookingBallboy = {
  ballboyId?: string;
  ballboyName: string;
  slotStart: string;
  slotEnd: string;
};

export type OngoingBookingInventory = {
  inventoryId: string;
  inventoryName: string;
  quantity: number;
  price: number;
};

export type OngoingBookingSchedule = {
  startAt: string;
  endAt: string;
  status: 'upcoming' | 'ongoing' | 'completed';
  minutesFromNow: number;
  timeDisplay: string;
};

export type OngoingBookingInvoice = {
  id: string;
  number: string;
  status: string;
  total: number;
  paidAt: string | null;
};

export type OngoingBookingItem = {
  booking: {
    id: string;
    userId: string;
    status: string;
    totalPrice: number;
    processingFee: number;
    createdAt: string;
  };
  user: {
    id: string;
    name: string;
    email: string | null;
    phone: string;
    image: string | null;
  };
  schedule: OngoingBookingSchedule;
  courts: OngoingBookingCourt[];
  coaches: OngoingBookingCoach[];
  ballboys: OngoingBookingBallboy[];
  inventories: OngoingBookingInventory[];
  invoice: OngoingBookingInvoice | null;
};
