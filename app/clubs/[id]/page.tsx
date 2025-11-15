'use client';

import MainHeader from '@/components/headers/MainHeader';
import BottomNavigationWrapper from '@/components/ui/BottomNavigationWrapper';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { clubQueryOptions, clubMembershipsQueryOptions } from '@/queries/club';
import { profileQueryOptions } from '@/queries/profile';
import { requestJoinClubMutationOptions, leaveClubMutationOptions, deleteClubMutationOptions } from '@/mutations/club';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { IconUsers, IconLock, IconWorld, IconUserCircle, IconCrown, IconLogout, IconTrash } from '@tabler/icons-react';
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
  const { data: user, isLoading: isUserLoading, isError: isUserError } = useQuery({
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
    enabled: isAuthenticated, // Only fetch if authenticated
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
        <main className="mt-24 w-full md:mt-14 flex flex-col min-h-[calc(100dvh-96px)] pb-20">
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
        <main className="mt-24 w-full md:mt-14 flex flex-col min-h-[calc(100dvh-96px)] pb-20">
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

      <main className="mt-24 w-full md:mt-14 flex flex-col min-h-[calc(100dvh-96px)] pb-20">
        <div className="w-11/12 mx-auto flex-1 py-6 space-y-4">
          {/* Club Header */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <Avatar className="size-20 rounded-lg">
                  <AvatarImage src={club.logo || undefined} alt={club.name} />
                  <AvatarFallback className="rounded-lg bg-primary/10 text-primary font-bold text-xl">
                    {club.name.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h1 className="font-bold text-2xl">{club.name}</h1>
                    <Badge 
                      variant={club.visibility === 'PUBLIC' ? 'default' : 'secondary'}
                      className="shrink-0"
                    >
                      {club.visibility === 'PUBLIC' ? (
                        <><IconWorld className="size-3 mr-1" /> Public</>
                      ) : (
                        <><IconLock className="size-3 mr-1" /> Private</>
                      )}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <IconUsers className="size-4" />
                      <span>{club._count.clubMember} {club._count.clubMember === 1 ? 'member' : 'members'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="mt-4">
                {/* Only show action buttons if user is authenticated AND user data exists */}
                {isAuthenticated ? (
                  <>
                    {isLeader ? (
                      /* Delete button for club leader */
                      <Button
                        variant="destructive"
                        className="w-full"
                        onClick={() => setShowDeleteDialog(true)}
                        disabled={isDeleting}
                      >
                        <IconTrash className="size-4 mr-2" />
                        Delete Club
                      </Button>
                    ) : isMember ? (
                      /* Leave button for members */
                      <Button
                        variant="outline"
                        className="w-full border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                        onClick={() => leaveClub(clubId)}
                        disabled={isLeaving}
                        loading={isLeaving}
                      >
                        <IconLogout className="size-4 mr-2" />
                        Leave Club
                      </Button>
                    ) : club.hasRequestedToJoin ? (
                      /* Pending request status */
                      <Button variant="outline" className="w-full" disabled>
                        Request Pending
                      </Button>
                    ) : (
                      /* Request to Join for both public and private clubs */
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
                  <div className="text-center py-3 text-sm text-muted-foreground">
                    Please login to join this club
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Description */}
          {club.description && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">About</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {club.description}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Rules */}
          {club.rules && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Club Rules</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {club.rules}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Leader */}
          {club.leader && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
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
                      <p className="text-sm text-muted-foreground">{club.leader.email}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Join Requests - Only visible to club leader for private clubs */}
          {isAuthenticated && club.visibility === 'PRIVATE' && (
            <ClubJoinRequests 
              clubId={clubId} 
              isLeader={isLeader} 
            />
          )}

          {/* Members List */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center justify-between">
                <span>Members ({club.clubMember?.length || club._count.clubMember})</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {club.clubMember && club.clubMember.length > 0 ? (
                <div className="space-y-3">
                  {club.clubMember.map((member: any, index: number) => (
                    <div key={member.user?.id || index} className="flex items-center gap-3">
                      <Avatar className="size-10">
                        <AvatarImage src={member.user?.image || undefined} alt={member.user?.name || 'Member'} />
                        <AvatarFallback className="bg-muted text-sm">
                          {(member.user?.name || 'M').substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{member.user?.name || 'Unknown Member'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  <IconUsers className="size-12 mx-auto mb-2 opacity-50" />
                  <p>This club has {club._count.clubMember} {club._count.clubMember === 1 ? 'member' : 'members'}</p>
                  <p className="text-xs mt-1">Member list not available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      <BottomNavigationWrapper>
        <div className="flex-center py-2">
          <p className="text-xs text-muted-foreground">
            {isMember ? 'You are a member of this club' : 'Join this club to participate'}
          </p>
        </div>
      </BottomNavigationWrapper>

      {/* Delete Club Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Club</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <span className="font-semibold">{club.name}</span>?
              <br />
              <span className="text-destructive font-medium">
                This action cannot be undone. All members will be removed and all club data will be permanently deleted.
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
              <IconTrash className="size-4 mr-2" />
              Delete Club
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ClubDetailPage;
