'use client';

import MainHeader from '@/components/headers/MainHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { clubQueryOptions, clubMembershipsQueryOptions } from '@/queries/club';
import { profileQueryOptions } from '@/queries/profile';
import {
  requestJoinClubMutationOptions,
  leaveClubMutationOptions,
  deleteClubMutationOptions
} from '@/mutations/club';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  IconUsers,
  IconLock,
  IconWorld,
  IconCrown,
  IconLogout,
  IconTrash
} from '@tabler/icons-react';
import { useParams, useRouter } from 'next/navigation';
import useAuthStore from '@/stores/useAuthStore';
import useAuthModalStore from '@/stores/useAuthModalStore';
import { useEffect, useState, useMemo } from 'react';
import ClubJoinRequests from '@/components/clubs/ClubJoinRequests';

const ClubDetailPage = () => {
  const params = useParams();
  const clubId = params.id as string;
  const queryClient = useQueryClient();
  const router = useRouter();
  const { isAuth, logout } = useAuthStore();
  const { open: openAuthModal } = useAuthModalStore();
  const [isHydrated, setIsHydrated] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Wait for Zustand to hydrate from localStorage
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Show auth modal for unauthenticated users after hydration
  useEffect(() => {
    if (isHydrated && !isAuth) {
      openAuthModal();
    }
  }, [isHydrated, isAuth, openAuthModal]);

  // Check if token exists in localStorage - if not, force logout
  useEffect(() => {
    if (isHydrated && isAuth) {
      const token = localStorage.getItem('token');
      if (!token) {
        // Token was cleared manually, force logout
        logout();
        queryClient.clear();
      }
    }
  }, [isAuth, logout, queryClient, isHydrated]);

  // Fetch user profile from backend to validate real user data
  const {
    data: user,
    isLoading: isUserLoading,
    isError: isUserError
  } = useQuery({
    ...profileQueryOptions,
    enabled: isAuth, // Only fetch if authenticated
    staleTime: 0, // Always check if user data is fresh
    gcTime: 0 // Don't keep old data in cache after logout
  });

  // Check if user is actually authenticated with valid backend data
  const isAuthenticated = isAuth && !!user?.id;

  // Debug logging
  useEffect(() => {
    console.log('🔐 Auth Debug:', {
      isAuth,
      hasUser: !!user,
      userId: user?.id,
      isUserLoading,
      isUserError,
      isAuthenticated,
      token: localStorage.getItem('token')?.substring(0, 20) + '...'
    });
  }, [isAuth, user, isUserLoading, isUserError, isAuthenticated]);

  const { data: club, isLoading, isError } = useQuery(clubQueryOptions(clubId));

  // Fetch user's club memberships to check if they're a member
  const { data: memberClubs } = useQuery({
    ...clubMembershipsQueryOptions(),
    enabled: isAuthenticated // Only fetch if authenticated
  });

  // Check if user is a member of this club by checking the memberships list
  const isMember = useMemo(() => {
    if (!isAuthenticated || !memberClubs || !Array.isArray(memberClubs)) return false;
    return memberClubs.some((memberClub: any) => memberClub.id === clubId);
  }, [isAuthenticated, memberClubs, clubId]);

  // Debug logging for membership status
  useEffect(() => {
    console.log('👥 Membership Debug:', {
      clubId,
      isMember,
      memberClubsCount: memberClubs?.length,
      memberClubIds: memberClubs?.map((c: any) => c.id)
    });
  }, [clubId, isMember, memberClubs]);

  const { mutate: requestJoinClub, isPending: isRequesting } = useMutation(
    requestJoinClubMutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['clubs', clubId] });
        queryClient.invalidateQueries({ queryKey: ['clubs', 'membership'] });
        router.push('/profile');
      }
    })
  );

  const { mutate: leaveClub, isPending: isLeaving } = useMutation(
    leaveClubMutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['clubs', clubId] });
        queryClient.invalidateQueries({ queryKey: ['clubs', 'membership'] });
        router.push('/profile');
      }
    })
  );

  const { mutate: deleteClub, isPending: isDeleting } = useMutation(
    deleteClubMutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['clubs'] });
        router.push('/clubs');
      }
    })
  );

  const handleDeleteClub = () => {
    setShowDeleteDialog(false);
    deleteClub(clubId);
  };

  // Check if current user is the club leader
  const isLeader = isAuthenticated && user?.id === club?.leaderId;

  if (isLoading) {
    return (
      <>
        <MainHeader backHref="/clubs" title="Club Details" withLogo={false} />
        <main className="mx-auto w-11/12 flex-col py-28 md:mt-14">
          <div className="text-muted-foreground py-20 text-center text-sm">
            Loading club details...
          </div>
        </main>
      </>
    );
  }

  if (isError || !club) {
    return (
      <>
        <MainHeader backHref="/clubs" title="Club Details" withLogo={false} />

        <main className="mx-auto w-11/12 flex-col py-28 md:mt-14">
          <div className="text-destructive py-20 text-center text-sm">
            Failed to load club details. Please try again.
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <MainHeader backHref="/clubs" title="Club Details" withLogo={false} />

      <main className="pt-28 pb-16">
        <div className="mx-auto w-11/12 flex-1 space-y-4">
          {/* Club Header */}
          <Card>
            <CardContent>
              <div className="flex items-start gap-4">
                <Avatar className="size-20 rounded-lg">
                  <AvatarImage src={club.logo || undefined} alt={club.name} />
                  <AvatarFallback className="bg-primary/10 text-primary rounded-lg text-xl font-bold">
                    {club.name.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1">
                  <div className="mb-2 flex items-start justify-between">
                    <h1 className="text-xl font-bold">{club.name}</h1>
                  </div>

                  <div className="text-muted-foreground flex items-center gap-4 text-sm">
                    <Badge
                      variant={club.visibility === 'PUBLIC' ? 'default' : 'secondary'}
                      className="shrink-0"
                    >
                      {club.visibility === 'PUBLIC' ? (
                        <>
                          <IconWorld className="mr-1 size-3" /> Public
                        </>
                      ) : (
                        <>
                          <IconLock className="mr-1 size-3" /> Private
                        </>
                      )}
                    </Badge>
                    <div className="flex items-center gap-2">
                      <IconUsers className="size-4" />
                      <span>{club._count.clubMember} Anggota</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="mt-4">
                {isAuthenticated ? (
                  <>
                    {isLeader ? (
                      <Button
                        variant="destructive"
                        className="w-full"
                        onClick={() => setShowDeleteDialog(true)}
                        disabled={isDeleting}
                      >
                        <IconTrash className="size-4" />
                        Hapus Club
                      </Button>
                    ) : isMember ? (
                      <Button
                        variant="outline"
                        className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground w-full"
                        onClick={() => leaveClub(clubId)}
                        disabled={isLeaving}
                        loading={isLeaving}
                      >
                        <IconLogout className="mr-2 size-4" />
                        Keluar Club
                      </Button>
                    ) : club.hasRequestedToJoin ? (
                      <Button variant="outline" className="w-full" disabled>
                        Request Pending
                      </Button>
                    ) : (
                      <Button
                        variant={club.visibility === 'PUBLIC' ? 'default' : 'outline'}
                        className="w-full"
                        onClick={() => requestJoinClub(clubId)}
                        disabled={isRequesting}
                        loading={isRequesting}
                      >
                        {club.visibility === 'PUBLIC' ? 'Join Club' : 'Request to Join'}
                      </Button>
                    )}
                  </>
                ) : (
                  <div className="text-muted-foreground py-3 text-center text-sm capitalize">
                    Login untuk masuk ke club
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Description */}
          {club.description && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Tentang Club</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm whitespace-pre-wrap">
                  {club.description}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Rules */}
          {club.rules && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Peraturan Club</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-muted-foreground text-sm whitespace-pre-wrap">
                  {club.rules}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Leader */}
          {club.leader && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <IconCrown className="size-5 text-yellow-500" />
                  Club Leader
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <Avatar className="size-12">
                    <AvatarImage src={club.leader.image || undefined} alt={club.leader.name} />
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                      {club.leader.name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{club.leader.name}</p>
                    {club.leader.email && (
                      <p className="text-muted-foreground text-sm">{club.leader.email}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Join Requests - Only visible to club leader for private clubs */}
          {isAuthenticated && club.visibility === 'PRIVATE' && (
            <ClubJoinRequests clubId={clubId} isLeader={isLeader} />
          )}

          {/* Members List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-lg">
                <span>Members ({club.clubMember?.length || club._count.clubMember})</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {club.clubMember && club.clubMember.length > 0 ? (
                <div className="space-y-3">
                  {club.clubMember.map((member: any, index: number) => (
                    <div key={member.user?.id || index} className="flex items-center gap-3">
                      <Avatar className="size-10">
                        <AvatarImage
                          src={member.user?.image || undefined}
                          alt={member.user?.name || 'Member'}
                        />
                        <AvatarFallback className="bg-muted text-sm">
                          {(member.user?.name || 'M').substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          {member.user?.name || 'Unknown Member'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-muted-foreground py-8 text-center text-sm">
                  <IconUsers className="mx-auto mb-2 size-12 opacity-50" />
                  <p>
                    This club has {club._count.clubMember}{' '}
                    {club._count.clubMember === 1 ? 'member' : 'members'}
                  </p>
                  <p className="mt-1 text-xs">Member list not available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Delete Club Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Club</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <span className="font-semibold">{club.name}</span>?
              <br />
              <span className="text-destructive font-medium">
                This action cannot be undone. All members will be removed and all club data will be
                permanently deleted.
              </span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteClub}
              disabled={isDeleting}
              loading={isDeleting}
            >
              <IconTrash className="mr-2 size-4" />
              Delete Club
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ClubDetailPage;
