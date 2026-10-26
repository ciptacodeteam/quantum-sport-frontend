'use client';

import { useLogoutConfirmation } from '@/hooks/useLogoutConfirmation';

import MainBottomNavigation from '@/components/footers/MainBottomNavigation';
import MainHeader from '@/components/headers/MainHeader';
import PasswordChangeModal from '@/components/profile/PasswordChangeModal';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { formatPhone } from '@/lib/utils';
import { logoutMutationOptions } from '@/mutations/auth';
import { myMembershipsQueryOptions } from '@/queries/membership';
import { profileQueryOptions } from '@/queries/profile';
import useAuthStore from '@/stores/useAuthStore';
import type { UserProfile } from '@/types/model';
import { IconLogout, IconPhone, IconFileText } from '@tabler/icons-react';
import { sendVerificationOtpMutationOptions } from '@/mutations/verification';
import { VerifyContactOtpDialog } from '@/components/profile/VerifyContactOtpDialog';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs from '@/lib/dayjs';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowUpRight, BadgeCheck, LockKeyhole } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

export default function ProfilePage() {
  const router = useRouter();
  const confirmLogout = useLogoutConfirmation();
  const hasLoggedOut = useRef(false);
  const queryClient = useQueryClient();
  const { data: user, isPending, isError } = useQuery(profileQueryOptions);
  const isStaffAccount = !!user && 'role' in user;
  const {
    data: myMemberships,
    isPending: isMembershipsLoading,
    isError: isMembershipsError
  } = useQuery({
    ...myMembershipsQueryOptions,
    queryKey: ['memberships', 'my', user?.id ?? 'guest'],
    enabled: !isPending && !!user?.id && !isStaffAccount
  });
  const logout = useAuthStore((state) => state.logout);
  // Password modal (two-step)
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  // Generic verification dialog state
  const [verifyDialogOpen, setVerifyDialogOpen] = useState(false);
  const [verifyType, setVerifyType] = useState<'phone' | null>(null);
  const [verificationRequestId, setVerificationRequestId] = useState<string | null>(null);

  // Debug logging removed

  const { mutate: logoutMutation, isPending: isLoggingOut } = useMutation(
    logoutMutationOptions({
      onSuccess: async () => {
        hasLoggedOut.current = true;
        await queryClient.cancelQueries();
        queryClient.clear();
        logout();
        queryClient.setQueryData(profileQueryOptions.queryKey, { data: null });
        router.replace('/');
      }
    })
  );

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!hasLoggedOut.current && !isPending && (isError || !user?.id)) {
      router.push('/?requireLogin=true');
    }
  }, [isPending, isError, user, router]);

  const handleLogout = async () => {
    if (isLoggingOut) return;
    if (await confirmLogout()) {
      logoutMutation();
    }
  };

  const { mutate: sendVerificationOtp, isPending: isSendingVerification } = useMutation(
    sendVerificationOtpMutationOptions({
      onSuccess: (res) => {
        const requestId = res?.data?.requestId;
        if (requestId) {
          setVerificationRequestId(requestId);
          setVerifyDialogOpen(true);
        }
      }
    })
  );

  const handleStartVerification = (type: 'phone') => {
    if (!user) return;
    setVerifyType(type);
    if (type === 'phone' && user.phone && !(user as UserProfile).phoneVerified) {
      sendVerificationOtp({
        type: 'phone',
        phone: formatPhone(user.phone)
      });
    }
  };

  const handleResendVerificationOtp = () => {
    if (!user || !verifyType) return;
    if (verifyType === 'phone' && user.phone) {
      sendVerificationOtp({
        type: 'phone',
        phone: formatPhone(user.phone)
      });
    }
  };

  if (isPending) {
    return (
      <>
        <MainHeader backHref="/" title="Profile" withLogo={false} />
        <main
          className="profile-page mx-auto w-full max-w-7xl px-5 pt-24 pb-8 sm:px-8 xl:pt-32"
          aria-busy="true"
          aria-label="Memuat profil"
        >
          <div className="grid items-start gap-4 lg:grid-cols-[300px_minmax(0,1fr)]">
            <Skeleton className="h-64 rounded-none" />
            <Skeleton className="h-96 rounded-none" />
          </div>
        </main>
        <MainBottomNavigation />
      </>
    );
  }

  if (isError || !user) {
    return null;
  }

  return (
    <>
      <MainHeader title="Akun Saya" withLogo={false} withBorder />

      <main className="profile-page mx-auto w-full max-w-7xl px-5 pt-24 pb-8 text-[#171717] sm:px-8 lg:pb-16 xl:pt-32">
        <div className="grid items-start gap-4 lg:grid-cols-[300px_minmax(0,1fr)] lg:gap-6">
          <aside className="min-w-0 bg-[#111111] p-5 text-white sm:p-6 lg:sticky lg:top-28">
            <div className="flex items-center gap-4 lg:flex-col lg:items-start lg:gap-5">
              <div className="relative flex size-16 shrink-0 items-center justify-center overflow-hidden bg-[#ad422b] text-2xl font-medium text-white lg:size-20">
                {user.image ? (
                  <Image
                    src={user.image}
                    alt={user.name}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <span aria-hidden="true">
                    {user.name
                      .trim()
                      .split(/\s+/)
                      .slice(0, 2)
                      .map((part) => part.charAt(0))
                      .join('')
                      .toUpperCase()}
                  </span>
                )}
              </div>
              <div className="min-w-0">
                <h1 className="text-xl leading-tight font-medium tracking-tight break-words capitalize sm:text-2xl">
                  {user.name}
                </h1>
                <div className="mt-2 space-y-2" aria-label="Status membership">
                  {isStaffAccount ? (
                    <p className="text-xs leading-relaxed text-white/55">
                      Membership khusus akun pelanggan.
                    </p>
                  ) : isMembershipsLoading ? (
                    <p className="text-xs text-white/55" role="status">
                      Memuat status membership...
                    </p>
                  ) : isMembershipsError || !myMemberships ? (
                    <p className="text-xs leading-relaxed text-white/55">
                      Status membership belum dapat dimuat.
                    </p>
                  ) : myMemberships.active.length > 0 ? (
                    myMemberships.active.map((pack) => (
                      <div key={pack.id} className="space-y-1">
                        <p className="text-xs leading-relaxed font-medium text-[#efb7a6]">
                          Membership aktif · {pack.membership.name}
                        </p>
                        <p className="text-[11px] leading-relaxed text-white/60">
                          {pack.endDate && dayjs(pack.endDate).isValid()
                            ? `Aktif hingga ${dayjs(pack.endDate).tz('Asia/Jakarta').format('DD MMM YYYY')}`
                            : 'Tanggal berakhir belum tersedia'}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="space-y-1">
                      <p className="text-xs leading-relaxed text-white/80">
                        {myMemberships.suspended.length > 0
                          ? 'Membership ditangguhkan'
                          : myMemberships.expired.length > 0
                            ? 'Membership sudah berakhir'
                            : myMemberships.total > 0
                              ? 'Membership belum aktif'
                              : 'Belum memiliki membership'}
                      </p>
                    </div>
                  )}
                </div>
                {'banned' in user && user.banned && (
                  <p className="mt-2 text-xs text-[#efb7a6]">Akun diblokir</p>
                )}
              </div>
            </div>
          </aside>

          <div className="grid min-w-0 gap-4 sm:grid-cols-2">
            <section
              aria-labelledby="account-info-title"
              className="min-w-0 border border-black/15 bg-[#f8f8f6] p-5 sm:col-span-2 sm:p-6"
            >
              <h2 id="account-info-title" className="text-lg font-medium tracking-tight">
                Informasi akun
              </h2>
              <p className="mt-1 text-xs leading-relaxed text-black/45">
                Informasi kontak dan status verifikasi akun Anda.
              </p>
              <div className="mt-5 divide-y divide-black/10">
                <div className="flex items-start gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center border border-[#ad422b]/20 text-[#ad422b]">
                    <IconPhone className="size-5" strokeWidth={1.5} aria-hidden="true" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="mb-1 text-[10px] font-medium tracking-wider text-black/45 uppercase">
                      Nomor WhatsApp
                    </h3>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="min-w-0 text-sm leading-relaxed break-all text-[#171717]">
                        {user.phone || 'Belum diisi'}
                      </p>
                      {'phoneVerified' in user && user.phoneVerified && (
                        <span
                          className="inline-flex shrink-0 items-center gap-1 text-[10px] text-[#ad422b]"
                          aria-label="Nomor WhatsApp terverifikasi"
                        >
                          <BadgeCheck className="size-4" strokeWidth={1.5} aria-hidden="true" />
                          Terverifikasi
                        </span>
                      )}
                      {'phoneVerified' in user && !user.phoneVerified && user.phone && (
                        <button
                          type="button"
                          className="text-[10px] font-medium text-[#ad422b] underline-offset-4 hover:underline disabled:opacity-50"
                          disabled={isSendingVerification}
                          onClick={() => handleStartVerification('phone')}
                        >
                          {isSendingVerification ? 'Mengirim kode...' : 'Verifikasi WhatsApp'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              {'banned' in user && user.banned && 'banReason' in user && (
                <div className="mt-5 border border-[#ad422b]/25 bg-[#ad422b]/5 p-4">
                  <p className="text-xs font-medium text-[#ad422b]">Alasan pemblokiran</p>
                  <p className="mt-1 text-sm text-black/60">{user.banReason}</p>
                  {'banExpires' in user && user.banExpires && (
                    <p className="mt-2 text-xs text-black/45">
                      Berakhir: {dayjs(user.banExpires).format('DD MMMM YYYY HH:mm')}
                    </p>
                  )}
                </div>
              )}
            </section>

            {!isMembershipsLoading && myMemberships && myMemberships.active.length > 0 && (
              <section
                aria-labelledby="profile-memberships-title"
                className="min-w-0 border border-black/15 bg-[#f8f8f6] p-5 sm:col-span-2 sm:p-6"
              >
                <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                  <h2 id="profile-memberships-title" className="text-lg font-medium tracking-tight">
                    Value Pack aktif
                  </h2>
                  <Link
                    href="/my-packages"
                    className="inline-flex items-center gap-1 text-xs text-[#ad422b] hover:underline"
                  >
                    Lihat pemakaian <ArrowUpRight className="size-3.5" aria-hidden="true" />
                  </Link>
                </div>
                <div className="divide-y divide-black/10">
                  {myMemberships.active.map((userMembership) => (
                    <div key={userMembership.id} className="py-5 first:pt-0 last:pb-0">
                      <div className="mb-4 flex items-start justify-between gap-3">
                        <h3 className="min-w-0 text-base font-medium break-words">
                          {userMembership.membership.name}
                        </h3>
                        <span className="shrink-0 text-[10px] font-medium text-[#ad422b]">
                          Aktif
                        </span>
                      </div>
                      <dl className="grid grid-cols-2 gap-3 border-t border-black/10 pt-4">
                        <div>
                          <dt className="mb-1 text-[10px] tracking-wide text-black/45 uppercase">
                            Berlaku hingga
                          </dt>
                          <dd className="text-sm font-medium">
                            {dayjs(userMembership.endDate).format('DD MMM YYYY')}
                          </dd>
                          <dd className="mt-1 text-xs text-black/45">
                            {userMembership.remainingDuration} hari tersisa
                          </dd>
                        </div>
                        <div className="border-l border-black/10 pl-3">
                          <dt className="mb-1 text-[10px] tracking-wide text-black/45 uppercase">
                            Sisa waktu bermain
                          </dt>
                          <dd className="text-sm font-medium">
                            {userMembership.remainingSessions}{' '}
                            <span className="text-xs font-normal text-black/45">
                              / {userMembership.membership.sessions} jam
                            </span>
                          </dd>
                        </div>
                      </dl>
                      {userMembership.membership.benefits &&
                        userMembership.membership.benefits.length > 0 && (
                          <details className="mt-4 border-t border-black/10 pt-3">
                            <summary className="cursor-pointer text-xs text-[#ad422b]">
                              Detail benefit
                            </summary>
                            <ul className="mt-3 space-y-2">
                              {userMembership.membership.benefits.map((benefit) => (
                                <li
                                  key={benefit.id}
                                  className="text-xs leading-relaxed text-black/55"
                                >
                                  {benefit.benefit}
                                </li>
                              ))}
                            </ul>
                          </details>
                        )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            <section
              aria-labelledby="password-title"
              className="flex min-w-0 flex-col border border-black/15 bg-[#f8f8f6] p-5 sm:p-6"
            >
              <LockKeyhole
                className="mb-4 size-5 text-[#ad422b]"
                strokeWidth={1.5}
                aria-hidden="true"
              />
              <h2 id="password-title" className="text-lg font-medium tracking-tight">
                Kata sandi
              </h2>
              <p className="mt-2 mb-5 text-xs leading-relaxed text-black/50">
                Perbarui kata sandi untuk menjaga keamanan akun Anda.
              </p>
              <Button
                variant="outline"
                className="mt-auto h-10 w-fit rounded-full border-black/20 bg-transparent px-5 text-xs text-[#171717] shadow-none hover:bg-black/5"
                onClick={() => setPasswordModalOpen(true)}
              >
                Ganti kata sandi
              </Button>
            </section>
            <section
              aria-labelledby="terms-title"
              className="flex min-w-0 flex-col border border-black/15 bg-[#f8f8f6] p-5 sm:p-6"
            >
              <IconFileText
                className="mb-4 size-5 text-[#ad422b]"
                strokeWidth={1.5}
                aria-hidden="true"
              />
              <h2 id="terms-title" className="text-lg font-medium tracking-tight">
                Syarat & ketentuan
              </h2>
              <p className="mt-2 mb-5 text-xs leading-relaxed text-black/50">
                Informasi dan ketentuan penggunaan layanan Black Padel.
              </p>
              <Button
                variant="outline"
                className="mt-auto h-10 w-fit rounded-full border-black/20 bg-transparent px-5 text-xs text-[#171717] shadow-none hover:bg-black/5"
                onClick={() => router.push('/terms-and-conditions')}
              >
                Lihat ketentuan <ArrowUpRight className="size-3.5" aria-hidden="true" />
              </Button>
            </section>
            <div className="border-t border-black/15 pt-4 sm:col-span-2">
              <Button
                variant="outline"
                className="h-11 w-full rounded-full border-black/20 bg-transparent px-6 text-xs text-[#ad422b] shadow-none hover:border-[#ad422b]/40 hover:bg-[#ad422b]/5 sm:w-auto"
                onClick={handleLogout}
                disabled={isLoggingOut}
                loading={isLoggingOut}
              >
                <IconLogout className="size-4" strokeWidth={1.5} />
                Keluar dari akun
              </Button>
            </div>
          </div>
        </div>
      </main>

      <MainBottomNavigation />

      {/* Password Change Modal */}
      <PasswordChangeModal open={passwordModalOpen} onOpenChange={setPasswordModalOpen} />

      {/* Generic Verification OTP Dialog */}
      {verifyType && (
        <VerifyContactOtpDialog
          open={verifyDialogOpen}
          onOpenChange={setVerifyDialogOpen}
          type={verifyType}
          requestId={verificationRequestId}
          onResendOtp={handleResendVerificationOtp}
        />
      )}
    </>
  );
}
