'use client';

import MainHeader from '@/components/headers/MainHeader';
import BottomNavigationWrapper from '@/components/ui/BottomNavigationWrapper';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { clubsQueryOptions } from '@/queries/club';
import { joinClubMutationOptions, requestJoinClubMutationOptions } from '@/mutations/club';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { IconUsers, IconLock, IconWorld, IconSearch, IconUserCircle, IconPlus } from '@tabler/icons-react';
import { Input } from '@/components/ui/input';
import { useRouter } from 'next/navigation';
import useAuthStore from '@/stores/useAuthStore';
import { toast } from 'sonner';

const ClubsPage = () => {
  const [filter, setFilter] = useState<'ALL' | 'PUBLIC' | 'PRIVATE'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const queryClient = useQueryClient();
  const router = useRouter();
  const { isAuth } = useAuthStore();
  const [isHydrated, setIsHydrated] = useState(false);

  // Wait for Zustand to hydrate from localStorage
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const { data, isLoading, isError } = useQuery(clubsQueryOptions());
  const { mutate: joinClub, isPending: isJoining } = useMutation(
    joinClubMutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['clubs'] });
      }
    })
  );
  const { mutate: requestJoinClub, isPending: isRequesting } = useMutation(
    requestJoinClubMutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['clubs'] });
      }
    })
  );

  const clubs = data ?? [];

  // Filter clubs based on selected filter and search query
  const filteredClubs = clubs.filter((club) => {
    const matchesFilter = filter === 'ALL' || club.visibility === filter;
    const matchesSearch = searchQuery === '' || 
      club.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      club.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleJoinClub = (clubId: string, visibility: 'PUBLIC' | 'PRIVATE') => {
    if (visibility === 'PUBLIC') {
      joinClub(clubId);
    } else {
      requestJoinClub(clubId);
    }
  };

  const handleCreateClub = () => {
    if (!isHydrated) return; // Wait for hydration
    
    if (!isAuth) {
      toast.error('Please login to create a club');
      return;
    }
    
    router.push('/clubs/create');
  };

  return (
    <>
      <MainHeader backHref="/" title="Clubs" withLogo={false} />

      <main className="mt-24 w-full md:mt-14 flex flex-col min-h-[calc(100dvh-96px)] pb-20">
        <div className="w-full bg-white border-b sticky top-24 md:top-14 z-10">
          {/* Search Bar */}
          <div className="w-11/12 mx-auto pt-4 pb-3">
            <div className="relative">
              <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search clubs by name or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4"
              />
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="w-11/12 mx-auto pb-4">
            <Tabs value={filter} onValueChange={(value) => setFilter(value as any)} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="ALL">All Clubs</TabsTrigger>
                <TabsTrigger value="PUBLIC">
                  <IconWorld className="size-4 mr-1" />
                  Public
                </TabsTrigger>
                <TabsTrigger value="PRIVATE">
                  <IconLock className="size-4 mr-1" />
                  Private
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        {/* Clubs List */}
        <div className="w-11/12 mx-auto flex-1 py-6">
          {isLoading && (
            <div className="text-muted-foreground py-20 text-center text-sm">
              Loading clubs...
            </div>
          )}

          {isError && !isLoading && (
            <div className="text-destructive py-20 text-center text-sm">
              Failed to load clubs. Please try again.
            </div>
          )}

          {!isLoading && !isError && filteredClubs.length === 0 && (
            <div className="text-muted-foreground py-20 text-center text-sm">
              {searchQuery ? (
                <>No clubs found matching "{searchQuery}"</>
              ) : filter === 'ALL' ? (
                'No clubs available yet.'
              ) : (
                `No ${filter.toLowerCase()} clubs available yet.`
              )}
            </div>
          )}

          {!isLoading && !isError && filteredClubs.length > 0 && (
            <div className="space-y-3">
              {filteredClubs.map((club) => (
                <Card key={club.id} className="overflow-hidden hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      {/* Club Avatar/Logo */}
                      <Avatar className="size-16 rounded-lg shrink-0">
                        <AvatarImage src={club.logo || undefined} alt={club.name} />
                        <AvatarFallback className="rounded-lg bg-primary/10 text-primary font-semibold">
                          {club.name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>

                      {/* Club Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-2 mb-1">
                          <h3 className="font-semibold text-base leading-tight flex-1">
                            {club.name}
                          </h3>
                          <Badge 
                            variant={club.visibility === 'PUBLIC' ? 'default' : 'secondary'}
                            className="text-xs shrink-0"
                          >
                            {club.visibility === 'PUBLIC' ? (
                              <><IconWorld className="size-3 mr-1" /> Public</>
                            ) : (
                              <><IconLock className="size-3 mr-1" /> Private</>
                            )}
                          </Badge>
                        </div>
                        
                        {club.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                            {club.description}
                          </p>
                        )}
                        
                        {/* Leader and Members Info */}
                        <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                          <div className="flex items-center gap-1">
                            <IconUserCircle className="size-4" />
                            <span>{club.leader?.name || 'Unknown Leader'}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <IconUsers className="size-4" />
                            <span>{club._count.clubMember} {club._count.clubMember === 1 ? 'member' : 'members'}</span>
                          </div>
                        </div>

                        {/* View Details Button */}
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full"
                          onClick={() => router.push(`/clubs/${club.id}`)}
                        >
                          View Club Details
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Floating Action Button */}
      {isHydrated && (
        <Button
          size="lg"
          className="fixed bottom-24 right-6 rounded-full h-14 px-6 shadow-lg z-30 gap-2"
          onClick={handleCreateClub}
        >
          <IconPlus className="size-5" />
          <span className="font-semibold">Create Club</span>
        </Button>
      )}

      <BottomNavigationWrapper>
        <div className="flex-center py-2">
          <p className="text-xs text-muted-foreground">
            Find and join sports clubs in your area
          </p>
        </div>
      </BottomNavigationWrapper>
    </>
  );
};

export default ClubsPage;
