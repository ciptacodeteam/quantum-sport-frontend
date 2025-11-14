'use client';

import MainBottomNavigation from '@/components/footers/MainBottomNavigation';
import MainHeader from '@/components/headers/MainHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { getPlaceholderImageUrl } from '@/lib/utils';
import { logoutMutationOptions } from '@/mutations/auth';
import { profileQueryOptions } from '@/queries/profile';
import { userClubsQueryOptions, clubMembershipsQueryOptions } from '@/queries/club';
import { leaveClubMutationOptions } from '@/mutations/club';
import useAuthStore from '@/stores/useAuthStore';
import { IconCalendar, IconLogout, IconMail, IconPhone, IconUsers, IconDoorExit } from '@tabler/icons-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export default function ProfilePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: user, isPending, isError } = useQuery(profileQueryOptions);
  const { data: memberClubs, isLoading: isLoadingMemberClubs, error: memberClubsError } = useQuery(clubMembershipsQueryOptions());
  const logout = useAuthStore((state) => state.logout);
  const [clubToLeave, setClubToLeave] = useState<{ id: string; name: string } | null>(null);

  // Debug: Log clubs data
  useEffect(() => {
    console.log('🔍 Profile Debug - isLoadingMemberClubs:', isLoadingMemberClubs);
    console.log('🔍 Profile Debug - memberClubsError:', memberClubsError);
    console.log('🔍 Profile Debug - memberClubs raw:', memberClubs);
    console.log('🔍 Profile Debug - memberClubs is array?', Array.isArray(memberClubs));
    
    if (memberClubs) {
      console.log('👥 Clubs I\'m Member Of:', memberClubs);
      console.log('📊 Total member clubs:', Array.isArray(memberClubs) ? memberClubs.length : 'NOT AN ARRAY');
      if (Array.isArray(memberClubs)) {
        console.log('🔓 Public clubs:', memberClubs.filter((c: any) => c.visibility === 'PUBLIC').length);
        console.log('🔒 Private clubs:', memberClubs.filter((c: any) => c.visibility === 'PRIVATE').length);
      }
    }
    if (memberClubsError) {
      console.error('❌ Member Clubs Error:', memberClubsError);
    }
  }, [memberClubs, memberClubsError, isLoadingMemberClubs]);

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

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isPending && (isError || !user?.id)) {
      router.push('/?requireLogin=true');
    }
  }, [isPending, isError, user, router]);

  const handleLogout = () => {
    logoutMutation();
  };

  const handleLeaveClubClick = (clubId: string, clubName: string) => {
    setClubToLeave({ id: clubId, name: clubName });
  };

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
      <MainHeader backHref="/" title="Profile" withLogo={false} />

      <main className="mt-24 min-h-[calc(100dvh-180px)] w-full p-4 pb-24 md:mt-14 md:pb-4">
        <div className="mx-auto max-w-2xl space-y-6">
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
                  <h1 className="text-2xl font-bold">{user.name}</h1>
                  {user.banned && <p className="text-destructive mt-1 text-sm">Account Banned</p>}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Profile Details Card */}
          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
              <CardDescription>Your personal details and account status</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Email */}
              <div className="flex items-start gap-3">
                <IconMail className="text-muted-foreground mt-1 size-5" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Email</p>
                  <p className="text-muted-foreground text-sm">{user.email || 'Not provided'}</p>
                  {user.email && (
                    <p className="text-muted-foreground text-xs">
                      {user.emailVerified ? '✓ Verified' : '✗ Not verified'}
                    </p>
                  )}
                </div>
              </div>

              <Separator />

              {/* Phone */}
              <div className="flex items-start gap-3">
                <IconPhone className="text-muted-foreground mt-1 size-5" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Phone Number</p>
                  <p className="text-muted-foreground text-sm">{user.phone}</p>
                  <p className="text-muted-foreground text-xs">
                    {user.phoneVerified ? '✓ Verified' : '✗ Not verified'}
                  </p>
                </div>
              </div>

              <Separator />

              {/* Member Since */}
              <div className="flex items-start gap-3">
                <IconCalendar className="text-muted-foreground mt-1 size-5" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Member Since</p>
                  <p className="text-muted-foreground text-sm">
                    {dayjs(user.createdAt).format('DD MMMM YYYY')}
                  </p>
                </div>
              </div>

              {user.banned && user.banReason && (
                <>
                  <Separator />
                  <div className="bg-destructive/10 rounded-lg p-3">
                    <p className="text-destructive text-sm font-medium">Ban Reason</p>
                    <p className="text-destructive/80 text-sm">{user.banReason}</p>
                    {user.banExpires && (
                      <p className="text-destructive/70 mt-1 text-xs">
                        Expires: {dayjs(user.banExpires).format('DD MMMM YYYY HH:mm')}
                      </p>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Clubs I'm Member Of Card */}
          <Card>
            <CardHeader>
              <CardTitle>My Memberships</CardTitle>
              <CardDescription>Clubs you are a member of</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingMemberClubs ? (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  Loading clubs...
                </div>
              ) : memberClubsError ? (
                <div className="text-center py-8">
                  <p className="text-sm text-destructive mb-2">Failed to load clubs</p>
                  <p className="text-xs text-muted-foreground">{(memberClubsError as any)?.message || 'Unknown error'}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onClick={() => queryClient.invalidateQueries({ queryKey: ['clubs', 'membership'] })}
                  >
                    Retry
                  </Button>
                </div>
              ) : !memberClubs || memberClubs.length === 0 ? (
                <div className="text-center py-8">
                  <IconUsers className="size-12 mx-auto mb-2 text-muted-foreground opacity-50" />
                  <p className="text-sm text-muted-foreground">You haven't joined any clubs yet</p>
                  <Button
                    variant="link"
                    className="mt-2"
                    onClick={() => router.push('/clubs')}
                  >
                    Browse Clubs
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {Array.isArray(memberClubs) && memberClubs.map((club) => (
                    <div
                      key={club.id}
                      className="flex items-start gap-3 p-4 rounded-lg border hover:bg-accent transition-colors"
                    >
                      <Avatar className="size-14 rounded-lg cursor-pointer" onClick={() => router.push(`/clubs/${club.id}`)}>
                        <AvatarImage src={club.logo || undefined} alt={club.name} />
                        <AvatarFallback className="rounded-lg bg-primary/10 text-primary font-semibold">
                          {club.name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0 cursor-pointer" onClick={() => router.push(`/clubs/${club.id}`)}>
                        <p className="font-semibold text-base mb-2">{club.name}</p>
                        <div className="space-y-1.5 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Badge variant={club.visibility === 'PUBLIC' ? 'default' : 'secondary'} className="text-xs">
                              {club.visibility === 'PUBLIC' ? 'Public' : 'Private'}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-1">
                            <IconUsers className="size-4" />
                            <span>{club._count.clubMember} {club._count.clubMember === 1 ? 'member' : 'members'}</span>
                          </div>
                          {club.leader && (
                            <div className="flex items-center gap-1">
                              <span className="font-medium">Leader:</span>
                              <span>{club.leader.name}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Logout Button */}
          <Card>
            <CardContent className="pt-6">
              <Button
                variant="destructive"
                className="w-full"
                size="lg"
                onClick={handleLogout}
                disabled={isLoggingOut}
                loading={isLoggingOut}
              >
                <IconLogout className="mr-2 size-5" />
                Logout
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Leave Club Confirmation Dialog */}
      <Dialog open={!!clubToLeave} onOpenChange={(open) => !open && setClubToLeave(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Leave Club</DialogTitle>
            <DialogDescription>
              Are you sure you want to leave <strong>{clubToLeave?.name}</strong>? 
              You will need to request to join again if it's a private club.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setClubToLeave(null)}
              disabled={isLeavingClub}
            >
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
    </>
  );
}
