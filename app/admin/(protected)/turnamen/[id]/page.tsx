'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { adminTournamentQueryOptions } from '@/queries/admin/tournament';
import {
  IconArrowLeft,
  IconTrophy,
  IconCalendar,
  IconClock,
  IconMapPin,
  IconUsers,
  IconCurrencyDollar
} from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useRouter } from 'next/navigation';

export default function TournamentDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { data: tournament, isLoading } = useQuery(adminTournamentQueryOptions(params.id));

  if (isLoading) {
    return <div className="p-8">Loading...</div>;
  }

  if (!tournament) {
    return <div className="p-8">Tournament not found</div>;
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => router.back()}>
          <IconArrowLeft className="mr-2 size-4" />
          Back
        </Button>
      </div>

      {/* Tournament Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>Tournament Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-start gap-4">
            <Avatar className="size-24 rounded-lg">
              <AvatarImage src={tournament.image || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary rounded-lg">
                <IconTrophy className="size-12" />
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold">{tournament.name}</h2>
                <Badge variant={tournament.isActive ? 'default' : 'secondary'}>
                  {tournament.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              {tournament.description && (
                <p className="text-muted-foreground">{tournament.description}</p>
              )}
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <IconCalendar className="text-muted-foreground mt-0.5 size-5" />
              <div>
                <p className="text-muted-foreground text-sm">Start Date</p>
                <p className="font-medium">{dayjs(tournament.startDate).format('DD MMMM YYYY')}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <IconCalendar className="text-muted-foreground mt-0.5 size-5" />
              <div>
                <p className="text-muted-foreground text-sm">End Date</p>
                <p className="font-medium">{dayjs(tournament.endDate).format('DD MMMM YYYY')}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <IconClock className="text-muted-foreground mt-0.5 size-5" />
              <div>
                <p className="text-muted-foreground text-sm">Start Time</p>
                <p className="font-medium">{tournament.startTime}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <IconClock className="text-muted-foreground mt-0.5 size-5" />
              <div>
                <p className="text-muted-foreground text-sm">End Time</p>
                <p className="font-medium">{tournament.endTime}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <IconMapPin className="text-muted-foreground mt-0.5 size-5" />
              <div>
                <p className="text-muted-foreground text-sm">Location</p>
                <p className="font-medium">{tournament.location}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <IconUsers className="text-muted-foreground mt-0.5 size-5" />
              <div>
                <p className="text-muted-foreground text-sm">Max Teams</p>
                <p className="font-medium">{tournament.maxTeams} teams</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <IconUsers className="text-muted-foreground mt-0.5 size-5" />
              <div>
                <p className="text-muted-foreground text-sm">Team Size</p>
                <p className="font-medium">{tournament.teamSize} players</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <IconCurrencyDollar className="text-muted-foreground mt-0.5 size-5" />
              <div>
                <p className="text-muted-foreground text-sm">Entry Fee</p>
                <p className="font-medium">Rp {tournament.entryFee.toLocaleString('id-ID')}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tournament Rules Card */}
      {tournament.rules && (
        <Card>
          <CardHeader>
            <CardTitle>Tournament Rules</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className="prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: tournament.rules }}
            />
          </CardContent>
        </Card>
      )}

      {/* Metadata */}
      <Card>
        <CardHeader>
          <CardTitle>Metadata</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Tournament ID</span>
            <span className="font-mono">{tournament.id}</span>
          </div>
          <Separator />
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Created At</span>
            <span>{dayjs(tournament.createdAt).format('DD/MM/YYYY HH:mm')}</span>
          </div>
          <Separator />
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Updated At</span>
            <span>{dayjs(tournament.updatedAt).format('DD/MM/YYYY HH:mm')}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
