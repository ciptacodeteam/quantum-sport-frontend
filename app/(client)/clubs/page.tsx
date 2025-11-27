'use client';

import MainHeader from '@/components/headers/MainHeader';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { clubsQueryOptions } from '@/queries/club';
import { joinClubMutationOptions, requestJoinClubMutationOptions } from '@/mutations/club';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import {
  IconUsers,
  IconLock,
  IconWorld,
  IconSearch,
  IconUserCircle,
  IconPlus
} from '@tabler/icons-react';
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
  useMutation(
    joinClubMutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['clubs'] });
      }
    })
  );
  useMutation(
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
    const matchesSearch =
      searchQuery === '' ||
      club.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      club.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

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
      <MainHeader backHref="/" title="Clubs" withLogo={false} withBorder/>

      <main className="mt-24 flex w-full flex-col pb-20">
        <div className="z-10 w-full border-b bg-white">
          {/* Search Bar */}
          <div className="mx-auto w-11/12 max-w-7xl">
            <div className="relative">
              <IconSearch className="text-muted-foreground absolute top-1/2 left-3 size-5 -translate-y-1/2" />
              <Input
                type="text"
                placeholder="Cari nama club yang kamu inginkan ..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-4 pl-10"
              />
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="mx-auto mt-4 w-11/12 max-w-7xl pb-4">
            <Tabs
              value={filter}
              onValueChange={(value) => setFilter(value as any)}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="ALL">Semua Club</TabsTrigger>
                <TabsTrigger value="PUBLIC">
                  <IconWorld className="mr-1 size-4" />
                  Public
                </TabsTrigger>
                <TabsTrigger value="PRIVATE">
                  <IconLock className="mr-1 size-4" />
                  Private
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        {/* Clubs List */}
        <div className="mx-auto mt-8 w-11/12 max-w-7xl flex-1">
          {isLoading && (
            <div className="text-muted-foreground py-20 text-center text-sm">Loading clubs...</div>
          )}

          {isError && !isLoading && (
            <div className="text-destructive py-20 text-center text-sm">
              Gagal memuat data club. Silahkan coba lagi.
            </div>
          )}

          {!isLoading && !isError && filteredClubs.length === 0 && (
            <div className="text-muted-foreground py-20 text-center text-sm">
              {searchQuery ? (
                <>Tidak ada club ditemukan.</>
              ) : filter === 'ALL' ? (
                'Club tidak tersedia saat ini.'
              ) : (
                `Club ${filter.toLowerCase()} tidak tersedia saat ini.`
              )}
            </div>
          )}

          {!isLoading && !isError && filteredClubs.length > 0 && (
            <div className="space-y-3">
              {filteredClubs.map((club) => (
                <Card key={club.id} className="overflow-hidden transition-shadow hover:shadow-md">
                  <CardContent>
                    <div className="flex items-start gap-4">
                      {/* Club Avatar/Logo */}
                      <Avatar className="size-16 shrink-0 rounded-lg">
                        <AvatarImage src={club.logo || undefined} alt={club.name} />
                        <AvatarFallback className="bg-primary/10 text-primary rounded-lg font-semibold">
                          {club.name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>

                      {/* Club Info */}
                      <div className="flex-1">
                        <div className="mb-1 flex items-start gap-2">
                          <h3 className="mb-2 flex-1 text-base leading-tight font-semibold">
                            {club.name}
                          </h3>
                          <Badge
                            variant={club.visibility === 'PUBLIC' ? 'default' : 'secondary'}
                            className="shrink-0 text-xs"
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
                        </div>

                        {club.description && (
                          <p className="text-muted-foreground mb-4 line-clamp-2 text-sm">
                            {club.description}
                          </p>
                        )}

                        {/* Leader and Members Info */}
                        <div className="text-muted-foreground mb-4 flex items-center gap-4 text-xs">
                          <div className="flex items-center gap-1">
                            <IconUserCircle className="size-4" />
                            <span className="capitalize">
                              {club.leader?.name || 'Unknown Leader'}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <IconUsers className="size-4" />
                            <span>{club._count?.clubMember ?? 0} Anggota</span>
                          </div>
                        </div>

                        {/* View Details Button */}
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full"
                          onClick={() => router.push(`/clubs/${club.id}`)}
                        >
                          lihat Detail Club
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
          className="fixed right-6 bottom-10 z-30 gap-2 rounded-full px-6 shadow-lg"
          onClick={handleCreateClub}
        >
          <IconPlus className="size-4" />
          <span className="font-semibold">Buat Club</span>
        </Button>
      )}
    </>
  );
};

export default ClubsPage;
