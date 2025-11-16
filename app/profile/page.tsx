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
import { getPlaceholderImageUrl } from '@/lib/utils';
import { logoutMutationOptions } from '@/mutations/auth';
import { leaveClubMutationOptions } from '@/mutations/club';
import { profileQueryOptions } from '@/queries/profile';
import useAuthStore from '@/stores/useAuthStore';
import { IconCalendar, IconLogout, IconMail, IconPhone } from '@tabler/icons-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function ProfilePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: user, isPending, isError } = useQuery(profileQueryOptions);
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
      <MainHeader title="Akun Saya" withLogo={false} backHref="/" withBorder/>

      <main className="mt-24 pb-24">
        <div className="mx-auto w-11/12 space-y-4">
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
                    <p className="text-muted-foreground text-xs">
                      {(user as any).emailVerified ? '✓ Verified' : '✗ Not verified'}
                    </p>
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
                      <p
                        className={`text-xs ${
                          (user as any).phoneVerified
                            ? 'w-fit rounded-full bg-green-600 px-2 py-1 text-white'
                            : 'w-fit rounded-full bg-red-600 px-2 py-1 text-white'
                        }`}
                      >
                        {(user as any).phoneVerified ? 'Verified' : 'Not verified'}
                      </p>
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
    </>
  );
}
