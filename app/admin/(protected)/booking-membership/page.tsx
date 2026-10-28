'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from '@/components/ui/command';
import { IconCalendar, IconCheck, IconUser, IconUserPlus } from '@tabler/icons-react';
import { cn } from '@/lib/utils';
import { membershipTypeDescriptions, membershipTypeLabels } from '@/lib/membership-hours';
import { toast } from 'sonner';
import { adminMembershipsQueryOptions } from '@/queries/admin/membership';
import type { AdminMembershipCheckoutPayload } from '@/api/admin/membership';
import {
  adminCustomerSearchQueryOptions,
  type CustomerSearchResult
} from '@/queries/admin/customer';
import { adminMembershipCheckoutMutationOptions } from '@/mutations/admin/membership';
import type { Membership } from '@/types/model';

type MembershipSport = 'PADEL' | 'TENNIS';

const sportLabels: Record<MembershipSport, string> = {
  PADEL: 'Padel',
  TENNIS: 'Tennis'
};

const formatCurrency = (value?: number | null) => {
  if (!value && value !== 0) return '-';
  return `Rp ${new Intl.NumberFormat('id-ID').format(value)}`;
};

const BookingMembershipPage = () => {
  const router = useRouter();
  const [selectedSport, setSelectedSport] = useState<MembershipSport>('PADEL');

  const { data: membershipsData, isPending: isMembershipsLoading } = useQuery(
    adminMembershipsQueryOptions({ sport: selectedSport })
  );

  const memberships = useMemo<Membership[]>(() => {
    if (!membershipsData) return [];
    return [...membershipsData].sort((a, b) => a.sequence - b.sequence);
  }, [membershipsData]);

  const [selectedMembershipId, setSelectedMembershipId] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<Date | undefined>(new Date());
  const [isCustomerOpen, setIsCustomerOpen] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerSearchResult | null>(null);
  const [isWalkInOpen, setIsWalkInOpen] = useState(false);
  const [walkInName, setWalkInName] = useState('');
  const [walkInPhone, setWalkInPhone] = useState('');

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(customerSearch);
    }, 300);
    return () => clearTimeout(timer);
  }, [customerSearch]);

  useEffect(() => {
    setSelectedMembershipId(null);
  }, [selectedSport]);

  // Use search endpoint instead of fetching all customers
  const { data: searchResults, isLoading: isSearching } = useQuery(
    adminCustomerSearchQueryOptions({
      q: debouncedSearch,
      limit: '20'
    })
  );

  const selectedMembership = useMemo(
    () => memberships.find((item) => item.id === selectedMembershipId),
    [memberships, selectedMembershipId]
  );

  const { mutate: createMembershipCheckout, isPending: isSubmitting } = useMutation(
    adminMembershipCheckoutMutationOptions({
      onSuccess: () => {
        toast.success('Checkout membership berhasil dibuat.');
        router.push('/admin/kelola-pemesanan/membership');
      }
    })
  );

  const handleSubmit = () => {
    if (!selectedMembershipId) {
      toast.error('Silakan pilih paket membership terlebih dahulu.');
      return;
    }

    if (!customerId && (!walkInName.trim() || !walkInPhone.trim())) {
      toast.error('Pilih pelanggan atau isi data walk-in customer.');
      return;
    }

    const payload: AdminMembershipCheckoutPayload = {
      membershipId: selectedMembershipId
    };

    if (startDate) {
      payload.startDate = dayjs(startDate).startOf('day').toISOString();
    }

    if (customerId) {
      payload.userId = customerId;
    } else {
      payload.name = walkInName.trim();
      payload.phone = walkInPhone.trim();
    }

    createMembershipCheckout(payload);
  };

  const canSubmit = Boolean(
    selectedMembershipId &&
    (customerId || (walkInName.trim().length > 0 && walkInPhone.trim().length >= 5))
  );

  return (
    <main className="w-full min-w-0 space-y-6 pb-6">
      <header className="space-y-2">
        <h1 className="text-lg font-semibold">Booking Value Pack</h1>
        <p className="text-muted-foreground text-sm">
          Pilih paket, pelanggan, dan tanggal mulai membership.
        </p>
      </header>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_360px] 2xl:grid-cols-[minmax(0,1fr)_400px]">
        <section className="min-w-0 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold">Pilihan paket</h2>
              {!isMembershipsLoading && (
                <span className="text-muted-foreground bg-muted rounded-md px-2 py-0.5 text-xs">
                  {memberships.length}
                </span>
              )}
            </div>
            <Tabs
              value={selectedSport}
              onValueChange={(value) => setSelectedSport(value as MembershipSport)}
            >
              <TabsList className="grid h-10 w-full grid-cols-2 sm:w-48">
                <TabsTrigger value="PADEL">Padel</TabsTrigger>
                <TabsTrigger value="TENNIS">Tennis</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {isMembershipsLoading ? (
              <div className="text-muted-foreground rounded-2xl border bg-white p-8 text-center text-sm shadow-sm">
                Memuat paket membership...
              </div>
            ) : memberships.length === 0 ? (
              <div className="text-muted-foreground rounded-2xl border bg-white p-8 text-center text-sm shadow-sm">
                Belum ada paket membership yang aktif.
              </div>
            ) : (
              memberships.map((membership) => {
                const isSelected = membership.id === selectedMembershipId;
                const benefits = membership.benefits?.map((benefit) => benefit.benefit) ?? [];

                return (
                  <button
                    key={membership.id}
                    type="button"
                    aria-pressed={isSelected}
                    className={cn(
                      'group bg-card focus-visible:ring-ring flex h-full min-w-0 flex-col overflow-hidden rounded-xl border text-left transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
                      isSelected
                        ? 'border-primary ring-primary ring-1'
                        : 'border-border hover:border-primary/50'
                    )}
                    onClick={() => setSelectedMembershipId(isSelected ? null : membership.id)}
                  >
                    <div className="flex h-full w-full flex-col gap-4 p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 space-y-2">
                          <p className="text-muted-foreground text-xs">
                            {sportLabels[membership.sport ?? 'PADEL']} · {membership.sessions} sesi
                            · {membership.duration} hari
                          </p>
                          <h3 className="min-h-12 text-base leading-6 font-semibold break-words">
                            {membership.name}
                          </h3>
                        </div>
                        <span
                          className={cn(
                            'mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border',
                            isSelected ? 'border-primary bg-primary text-white' : 'border-input'
                          )}
                        >
                          {isSelected && <IconCheck className="size-3.5" />}
                        </span>
                      </div>
                      <div className="space-y-1">
                        <p className="text-2xl font-semibold tracking-tight tabular-nums">
                          {formatCurrency(membership.price)}
                        </p>
                        <p className="text-muted-foreground text-xs">
                          {membershipTypeLabels[membership.type]} ·{' '}
                          {membershipTypeDescriptions[membership.type]}
                        </p>
                      </div>
                      <div className="min-h-16 space-y-2 border-t pt-3 text-xs">
                        {benefits.slice(0, 2).map((benefit, index) => (
                          <div key={`${membership.id}-${index}`} className="flex items-start gap-2">
                            <IconCheck className="text-primary mt-0.5 size-3.5 shrink-0" />
                            <span className="text-muted-foreground line-clamp-1">{benefit}</span>
                          </div>
                        ))}
                        {benefits.length > 2 && (
                          <p className="text-muted-foreground pl-5.5">
                            +{benefits.length - 2} benefit lainnya
                          </p>
                        )}
                      </div>
                      <div
                        className={cn(
                          'mt-auto rounded-lg px-3 py-2 text-center text-sm font-medium',
                          isSelected
                            ? 'bg-primary/10 text-primary'
                            : 'bg-muted text-foreground group-hover:bg-primary/5'
                        )}
                      >
                        {isSelected ? 'Paket dipilih' : 'Pilih paket'}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </section>

        <aside className="min-w-0 xl:sticky xl:top-4">
          <Card className="min-w-0 gap-5 rounded-xl py-5 shadow-none">
            <CardHeader className="space-y-2 px-5">
              <CardTitle className="text-base">Ringkasan pemesanan</CardTitle>
              <p className="text-muted-foreground text-xs">Lengkapi data untuk membuat booking.</p>
            </CardHeader>
            <CardContent className="space-y-5 px-5">
              <div className="space-y-3">
                <p className="text-muted-foreground text-sm font-medium">Pelanggan</p>
                <div className="flex flex-wrap gap-2 sm:flex-nowrap">
                  <Popover open={isCustomerOpen} onOpenChange={setIsCustomerOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={isCustomerOpen}
                        className="h-10 w-full min-w-0 justify-start gap-2 rounded-lg shadow-none sm:w-auto sm:flex-1"
                      >
                        <IconUser className="text-muted-foreground size-4 shrink-0" />
                        <span className="truncate">
                          {selectedCustomer ? selectedCustomer.name : 'Cari pelanggan...'}
                        </span>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-(--radix-popover-trigger-width) p-0">
                      <Command shouldFilter={false}>
                        <CommandInput
                          placeholder="Cari pelanggan (min. 2 karakter)"
                          value={customerSearch}
                          onValueChange={setCustomerSearch}
                        />
                        <CommandList>
                          {isSearching ? (
                            <div className="text-muted-foreground py-6 text-center text-sm">
                              Mencari pelanggan...
                            </div>
                          ) : !debouncedSearch || debouncedSearch.length < 2 ? (
                            <div className="text-muted-foreground py-6 text-center text-sm">
                              Ketik minimal 2 karakter untuk mencari
                            </div>
                          ) : !searchResults || searchResults.length === 0 ? (
                            <CommandEmpty>Tidak ada pelanggan ditemukan.</CommandEmpty>
                          ) : (
                            <CommandGroup>
                              {searchResults.map((customer) => (
                                <CommandItem
                                  key={customer.id}
                                  value={`${customer.name} ${customer.phone || ''}`}
                                  onSelect={() => {
                                    setCustomerId(customer.id);
                                    setSelectedCustomer(customer);
                                    setWalkInName('');
                                    setWalkInPhone('');
                                    setIsCustomerOpen(false);
                                    setCustomerSearch('');
                                    setDebouncedSearch('');
                                  }}
                                >
                                  <div className="flex flex-col">
                                    <span className="font-medium">{customer.name}</span>
                                    {customer.phone && (
                                      <span className="text-muted-foreground text-xs">
                                        {customer.phone}
                                      </span>
                                    )}
                                  </div>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          )}
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>

                  <Dialog open={isWalkInOpen} onOpenChange={setIsWalkInOpen}>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-10 w-full gap-2 rounded-lg shadow-none sm:w-auto"
                      >
                        <IconUserPlus className="h-4 w-4" />
                        Walk-in
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Walk-in Customer</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="walkInName">Nama</Label>
                          <Input
                            id="walkInName"
                            placeholder="Nama pelanggan"
                            value={walkInName}
                            onChange={(event) => setWalkInName(event.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="walkInPhone">Nomor Telepon</Label>
                          <Input
                            id="walkInPhone"
                            placeholder="08xxxxxxxxxx"
                            value={walkInPhone}
                            onChange={(event) => setWalkInPhone(event.target.value)}
                          />
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" onClick={() => setIsWalkInOpen(false)}>
                            Batal
                          </Button>
                          <Button
                            onClick={() => {
                              if (!walkInName.trim() || walkInPhone.trim().length < 5) {
                                toast.error('Nama dan nomor telepon wajib diisi.');
                                return;
                              }
                              setCustomerId('');
                              setSelectedCustomer(null);
                              setIsWalkInOpen(false);
                            }}
                          >
                            Simpan
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                {selectedCustomer && (
                  <div className="bg-muted/60 mt-2 rounded-md border px-3 py-2 text-xs">
                    <div className="flex items-center gap-2 font-medium">
                      <IconUser className="h-3.5 w-3.5" />
                      {selectedCustomer.name}
                    </div>
                    {selectedCustomer.phone && (
                      <p className="text-muted-foreground mt-1">{selectedCustomer.phone}</p>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-2 h-6 px-2 text-xs"
                      onClick={() => {
                        setCustomerId('');
                        setSelectedCustomer(null);
                      }}
                    >
                      Hapus pilihan
                    </Button>
                  </div>
                )}

                {!selectedCustomer && (walkInName || walkInPhone) && (
                  <div className="bg-muted/60 mt-2 rounded-md border px-3 py-2 text-xs">
                    <div className="flex items-center gap-2 font-medium">
                      <IconUser className="h-3.5 w-3.5" />
                      Walk-in Customer
                    </div>
                    <p className="mt-1 font-medium">{walkInName || '-'}</p>
                    {walkInPhone && <p className="text-muted-foreground">{walkInPhone}</p>}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-2 h-6 px-2 text-xs"
                      onClick={() => {
                        setWalkInName('');
                        setWalkInPhone('');
                      }}
                    >
                      Hapus walk-in
                    </Button>
                  </div>
                )}
              </div>

              <Separator />

              <div className="space-y-2">
                <Label className="text-sm font-medium">Tanggal Mulai</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'h-10 w-full justify-start gap-2 rounded-lg text-left font-normal shadow-none',
                        !startDate && 'text-muted-foreground'
                      )}
                    >
                      <IconCalendar className="h-4 w-4" />
                      {startDate ? dayjs(startDate).format('dddd, DD MMM YYYY') : 'Pilih tanggal'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto rounded-xl p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={setStartDate}
                      disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-start justify-between gap-4 text-sm">
                  <span className="text-muted-foreground shrink-0">Paket</span>
                  <span className="text-right font-medium break-words">
                    {selectedMembership ? selectedMembership.name : 'Belum dipilih'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Total</span>
                  <span className="text-xl font-semibold tabular-nums">
                    {selectedMembership ? formatCurrency(selectedMembership.price) : '-'}
                  </span>
                </div>
                {selectedMembership && (
                  <details className="bg-muted/50 rounded-lg px-3 py-2.5 text-xs">
                    <summary className="cursor-pointer font-medium">
                      Detail paket dan benefit
                    </summary>
                    {selectedMembership.description && (
                      <p className="text-muted-foreground mt-3 leading-relaxed">
                        {selectedMembership.description}
                      </p>
                    )}
                    <ul className="mt-3 space-y-2">
                      {(selectedMembership.benefits ?? []).map((benefit) => (
                        <li key={benefit.id} className="flex items-start gap-2">
                          <IconCheck className="text-primary mt-0.5 size-3 shrink-0" />
                          <span className="text-muted-foreground">{benefit.benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </details>
                )}
              </div>

              <Button
                className="h-10 w-full rounded-lg"
                onClick={handleSubmit}
                disabled={!canSubmit || isSubmitting}
              >
                {isSubmitting ? 'Memproses...' : 'Buat Booking Value Pack'}
              </Button>
            </CardContent>
          </Card>
        </aside>
      </div>
    </main>
  );
};

export default BookingMembershipPage;
