'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { clubRequestsQueryOptions } from '@/queries/club';
import {
  approveClubRequestMutationOptions,
  rejectClubRequestMutationOptions
} from '@/mutations/club';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  IconUserPlus,
  IconX,
  IconCheck,
  IconClock,
  IconMail,
  IconCalendar
} from '@tabler/icons-react';
import type { ClubJoinRequest } from '@/types/model';
import { useState } from 'react';

interface ClubJoinRequestsProps {
  clubId: string;
  isLeader: boolean;
}

export default function ClubJoinRequests({ clubId, isLeader }: ClubJoinRequestsProps) {
  const queryClient = useQueryClient();
  const [processingId, setProcessingId] = useState<string | null>(null);

  const {
    data: requests,
    isLoading,
    isError
  } = useQuery({
    ...clubRequestsQueryOptions(clubId),
    enabled: isLeader // Only fetch if user is the leader
  });

  const { mutate: approveRequest, isPending: isApproving } = useMutation(
    approveClubRequestMutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['clubs', clubId, 'requests'] });
        queryClient.invalidateQueries({ queryKey: ['clubs', clubId] });
        setProcessingId(null);
      },
      onError: () => {
        setProcessingId(null);
      }
    })
  );

  const { mutate: rejectRequest, isPending: isRejecting } = useMutation(
    rejectClubRequestMutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['clubs', clubId, 'requests'] });
        queryClient.invalidateQueries({ queryKey: ['clubs', clubId] });
        setProcessingId(null);
      },
      onError: () => {
        setProcessingId(null);
      }
    })
  );

  const handleApprove = (userId: string) => {
    setProcessingId(userId);
    approveRequest({ clubId, userId });
  };

  const handleReject = (userId: string) => {
    setProcessingId(userId);
    rejectRequest({ clubId, userId });
  };

  // Don't render if not leader
  if (!isLeader) return null;

  // Loading state
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <IconUserPlus className="size-5" />
            Join Requests
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground py-4 text-center text-sm">Loading requests...</div>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (isError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <IconUserPlus className="size-5" />
            Join Requests
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-destructive py-4 text-center text-sm">Failed to load requests</div>
        </CardContent>
      </Card>
    );
  }

  const pendingRequests = requests?.filter((req) => req.status === 'PENDING') || [];

  // Format relative time
  const getRelativeTime = (date: string) => {
    const now = new Date();
    const requestDate = new Date(date);
    const diffInMs = now.getTime() - requestDate.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));

    if (diffInDays > 0) {
      return `${diffInDays} ${diffInDays === 1 ? 'day' : 'days'} ago`;
    } else if (diffInHours > 0) {
      return `${diffInHours} ${diffInHours === 1 ? 'hour' : 'hours'} ago`;
    } else if (diffInMinutes > 0) {
      return `${diffInMinutes} ${diffInMinutes === 1 ? 'minute' : 'minutes'} ago`;
    } else {
      return 'Just now';
    }
  };

  return (
    <Card className="border-2">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-lg">
          <span className="flex items-center gap-2">
            <div className="bg-primary/10 rounded-lg p-2">
              <IconUserPlus className="text-primary size-5" />
            </div>
            <div>
              <div>Join Requests</div>
              {pendingRequests.length > 0 && (
                <p className="text-muted-foreground mt-0.5 text-xs font-normal">
                  {pendingRequests.length} {pendingRequests.length === 1 ? 'person' : 'people'}{' '}
                  waiting for approval
                </p>
              )}
            </div>
          </span>
          {pendingRequests.length > 0 && (
            <Badge variant="default" className="px-3 py-1 text-sm">
              {pendingRequests.length}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {pendingRequests.length === 0 ? (
          <div className="py-12 text-center">
            <div className="bg-muted mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
              <IconClock className="text-muted-foreground size-8" />
            </div>
            <p className="mb-1 text-sm font-medium">No pending requests</p>
            <p className="text-muted-foreground text-xs">New join requests will appear here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingRequests.map((request: ClubJoinRequest, index: number) => {
              const isProcessing = processingId === request.userId;
              return (
                <div key={request.id}>
                  {index > 0 && <Separator className="my-3" />}
                  <div className="flex items-start gap-4">
                    <Avatar className="ring-muted size-14 ring-2">
                      <AvatarImage
                        src={request.user?.image || undefined}
                        alt={request.user?.name}
                      />
                      <AvatarFallback className="from-primary/20 to-primary/10 text-primary bg-linear-to-br text-base font-bold">
                        {request.user?.name?.substring(0, 2).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>

                    <div className="min-w-0 flex-1 space-y-2">
                      <div>
                        <p className="text-base leading-tight font-semibold">
                          {request.user?.name}
                        </p>
                        <div className="mt-1.5 flex flex-col gap-1">
                          <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
                            <IconMail className="size-3.5" />
                            <span className="truncate">{request.user?.email}</span>
                          </div>
                          <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
                            <IconCalendar className="size-3.5" />
                            <span>Requested {getRelativeTime(request.createdAt)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2 pt-1">
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => handleApprove(request.userId)}
                          disabled={isProcessing}
                          loading={isProcessing && isApproving}
                          className="h-9 flex-1 gap-1.5"
                        >
                          <IconCheck className="size-4" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleReject(request.userId)}
                          disabled={isProcessing}
                          loading={isProcessing && isRejecting}
                          className="border-destructive/20 text-destructive hover:bg-destructive hover:text-destructive-foreground h-9 flex-1 gap-1.5"
                        >
                          <IconX className="size-4" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
