'use client';
import BookingInHouseSelection, {
  usableInHouseWallets
} from '@/components/admin/booking/BookingInHouseSelection';
import { adminInHousePricing } from '@/lib/admin-inhouse-pricing';
import { inHouseApi } from '@/api/admin/inhouseCoaching';
import { useAdminCourtSports } from '@/hooks/useAdminCourtSports';
import { coachSessionsTotal } from '@/lib/coach-session-pricing';

import OfflinePaymentSelection from '@/components/admin/booking/OfflinePaymentSelection';
import { adminPaymentMethodsQueryOptions } from '@/queries/admin/paymentMethod';
import { isOfflinePaymentMethod } from '@/lib/offline-payment';
import { calculateAdminCoachingDiscount } from '@/lib/admin-coaching-discount';
import { useTariffPeriods } from '@/hooks/useTariffPeriods';
import type { AdminCheckoutPayload } from '@/api/admin/checkout';
import BookingBallboySelection from '@/components/admin/booking/BookingBallboySelection';
import type { BallboyAvailability } from '@/types/model';
import BookingCoachSelection, {
  coachSessionKey
} from '@/components/admin/booking/BookingCoachSelection';
import { adminApi } from '@/lib/adminApi';
import { isCourtWallSlotBookable } from '@/lib/booking-time-policy';
import type { CoachAvailability } from '@/types/model';
import BookingSummary from '@/components/admin/booking/BookingSummary';
import AppSectionHeader from '@/components/ui/app-section-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useMembershipDiscount } from '@/hooks/useMembershipDiscount';
import { adminCheckoutMutationOptions } from '@/mutations/admin/checkout';
import { type CustomerSearchResult } from '@/queries/admin/customer';
import { useBookingStore } from '@/stores/useBookingStore';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, UserRound, CircleUserRound, Sparkles } from 'lucide-react';
import { BookingServiceLoading } from '@/components/admin/booking/BookingServiceSessionPicker';
import { IconCalendar, IconChevronLeft, IconMapPin } from '@tabler/icons-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

export default function BookingAddOns() {
  const router = useRouter();
  const {
    selectedInHouse: storedInHouse = [],
    setSelectedInHouse,
    useMembership,
    setUseMembership,
    recurringBooking,
    bookingItems,
    selectedCustomerId,
    selectedCustomerName: storeCustomerName,
    selectedCustomerPhone: storeCustomerPhone,
    setSelectedCustomerId,
    setSelectedCustomerDetails,
    walkInName: storeWalkInName,
    walkInPhone: storeWalkInPhone,
    bookingAdminNote,
    setBookingAdminNote,
    setWalkInCustomer,
    selectedCoaches: storedCoaches,
    selectedBallboys: storedBallboys,
    addBallboy,
    removeBallboy,
    addCoach,
    removeCoach,
    removeBookingItem,
    setMembershipDiscount,
    courtTotal
  } = useBookingStore();

  const queryClient = useQueryClient();
  const [serviceTab, setServiceTab] = useState(storedInHouse.length ? 'inhouse' : 'club');
  const [paymentMethodId, setPaymentMethodId] = useState('');
  const [isCheckingCoaches, setIsCheckingCoaches] = useState(false);
  const selectedCoaches = storedCoaches.filter(
    (coach) =>
      coach.slotId &&
      coach.startAt &&
      coach.endAt &&
      bookingItems.some(
        (booking) =>
          coachSessionKey(booking) === coachSessionKey(coach) &&
          (booking.sport ?? 'PADEL') === coach.courtSport
      )
  );
  const selectedBallboys = storedBallboys.filter(
    (item) =>
      item.slotId &&
      item.startAt &&
      item.endAt &&
      bookingItems.some(
        (booking) =>
          booking.slotId === item.courtSlotId && (booking.sport ?? 'PADEL') === item.courtSport
      )
  );
  const ballboyTotal = selectedBallboys.reduce((sum, item) => sum + item.price, 0);
  const coachTotal = coachSessionsTotal(selectedCoaches);

  const courtSport = useMemo<'PADEL' | 'TENNIS'>(
    () => bookingItems.find((item) => item.sport)?.sport ?? 'PADEL',
    [bookingItems]
  );
  const { branchId } = useAdminCourtSports();
  const tariffQuery = useTariffPeriods(true);
  const tariffRules = tariffQuery.rules;
  const inHouseWallets = useQuery({
    queryKey: ['admin', 'inhouse', 'wallets', branchId, selectedCustomerId, 'available'],
    queryFn: () => inHouseApi.wallets(selectedCustomerId!, true),
    staleTime: 30000,
    enabled:
      !!selectedCustomerId &&
      !!branchId &&
      branchId !== 'all' &&
      (serviceTab === 'inhouse' || storedInHouse.length > 0)
  });
  const inHousePlans = useQuery({
    queryKey: ['admin', 'inhouse', 'plans', branchId],
    queryFn: inHouseApi.plans,
    staleTime: 60000,
    enabled:
      !!branchId && branchId !== 'all' && (serviceTab === 'inhouse' || storedInHouse.length > 0)
  });
  const singleHourPlans = (inHousePlans.data ?? []).filter(
    (plan) =>
      plan.hours === 1 &&
      plan.isActive &&
      plan.staff.isActive &&
      (plan.staff.coachType === courtSport || plan.staff.coachType === 'PADEL_TENNIS')
  );
  const selectionAvailable = (selection: (typeof storedInHouse)[number]) =>
    selection.planId
      ? !inHousePlans.isPending &&
        !inHousePlans.isError &&
        singleHourPlans.some((p) => p.id === selection.planId)
      : !!selectedCustomerId &&
        !inHouseWallets.isPending &&
        !inHouseWallets.isError &&
        usableWallets.some((w) => w.id === selection.walletId);
  const usableWallets = usableInHouseWallets(inHouseWallets.data ?? [], courtSport);
  const inHouseSelections = storedInHouse.filter((selection) =>
    bookingItems.some((item) => item.slotId === selection.courtSlotId)
  );
  const hasDirectInHouse = inHouseSelections.some((selection) => !!selection.planId);
  const inHouseReady =
    (!hasDirectInHouse || (!tariffQuery.isPending && !tariffQuery.isError)) &&
    inHouseSelections.every(selectionAvailable);
  const inHouseLoading =
    (hasDirectInHouse && tariffQuery.isPending) ||
    inHouseSelections.some((selection) =>
      selection.planId ? inHousePlans.isPending : inHouseWallets.isPending
    );
  const {
    coverage: inHouseCoverage,
    extras: inHouseExtras,
    singleTotal: inHouseSingleTotal
  } = adminInHousePricing(
    bookingItems,
    inHouseSelections,
    singleHourPlans,
    usableWallets,
    tariffRules
  );

  // Customer selection is now handled by BookingSummary component
  // Keep selectedCustomer state for membership discount calculation
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerSearchResult | null>(null);

  // Calculate membership discount for court bookings
  // Pass membership data from selected customer to avoid separate API call
  const membershipDiscount = useMembershipDiscount(
    selectedCustomerId || null,
    bookingItems,
    selectedCustomer ? { activeMembership: selectedCustomer.activeMembership } : null,
    false,
    courtSport,
    recurringBooking ? true : useMembership,
    undefined,
    !!recurringBooking
  );

  // Update store with membership discount
  useEffect(() => {
    setMembershipDiscount(membershipDiscount.discountAmount);
  }, [membershipDiscount.discountAmount, setMembershipDiscount]);

  const totalAmount =
    membershipDiscount.discountedTotal +
    coachTotal +
    ballboyTotal -
    inHouseCoverage +
    inHouseExtras +
    inHouseSingleTotal;

  const amountDue = Math.max(
    0,
    totalAmount -
      (membershipDiscount.canUseMembership
        ? 0
        : calculateAdminCoachingDiscount(bookingItems, selectedCoaches, tariffRules))
  );
  const paymentMethods = useQuery({ ...adminPaymentMethodsQueryOptions, enabled: amountDue > 0 });
  const offlineMethods = (paymentMethods.data ?? []).filter(isOfflinePaymentMethod);
  const selectedPaymentMethod = offlineMethods.find((method) => method.id === paymentMethodId);
  const paymentReady =
    amountDue <= 0 ||
    (!!selectedPaymentMethod && !paymentMethods.isPending && !paymentMethods.isError);

  // Group bookings by date and get unique dates with their time slots
  const bookingsByDate = bookingItems.reduce(
    (groups, item) => {
      const date = item.date;
      if (!groups[date]) {
        groups[date] = {
          date,
          dayName: dayjs(date).format('dddd'),
          formattedDate: dayjs(date).format('DD MMM YYYY'),
          shortDate: dayjs(date).format('ddd, DD MMM'),
          timeSlots: [],
          items: []
        };
      }
      if (!groups[date].timeSlots.includes(item.timeSlot)) {
        groups[date].timeSlots.push(item.timeSlot);
      }
      groups[date].items.push(item);
      return groups;
    },
    {} as Record<
      string,
      {
        date: string;
        dayName: string;
        formattedDate: string;
        shortDate: string;
        timeSlots: string[];
        items: typeof bookingItems;
      }
    >
  );

  // Keep matching coach choices when going back to court selection; discard orphaned services.
  useEffect(() => {
    const state = useBookingStore.getState();
    const coaches = state.selectedCoaches.filter(
      (coach) =>
        coach.slotId &&
        coach.startAt &&
        coach.endAt &&
        bookingItems.some(
          (booking) =>
            coachSessionKey(booking) === coachSessionKey(coach) &&
            (booking.sport ?? 'PADEL') === coach.courtSport
        )
    );
    const ballboys = state.selectedBallboys.filter(
      (item) =>
        item.slotId &&
        item.startAt &&
        item.endAt &&
        bookingItems.some(
          (booking) =>
            booking.slotId === item.courtSlotId && (booking.sport ?? 'PADEL') === item.courtSport
        )
    );
    if (
      coaches.length !== state.selectedCoaches.length ||
      state.selectedInventories.length ||
      state.inventoryTotal !== 0 ||
      ballboys.length !== state.selectedBallboys.length ||
      state.coachDescription
    ) {
      useBookingStore.setState({
        selectedCoaches: coaches,
        coachTotal: coachSessionsTotal(coaches),
        selectedInventories: [],
        inventoryTotal: 0,
        selectedBallboys: ballboys,
        ballboyTotal: ballboys.reduce((sum, item) => sum + item.price, 0),
        coachDescription: null
      });
    }
  }, [bookingItems]);

  const { mutate: confirmCheckout, isPending: isConfirming } = useMutation(
    adminCheckoutMutationOptions({
      onSuccess: () => {
        // Invalidate slots query to refresh availability
        for (const queryKey of [
          ['courts', 'slots'],
          ['admin', 'court-costing'],
          ['admin', 'courts'],
          ['admin', 'schedule'],
          ['admin', 'bookings'],
          ['admin', 'booking-coaches'],
          ['admin', 'booking-ballboys'],
          ['admin', 'coaching'],
          ['admin', 'inhouse']
        ])
          void queryClient.invalidateQueries({ queryKey });
        // Reset booking store after successful admin checkout
        useBookingStore.getState().clearAll();
        router.push(`/admin/kelola-pemesanan/lapangan?courtSport=${courtSport}`);
      }
    })
  );

  const handleConfirmBooking = async () => {
    if (isConfirming || isCheckingCoaches) return;
    if (
      bookingItems.some(
        (item) =>
          !item.slotId ||
          !isCourtWallSlotBookable(
            item.startAt ?? `${item.date} ${item.timeSlot.slice(0, 5)}:00`,
            Date.now()
          )
      )
    ) {
      toast.error(
        'Ada slot yang tidak valid atau melewati batas pemesanan 15 menit. Silakan pilih ulang.'
      );
      return;
    }
    if (bookingItems.length === 0) {
      toast.error('Pilih minimal satu lapangan terlebih dahulu.');
      return;
    }

    if (!paymentReady) {
      toast.error('Pilih metode pembayaran offline terlebih dahulu.');
      return;
    }
    if (
      inHouseSelections.length &&
      (recurringBooking ||
        useMembership ||
        inHouseSelections.some((selection) => !selectionAvailable(selection)))
    ) {
      toast.error(
        'Periksa kembali kuota in-house dan nonaktifkan membership lapangan sebelum konfirmasi.'
      );
      return;
    }
    const courtSlots = bookingItems.map((b) => b.slotId).filter(Boolean);
    const totalHours = bookingItems.reduce((sum, item) => {
      const start = dayjs(item.startAt ?? `${item.date} ${item.timeSlot.slice(0, 5)}`);
      const endTime = item.endTime || item.timeSlot.split(' - ')[1];
      let end = item.endAt
        ? dayjs(item.endAt)
        : endTime
          ? dayjs(`${item.date} ${endTime}`)
          : start.add(1, 'hour');
      if (!item.endAt && end.isValid() && !end.isAfter(start)) end = end.add(1, 'day');
      const hours = end.diff(start, 'hour', true);
      return sum + (Number.isFinite(hours) && hours > 0 ? hours : 1);
    }, 0);

    const payload: AdminCheckoutPayload = {
      expectedTotal: amountDue,
      totalHours: Math.max(1, Math.round(totalHours * 100) / 100), // Round to 2 decimal places, minimum 1,
      courtSlots: courtSlots.length > 0 ? courtSlots : undefined,
      adminNote: bookingAdminNote || undefined,
      ...(amountDue > 0 ? { paymentMethodId: selectedPaymentMethod!.id } : {}),
      useMembership: recurringBooking ? true : useMembership,
      ...(recurringBooking ? { recurringBooking } : {}),
      ...(inHouseSelections.length ? { inHouseSelections } : {})
    };

    if (selectedCustomerId) {
      payload.userId = selectedCustomerId;
    } else if (storeWalkInName && storeWalkInPhone) {
      payload.name = storeWalkInName;
      payload.phone = storeWalkInPhone;
    } else {
      toast.error('Pilih pelanggan atau lengkapi data walk-in.');
      return;
    }

    if (selectedCoaches.length > 0 || selectedBallboys.length > 0) {
      setIsCheckingCoaches(true);
      try {
        const requests = new Map<string, Promise<{ data: { data: unknown } }>>();
        const checkAvailability = (kind: string, startAt?: string, endAt?: string) => {
          const key = `${kind}|${startAt}|${endAt}|${courtSport}`;
          let request = requests.get(key);
          if (!request) {
            request = adminApi.get(`/${kind}/availability`, {
              params: { startAt, endAt, courtSport },
              timeout: 15000
            });
            requests.set(key, request);
          }
          return request;
        };
        const availability = await Promise.all([
          ...selectedCoaches.map(async (coach) => {
            const response = await checkAvailability('coach', coach.startAt, coach.endAt);
            return (response.data.data as CoachAvailability[]).some(
              (option) =>
                option.slotId === coach.slotId &&
                option.price === coach.price &&
                (option.additionalHourPrice ?? null) === (coach.additionalHourPrice ?? null)
            );
          }),
          ...selectedBallboys.map(async (item) => {
            const response = await checkAvailability('ballboy', item.startAt, item.endAt);
            return (response.data.data as BallboyAvailability[]).some(
              (option) => option.slotId === item.slotId && option.price === item.price
            );
          })
        ]);
        if (availability.some((available) => !available)) {
          toast.error(
            'Jadwal atau harga layanan berubah. Silakan pilih ulang atau lanjutkan tanpa layanan.'
          );
          void queryClient.invalidateQueries({ queryKey: ['admin', 'booking-coaches'] });
          void queryClient.invalidateQueries({ queryKey: ['admin', 'booking-ballboys'] });
          return;
        }
        if (selectedCoaches.length)
          payload.coachSlots = selectedCoaches.map((coach) => coach.slotId!);
        if (selectedBallboys.length)
          payload.ballboySlots = selectedBallboys.map((item) => ({
            slotId: item.slotId!,
            courtSlotId: item.courtSlotId!
          }));
        const coachGroups = selectedCoaches
          .filter((coach) => coach.coachingGroupId)
          .map((coach) => ({ slotId: coach.slotId!, coachingGroupId: coach.coachingGroupId! }));
        if (coachGroups.length) payload.coachGroups = coachGroups;
        confirmCheckout(payload);
      } catch {
        toast.error(
          'Gagal memeriksa ketersediaan layanan. Coba lagi atau lanjutkan tanpa layanan.'
        );
      } finally {
        setIsCheckingCoaches(false);
      }
    } else confirmCheckout(payload);
  };

  return (
    <div className="flex w-full min-w-0 flex-col gap-6">
      <AppSectionHeader
        title="Tambah Layanan"
        description="Periksa jadwal bermain, tambah layanan bila diperlukan, lalu selesaikan booking."
        className="mb-0 pb-0"
      />

      {recurringBooking && (
        <div className="rounded border p-4 text-sm">
          Booking rutin khusus membership. Kuota jadwal ini belum dipotong saat checkout; pemotongan
          dilakukan pada jam bermain dan saldo boleh minus.
        </div>
      )}

      <div className="grid min-w-0 grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_380px] 2xl:grid-cols-[minmax(0,1fr)_420px]">
        {/* Main Content */}
        <div className="flex min-w-0 flex-col gap-5">
          {/* Court Bookings Summary or Date/Time Selection */}
          {bookingItems.length > 0 ? (
            <Card className="min-w-0 gap-4 py-5">
              <CardHeader className="gap-2 px-5">
                <CardTitle className="flex flex-wrap items-center gap-2 text-base leading-snug">
                  <IconCalendar className="text-primary h-5 w-5" />
                  <span className="text-muted-foreground text-xs font-medium">01</span> Jadwal
                  bermain
                  <Badge variant="outline" className="ml-auto">
                    {bookingItems.length} jam ·{' '}
                    {new Set(bookingItems.map((item) => item.courtId)).size} lapangan
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="px-5">
                <div className="flex flex-col gap-5">
                  {Object.entries(bookingsByDate).map(([date, dateInfo]) => (
                    <div key={date} className="flex flex-col gap-3">
                      <p className="text-muted-foreground text-xs font-medium">
                        {dateInfo.dayName}, {dateInfo.formattedDate}
                      </p>
                      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,260px),1fr))] gap-3">
                        {Array.from(new Set(dateInfo.items.map((booking) => booking.courtId))).map(
                          (courtId) => {
                            const sessions = dateInfo.items
                              .filter((booking) => booking.courtId === courtId)
                              .sort((a, b) => a.timeSlot.localeCompare(b.timeSlot));
                            return (
                              <section
                                key={courtId}
                                aria-label={sessions[0].courtName}
                                className="min-w-0 overflow-hidden rounded-lg border"
                              >
                                <div className="bg-muted/40 flex items-center gap-2.5 border-b px-4 py-3">
                                  <IconMapPin
                                    className="text-muted-foreground size-4 shrink-0"
                                    aria-hidden="true"
                                  />
                                  <h3 className="text-sm leading-snug font-medium break-words">
                                    {sessions[0].courtName}
                                  </h3>
                                </div>
                                <dl className="divide-y px-4">
                                  {sessions.map((booking) => (
                                    <div
                                      key={booking.slotId}
                                      className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-3"
                                    >
                                      <dt className="text-muted-foreground text-xs tabular-nums">
                                        {booking.timeSlot}
                                      </dt>
                                      <dd className="text-sm font-medium tabular-nums">
                                        Rp {booking.price.toLocaleString('id-ID')}
                                      </dd>
                                    </div>
                                  ))}
                                </dl>
                              </section>
                            );
                          }
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <p className="text-muted-foreground rounded-xl border border-dashed p-6 text-sm">
              Pilih lapangan dan jam bermain terlebih dahulu melalui halaman Pilihan Lapangan.
            </p>
          )}

          {bookingItems.length > 0 && (
            <section
              className="bg-background min-w-0 overflow-hidden rounded-md border-0 shadow-none"
              aria-label="Layanan tambahan booking"
            >
              <header className="flex items-start gap-3 border-b p-5">
                <span className="bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-xl">
                  <Sparkles className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-muted-foreground text-xs font-medium">02</span>
                    <h2 className="font-semibold">Layanan tambahan</h2>
                    <Badge variant="outline">Opsional</Badge>
                  </div>
                  <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
                    Pilih jenis layanan dan jam bermain. Pilihan yang sudah diterapkan tetap
                    tersimpan saat berpindah tab.
                  </p>
                </div>
              </header>
              <Tabs value={serviceTab} onValueChange={setServiceTab} className="gap-0">
                <div className="px-4 py-3 sm:px-5">
                  <TabsList
                    aria-label="Jenis layanan"
                    className="bg-muted/35 grid h-auto w-full max-w-md grid-cols-3 gap-1 rounded-md p-1"
                  >
                    {[
                      {
                        value: 'club',
                        label: 'Coach Club',
                        count: selectedCoaches.length,
                        Icon: Users
                      },
                      {
                        value: 'inhouse',
                        label: 'In-house',
                        count: inHouseSelections.length,
                        Icon: UserRound
                      },
                      {
                        value: 'ballboy',
                        label: 'Ballboy',
                        count: selectedBallboys.length,
                        Icon: CircleUserRound
                      }
                    ].map(({ value, label, count, Icon }) => (
                      <TabsTrigger
                        key={value}
                        value={value}
                        aria-label={label}
                        className="text-muted-foreground hover:text-foreground hover:bg-muted/40 data-[state=active]:bg-primary/5 data-[state=active]:text-primary dark:data-[state=active]:bg-primary/10 dark:data-[state=active]:text-primary h-9 min-w-0 gap-1.5 rounded-sm border-0 px-2 py-2 text-xs shadow-none transition-[background-color,color] duration-200 focus-visible:ring-2 data-[state=active]:shadow-none motion-reduce:transition-none sm:px-3 sm:text-sm"
                      >
                        <Icon className="size-4 shrink-0" />
                        <span>{label}</span>
                        {count > 0 && (
                          <span className="bg-primary/10 text-primary rounded-full px-1.5 text-[10px] leading-4">
                            {count}
                          </span>
                        )}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </div>
                <TabsContent
                  forceMount
                  hidden={serviceTab !== 'inhouse'}
                  value="inhouse"
                  className="m-0 min-w-0 p-4 data-[state=inactive]:hidden sm:p-5"
                >
                  {!recurringBooking && inHousePlans.isPending && (
                    <BookingServiceLoading label="Memuat tarif coaching in-house..." />
                  )}
                  {recurringBooking ? (
                    <p className="text-muted-foreground rounded-xl border border-dashed p-5 text-sm">
                      Coaching in-house tidak tersedia untuk booking rutin Value Pack.
                    </p>
                  ) : (
                    !inHousePlans.isPending &&
                    !inHousePlans.isError &&
                    !singleHourPlans.length &&
                    !usableWallets.length && (
                      <p className="text-muted-foreground rounded-xl border border-dashed p-5 text-sm">
                        Belum ada tarif satuan atau kuota in-house untuk customer ini. Pilih
                        customer di ringkasan booking untuk melihat kuotanya.
                      </p>
                    )
                  )}
                  {inHousePlans.isError && (
                    <p role="alert" className="text-sm">
                      Tarif coaching satuan belum dapat dimuat.{' '}
                      <button
                        type="button"
                        className="underline"
                        onClick={() => void inHousePlans.refetch()}
                      >
                        Coba lagi
                      </button>
                    </p>
                  )}
                  {selectedCustomerId && inHouseWallets.isError && (
                    <p role="alert" className="text-sm">
                      Kuota in-house belum dapat dimuat.{' '}
                      <button className="underline" onClick={() => void inHouseWallets.refetch()}>
                        Coba lagi
                      </button>
                    </p>
                  )}
                  {inHouseSelections.length > 0 &&
                    !inHouseLoading &&
                    inHouseSelections.some((selection) => !selectionAvailable(selection)) && (
                      <div role="alert" className="rounded border p-4 text-sm">
                        Pilihan tarif atau kuota in-house sudah tidak tersedia.{' '}
                        <button
                          type="button"
                          className="text-primary underline"
                          onClick={() => setSelectedInHouse([])}
                        >
                          Hapus pilihan paket
                        </button>
                      </div>
                    )}
                  {bookingItems.length > 0 && !recurringBooking && (
                    <BookingInHouseSelection
                      embedded
                      active={serviceTab === 'inhouse'}
                      key={`${branchId}:${selectedCustomerId}`}
                      wallets={usableWallets}
                      plans={singleHourPlans}
                      sessions={bookingItems}
                      selected={inHouseSelections}
                      disabled={isConfirming || isCheckingCoaches}
                      onChange={(session, selection) => {
                        const next = inHouseSelections.filter(
                          (item) => item.courtSlotId !== session.slotId
                        );
                        if (selection) {
                          setUseMembership(false);
                          storedCoaches
                            .filter((coach) => coachSessionKey(coach) === coachSessionKey(session))
                            .forEach((coach) =>
                              removeCoach(coach.coachId, coach.timeSlot, coach.slotId)
                            );
                          next.push(selection);
                        }
                        setSelectedInHouse(next);
                      }}
                    />
                  )}
                </TabsContent>
                <TabsContent
                  forceMount
                  hidden={serviceTab !== 'club'}
                  value="club"
                  className="m-0 min-w-0 p-4 data-[state=inactive]:hidden sm:p-5"
                >
                  {bookingItems.length > 0 && (
                    <BookingCoachSelection
                      embedded
                      active={serviceTab === 'club'}
                      sessions={bookingItems}
                      sport={courtSport}
                      selected={selectedCoaches}
                      disabled={isConfirming || isCheckingCoaches}
                      onSelect={(session, coach) => {
                        const sessionCoaches = storedCoaches.filter(
                          (item) => coachSessionKey(item) === coachSessionKey(session)
                        );
                        if (!coach) {
                          sessionCoaches.forEach((item) =>
                            removeCoach(item.coachId, item.timeSlot, item.slotId)
                          );
                          return;
                        }
                        const existing = sessionCoaches.find(
                          (item) => item.coachId === coach.coachId
                        );
                        if (existing) {
                          removeCoach(existing.coachId, existing.timeSlot, existing.slotId);
                          if (existing.coachingGroupId === coach.coachingGroupId) return;
                        }
                        setSelectedInHouse(
                          inHouseSelections.filter((selection) => {
                            const court = bookingItems.find(
                              (item) => item.slotId === selection.courtSlotId
                            );
                            return !court || coachSessionKey(court) !== coachSessionKey(session);
                          })
                        );
                        addCoach(coach);
                      }}
                    />
                  )}
                </TabsContent>
                <TabsContent
                  forceMount
                  hidden={serviceTab !== 'ballboy'}
                  value="ballboy"
                  className="m-0 min-w-0 p-4 data-[state=inactive]:hidden sm:p-5"
                >
                  {bookingItems.length > 0 && (
                    <BookingBallboySelection
                      embedded
                      active={serviceTab === 'ballboy'}
                      sessions={bookingItems}
                      sport={courtSport}
                      selected={selectedBallboys}
                      disabled={isConfirming || isCheckingCoaches}
                      onSelect={(session, ballboy) => {
                        storedBallboys
                          .filter((item) => item.courtSlotId === session.slotId)
                          .forEach((item) =>
                            removeBallboy(item.ballboyId, item.timeSlot, item.slotId)
                          );
                        if (ballboy) addBallboy(ballboy);
                      }}
                    />
                  )}{' '}
                </TabsContent>
              </Tabs>
            </section>
          )}
        </div>

        {/* Booking Summary - Responsive */}
        <BookingSummary
          bookingItems={bookingItems}
          selectedCustomerId={selectedCustomerId}
          selectedCustomerName={storeCustomerName}
          selectedCustomerPhone={storeCustomerPhone}
          walkInName={storeWalkInName}
          walkInPhone={storeWalkInPhone}
          adminNote={bookingAdminNote}
          onCustomerSelect={(customerId, customer) => {
            setSelectedInHouse([]);
            setSelectedCustomerId(customerId);
            setSelectedCustomer(customer);
            setSelectedCustomerDetails(customer.name, customer.phone);
            setWalkInCustomer(null, null);
          }}
          onCustomerClear={() => {
            setSelectedInHouse([]);
            setSelectedCustomerId(null);
            setSelectedCustomer(null);
          }}
          onWalkInSet={(name, phone) => {
            setWalkInCustomer(name, phone);
            setSelectedInHouse([]);
            setSelectedCustomerId(null);
            setSelectedCustomer(null);
          }}
          onAdminNoteChange={setBookingAdminNote}
          onWalkInClear={() => {
            setWalkInCustomer(null, null);
            setBookingAdminNote(null);
          }}
          selectedBallboys={selectedBallboys}
          onBallboyRemove={removeBallboy}
          ballboyTotal={ballboyTotal}
          selectedCoaches={selectedCoaches}
          onCoachRemove={removeCoach}
          coachTotal={coachTotal}
          onBookingGroupRemove={(items) => {
            const removed = new Set(items.map((item) => item.slotId));
            const state = useBookingStore.getState();
            state.setBookingItems(state.bookingItems.filter((item) => !removed.has(item.slotId)));
          }}
          onBookingRemove={removeBookingItem}
          showCourtBookings={bookingItems.length > 0}
          courtTotal={courtTotal}
          totalAmount={totalAmount}
          membershipDiscountDetails={membershipDiscount}
          useMembership={recurringBooking ? true : useMembership}
          onUseMembershipChange={
            recurringBooking
              ? undefined
              : (enabled) => {
                  if (enabled) setSelectedInHouse([]);
                  setUseMembership(enabled);
                }
          }
          inHouseCoverage={inHouseCoverage}
          inHouseExtras={inHouseExtras}
          inHouseSingleTotal={inHouseSingleTotal}
          inHousePricingPending={inHouseLoading || !inHouseReady}
          paymentControls={
            <OfflinePaymentSelection
              amountDue={amountDue}
              methods={offlineMethods}
              selectedId={selectedPaymentMethod?.id ?? ''}
              onSelect={setPaymentMethodId}
              loading={paymentMethods.isPending}
              error={paymentMethods.isError}
              onRetry={() => {
                void paymentMethods.refetch();
              }}
              disabled={isConfirming || isCheckingCoaches}
            />
          }
          primaryAction={{
            label: 'Konfirmasi Booking',
            onClick: () => {
              void handleConfirmBooking();
            },
            disabled:
              isConfirming ||
              isCheckingCoaches ||
              bookingItems.length === 0 ||
              !paymentReady ||
              !inHouseReady,
            loading: isConfirming || isCheckingCoaches
          }}
          secondaryActions={[
            {
              label: 'Kembali ke Pilihan Lapangan',
              onClick: () => router.push(`/admin/booking-lapangan?courtSport=${courtSport}`),
              variant: 'outline',
              icon: <IconChevronLeft className="mr-2 h-4 w-4" />
            }
          ]}
          width="w-full min-w-0"
        />
      </div>
    </div>
  );
}
