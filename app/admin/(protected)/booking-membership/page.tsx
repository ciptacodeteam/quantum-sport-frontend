'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from '@/components/ui/command';
import {
  IconCalendar,
  IconCheck,
  IconCrown,
  IconSparkles,
  IconUser,
  IconUserPlus
} from '@tabler/icons-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { adminMembershipsQueryOptions } from '@/queries/admin/membership';
import type { AdminMembershipCheckoutPayload } from '@/api/admin/membership';
import { adminCustomerSearchQueryOptions, type CustomerSearchResult } from '@/queries/admin/customer';
import { adminMembershipCheckoutMutationOptions } from '@/mutations/admin/membership';
import type { Membership } from '@/types/model';

const formatCurrency = (value?: number | null) => {
  if (!value && value !== 0) return '-';
  return `Rp ${new Intl.NumberFormat('id-ID').format(value)}`;
};

const BookingMembershipPage = () => {
  const router = useRouter();

  const { data: membershipsData, isPending: isMembershipsLoading } = useQuery(
    adminMembershipsQueryOptions
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
    <main className="space-y-6">
      <header className="space-y-1">
        <p className="text-sm font-semibold text-primary/70">Membership</p>
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h1 className="text-2xl font-semibold leading-tight">Booking Membership</h1>
          <Badge variant="outline" className="rounded-full px-3 py-1 text-xs font-semibold tracking-wide">
            Admin Tools
          </Badge>
        </div>
        <p className="text-muted-foreground text-sm">
          Pilih paket, tetapkan pelanggan, lalu proses pembayaran membership secara instan.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <section className="min-w-0 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-card/60 px-4 py-3 shadow-sm">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Katalog paket aktif</p>
              <p className="text-lg font-semibold">
                {isMembershipsLoading ? 'Memuat data...' : `${memberships.length} opsi membership`}
              </p>
            </div>
            <Badge variant="secondary">
              {isMembershipsLoading ? 'Memuat...' : `${memberships.length} paket`}
            </Badge>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {isMembershipsLoading ? (
              <div className="rounded-2xl border bg-white p-8 text-center text-sm text-muted-foreground shadow-sm">
                Memuat paket membership...
              </div>
            ) : memberships.length === 0 ? (
              <div className="rounded-2xl border bg-white p-8 text-center text-sm text-muted-foreground shadow-sm">
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
                    className={cn(
                      'group h-full min-w-0 rounded-2xl border bg-card/80 text-left transition-all hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2',
                      isSelected ? 'border-primary shadow-lg ring-1 ring-primary/20' : 'border-border'
                    )}
                    onClick={() => setSelectedMembershipId(isSelected ? null : membership.id)}
                  >
                    <div className="flex h-full flex-col gap-4 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 space-y-1">
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-primary">
                            {membership.sessions} sesi
                          </p>
                          <div className="flex items-center gap-2 text-lg font-semibold leading-tight">
                            <IconCrown className="text-yellow-500 h-4 w-4" />
                            <span className="truncate">{membership.name}</span>
                          </div>
                          <p className="text-muted-foreground text-sm line-clamp-2">
                            {membership.description || 'Membership unggulan Quantum Sport'}
                          </p>
                        </div>
                        {isSelected && (
                          <Badge variant="default" className="shrink-0">
                            Dipilih
                          </Badge>
                        )}
                      </div>

                      <div>
                        <p className="text-2xl font-bold text-primary">{formatCurrency(membership.price)}</p>
                        <p className="text-muted-foreground text-xs">Durasi {membership.duration} hari</p>
                      </div>

                      {benefits.length > 0 && (
                        <div className="space-y-1 rounded-xl bg-muted/60 p-3 text-xs">
                          {(isSelected ? benefits : benefits.slice(0, 3)).map((benefit) => (
                            <div key={benefit} className="flex items-center gap-2">
                              <IconCheck className="text-primary h-3.5 w-3.5 shrink-0" />
                              <span className="text-muted-foreground">{benefit}</span>
                            </div>
                          ))}
                          {!isSelected && benefits.length > 3 && (
                            <p className="text-muted-foreground mt-1">+{benefits.length - 3} benefit lainnya</p>
                          )}
                        </div>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </section>

        <aside className="min-w-0 space-y-4">
          <Card className="min-w-0 rounded-2xl border bg-card/80 shadow-sm lg:sticky lg:top-4">
            <CardHeader className="space-y-1 pb-4">
              <div className="flex items-center gap-2 text-sm font-medium text-primary/70">
                <IconSparkles className="h-4 w-4" />
                Detail Pemesanan
              </div>
              <CardTitle className="text-xl font-semibold">
                {selectedMembership ? selectedMembership.name : 'Belum ada paket dipilih'}
              </CardTitle>
              <p className="text-muted-foreground text-sm">
                Pilih pelanggan dan tentukan tanggal mulai membership.
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <p className="text-sm font-medium text-muted-foreground">Pelanggan</p>
                <div className="flex flex-wrap gap-2 sm:flex-nowrap">
                  <Popover open={isCustomerOpen} onOpenChange={setIsCustomerOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={isCustomerOpen}
                        className="w-full justify-between sm:w-auto sm:flex-1"
                      >
                        {selectedCustomer
                          ? `${selectedCustomer.name}${
                              selectedCustomer.phone ? ` (${selectedCustomer.phone})` : ''
                            }`
                          : 'Cari pelanggan...'}
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
                            <div className="py-6 text-center text-sm text-muted-foreground">
                              Mencari pelanggan...
                            </div>
                          ) : !debouncedSearch || debouncedSearch.length < 2 ? (
                            <div className="py-6 text-center text-sm text-muted-foreground">
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
                                      <span className="text-muted-foreground text-xs">{customer.phone}</span>
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
                        className="gap-2 w-full sm:w-auto"
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
                        'w-full justify-start gap-2 text-left font-normal',
                        !startDate && 'text-muted-foreground'
                      )}
                    >
                      <IconCalendar className="h-4 w-4" />
                      {startDate ? dayjs(startDate).format('dddd, DD MMM YYYY') : 'Pilih tanggal'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
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

              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span>Membership</span>
                  <span className="font-medium">
                    {selectedMembership ? selectedMembership.name : '-'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Harga</span>
                  <span className="font-semibold">
                    {selectedMembership ? formatCurrency(selectedMembership.price) : '-'}
                  </span>
                </div>
                {selectedMembership && (
                  <div className="rounded-md border bg-muted/50 p-3 text-xs">
                    <div className="flex items-center gap-2 font-medium">
                      <IconSparkles className="text-primary h-3.5 w-3.5" />
                      Benefit singkat
                    </div>
                    <ul className="mt-2 space-y-1">
                      {(selectedMembership.benefits ?? [])
                        .slice(0, 3)
                        .map((benefit) => (
                          <li key={benefit.id} className="flex items-center gap-2">
                            <IconCheck className="text-primary h-3 w-3" />
                            <span>{benefit.benefit}</span>
                          </li>
                        ))}
                    </ul>
                  </div>
                )}
              </div>

              <Button
                className="w-full"
                onClick={handleSubmit}
                disabled={!canSubmit || isSubmitting}
              >
                {isSubmitting ? 'Memproses...' : 'Buat Booking Membership'}
              </Button>
            </CardContent>
          </Card>
        </aside>
      </div>
    </main>
  );
};

export default BookingMembershipPage;

