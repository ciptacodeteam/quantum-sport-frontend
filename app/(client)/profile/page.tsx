'use client';

import MainBottomNavigation from '@/components/footers/MainBottomNavigation';
import MainHeader from '@/components/headers/MainHeader';
import EmailChangeModal from '@/components/profile/EmailChangeModal';
import PasswordChangeModal from '@/components/profile/PasswordChangeModal';
import PhoneChangeModal from '@/components/profile/PhoneChangeModal';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { getPlaceholderImageUrl, cn, formatPhone } from '@/lib/utils';
import { logoutMutationOptions } from '@/mutations/auth';
import { leaveClubMutationOptions } from '@/mutations/club';
import { myMembershipsQueryOptions } from '@/queries/membership';
import { profileQueryOptions } from '@/queries/profile';
import useAuthStore from '@/stores/useAuthStore';
import type { UserProfile } from '@/types/model';
import { IconCalendar, IconLogout, IconMail, IconPhone } from '@tabler/icons-react';
import { Badge } from '@/components/ui/badge';
import { sendVerificationOtpMutationOptions } from '@/mutations/verification';
import { VerifyContactOtpDialog } from '@/components/profile/VerifyContactOtpDialog';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function ProfilePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: user, isPending, isError } = useQuery(profileQueryOptions);
  const { data: myMemberships, isPending: isMembershipsLoading } =
    useQuery(myMembershipsQueryOptions);
  // const {
  //   data: memberClubs,
  //   isLoading: isLoadingMemberClubs,
  //   error: memberClubsError
  // } = useQuery(clubMembershipsQueryOptions());
  const logout = useAuthStore((state) => state.logout);
  const [clubToLeave, setClubToLeave] = useState<{ id: string; name: string } | null>(null);
  // Name (not edited via modal in this iteration)
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  // Email modal
  const [emailModalOpen, setEmailModalOpen] = useState(false);

  // Phone modal
  const [phoneModalOpen, setPhoneModalOpen] = useState(false);

  // Password modal (two-step)
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  // Generic verification dialog state
  const [verifyDialogOpen, setVerifyDialogOpen] = useState(false);
  const [verifyType, setVerifyType] = useState<'phone' | 'email' | null>(null);
  const [verificationRequestId, setVerificationRequestId] = useState<string | null>(null);

  // Debug logging removed

  const { mutate: logoutMutation, isPending: isLoggingOut } = useMutation(
    logoutMutationOptions({
      onSuccess: () => {
        queryClient.clear();
        logout();
        router.push('/');
      }
    })
  );

  const { mutate: leaveClub, isPending: isLeavingClub } = useMutation(
    leaveClubMutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['clubs', 'my'] });
        queryClient.invalidateQueries({ queryKey: ['clubs'] });
        setClubToLeave(null);
      }
    })
  );

  // Update local form state when user loaded
  useEffect(() => {
    if (user) {
      setEditEmail(user.email || '');
      setEditPhone(user.phone || '');
    }
  }, [user]);

  // Email/Phone updates are handled in modal components

  // Email OTP handled in EmailChangeModal

  // Phone OTP handled in PhoneChangeModal

  // Password change handled in PasswordChangeModal

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isPending && (isError || !user?.id)) {
      router.push('/?requireLogin=true');
    }
  }, [isPending, isError, user, router]);

  const handleLogout = () => {
    logoutMutation();
  };

  // const handleLeaveClubClick = (clubId: string, clubName: string) => {
  //   setClubToLeave({ id: clubId, name: clubName });
  // };

  const confirmLeaveClub = () => {
    if (clubToLeave) {
      leaveClub(clubToLeave.id);
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

  const handleStartVerification = (type: 'phone' | 'email') => {
    if (!user) return;
    setVerifyType(type);
    if (type === 'phone' && user.phone && !(user as UserProfile).phoneVerified) {
      sendVerificationOtp({
        type: 'phone',
        phone: formatPhone(user.phone)
      });
    } else if (type === 'email' && user.email && !(user as UserProfile).emailVerified) {
      sendVerificationOtp({ type: 'email', email: user.email });
    }
  };

  const handleResendVerificationOtp = () => {
    if (!user || !verifyType) return;
    if (verifyType === 'phone' && user.phone) {
      sendVerificationOtp({
        type: 'phone',
        phone: formatPhone(user.phone)
      });
    } else if (verifyType === 'email' && user.email) {
      sendVerificationOtp({ type: 'email', email: user.email });
    }
  };

  if (isPending) {
    return (
      <>
        <MainHeader backHref="/" title="Profile" withLogo={false} />
        <main className="mt-24 min-h-[calc(100dvh-180px)] w-full p-4 md:mt-14">
          <div className="mx-auto max-w-2xl space-y-6">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </main>
      </>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <>
      <MainHeader title="Akun Saya" withLogo={false} withBorder />

      <main className="mt-24 pb-24 lg:mt-28">
        <div className="mx-auto w-11/12 max-w-7xl space-y-4">
          {/* Profile Header Card */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center space-y-4">
                {/* Profile Image */}
                <div className="border-primary/10 relative h-24 w-24 overflow-hidden rounded-full border-4">
                  <Image
                    src={
                      user.image ||
                      getPlaceholderImageUrl({
                        width: 200,
                        height: 200,
                        text: user.name.charAt(0).toUpperCase()
                      })
                    }
                    alt={user.name}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>

                {/* Name */}
                <div className="text-center">
                  <h1 className="text-2xl font-bold capitalize">{user.name}</h1>
                  {'banned' in user && (user as any).banned && (
                    <p className="text-destructive mt-1 text-sm">Account Banned</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Profile Details Card */}
          <Card>
            <CardHeader>
              <CardTitle className="mb-1">Informasi Akun</CardTitle>
              <CardDescription>Detail akun dan status akun</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Email */}
              <div className="flex items-center gap-3">
                <IconMail className="bg-primary size-4 h-10 w-10 rounded-md p-2 text-white" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Email</p>
                  <button
                    type="button"
                    className="text-muted-foreground text-sm underline-offset-2 hover:underline"
                    onClick={() => {
                      setEditEmail(user.email || '');
                      setEmailModalOpen(true);
                    }}
                  >
                    {user.email || 'Not provided'}
                  </button>
                  {user.email && 'emailVerified' in user && (
                    <Badge
                      variant={(user as any).emailVerified ? 'lightSuccess' : 'lightDestructive'}
                      className={cn('ml-2 select-none', user.emailVerified ? '' : 'cursor-pointer')}
                      onClick={() => handleStartVerification('email')}
                      aria-disabled={isSendingVerification}
                    >
                      {(user as any).emailVerified ? 'Email Terverifikasi' : 'Verifikasi Email'}
                    </Badge>
                  )}
                </div>
              </div>

              <Separator />

              {/* Phone */}
              <div className="flex items-center gap-3">
                <IconPhone className="bg-primary size-4 h-10 w-10 rounded-md p-2 text-white" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Nomor WhatsApp</p>

                  <div className="flex">
                    <button
                      type="button"
                      className="text-muted-foreground me-2 text-sm underline-offset-2 hover:underline"
                      onClick={() => {
                        setEditPhone(user.phone || '');
                        setPhoneModalOpen(true);
                      }}
                    >
                      {user.phone || 'Not provided'}
                    </button>

                    {'phoneVerified' in user && (
                      <Badge
                        variant={
                          (user as UserProfile).phoneVerified ? 'lightSuccess' : 'lightDestructive'
                        }
                        className={cn('select-none', user.phoneVerified ? '' : 'cursor-pointer')}
                        onClick={() => handleStartVerification('phone')}
                        aria-disabled={isSendingVerification}
                      >
                        {(user as UserProfile).phoneVerified
                          ? 'Nomor Terverifikasi'
                          : 'Verifikasi Nomor'}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              <Separator />

              {/* Member Since */}
              <div className="flex items-center gap-3">
                <IconCalendar className="bg-primary size-4 h-10 w-10 rounded-md p-2 text-white" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Membership sejak</p>
                  <p className="text-muted-foreground text-sm">
                    {dayjs(user.createdAt).format('DD MMMM YYYY')}
                  </p>
                </div>
              </div>

              {'banned' in user && (user as any).banned && 'banReason' in user && (
                <>
                  <Separator />
                  <div className="bg-destructive/10 rounded-lg p-3">
                    <p className="text-destructive text-sm font-medium">Ban Reason</p>
                    <p className="text-destructive/80 text-sm">{(user as any).banReason}</p>
                    {'banExpires' in user && (user as any).banExpires && (
                      <p className="text-destructive/70 mt-1 text-xs">
                        Expires: {dayjs((user as any).banExpires).format('DD MMMM YYYY HH:mm')}
                      </p>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Active Membership Card */}
          {!isMembershipsLoading && myMemberships && myMemberships.active.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="mb-1">Membership Aktif</CardTitle>
                <CardDescription>Informasi membership yang sedang aktif</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {myMemberships.active.map((userMembership) => (
                  <div key={userMembership.id} className="rounded-lg border p-4">
                    <div className="mb-3 flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-bold">{userMembership.membership.name}</h3>
                        {userMembership.membership.description && (
                          <p className="text-muted-foreground text-sm">
                            {userMembership.membership.description}
                          </p>
                        )}
                      </div>
                      <span className="bg-primary/10 text-primary rounded-full px-2.5 py-0.5 text-xs font-medium">
                        Aktif
                      </span>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="bg-muted rounded-md p-3">
                        <p className="text-muted-foreground mb-1 text-xs">Berlaku Hingga</p>
                        <p className="font-semibold">
                          {dayjs(userMembership.endDate).format('DD MMMM YYYY')}
                        </p>
                        <p className="text-muted-foreground text-xs">
                          {userMembership.remainingDuration} hari tersisa
                        </p>
                      </div>

                      <div className="bg-muted rounded-md p-3">
                        <p className="text-muted-foreground mb-1 text-xs">Sisa Jam</p>
                        <p className="font-semibold">
                          {userMembership.remainingSessions} dari{' '}
                          {userMembership.membership.sessions} jam
                        </p>
                        <p className="text-muted-foreground text-xs">
                          {Math.round(
                            (userMembership.remainingSessions /
                              userMembership.membership.sessions) *
                              100
                          )}
                          % tersisa
                        </p>
                      </div>
                    </div>

                    {userMembership.membership.benefits &&
                      userMembership.membership.benefits.length > 0 && (
                        <div className="mt-3">
                          <p className="mb-2 text-sm font-medium">Benefit:</p>
                          <ul className="space-y-1">
                            {userMembership.membership.benefits.map((benefit) => (
                              <li key={benefit.id} className="flex items-start gap-2 text-sm">
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="text-primary mt-0.5 h-4 w-4 shrink-0"
                                  viewBox="0 0 20 20"
                                  fill="currentColor"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                                <span className="text-muted-foreground">{benefit.benefit}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Change Password (trigger) */}
          <Card>
            <CardHeader>
              <CardTitle className="mb-1">Kata Sandi</CardTitle>
              <CardDescription>Mengelola Kata Sandi</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" onClick={() => setPasswordModalOpen(true)}>
                Ganti Kata Sandi
              </Button>
            </CardContent>
          </Card>

          {/* Logout Button */}
          <footer className="mb-6">
            <Button
              variant="destructive"
              className="w-full"
              size="lg"
              onClick={handleLogout}
              disabled={isLoggingOut}
              loading={isLoggingOut}
            >
              <IconLogout className="size-5" />
              Keluar
            </Button>
          </footer>
        </div>
      </main>

      {/* Leave Club Confirmation Dialog */}
      <Dialog open={!!clubToLeave} onOpenChange={(open) => !open && setClubToLeave(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Leave Club</DialogTitle>
            <DialogDescription>
              Are you sure you want to leave <strong>{clubToLeave?.name}</strong>? You will need to
              request to join again if it&#39;s a private club.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setClubToLeave(null)} disabled={isLeavingClub}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmLeaveClub}
              disabled={isLeavingClub}
              loading={isLeavingClub}
            >
              Leave Club
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <MainBottomNavigation />

      {/* Email Change Modal */}
      <EmailChangeModal
        open={emailModalOpen}
        email={editEmail}
        onOpenChange={setEmailModalOpen}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: profileQueryOptions.queryKey })}
      />

      {/* Phone Change Modal */}
      <PhoneChangeModal
        open={phoneModalOpen}
        phone={editPhone}
        onOpenChange={setPhoneModalOpen}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: profileQueryOptions.queryKey })}
      />

      {/* Password Change Modal */}
      <PasswordChangeModal
        open={passwordModalOpen}
        userEmail={user.email}
        onOpenChange={setPasswordModalOpen}
      />

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
