'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { clubRequestsQueryOptions } from '@/queries/club';
import { approveClubRequestMutationOptions, rejectClubRequestMutationOptions } from '@/mutations/club';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { IconUserPlus, IconX, IconCheck, IconClock, IconMail, IconCalendar } from '@tabler/icons-react';
import type { ClubJoinRequest } from '@/types/model';
import { useState } from 'react';

interface ClubJoinRequestsProps {
  clubId: string;
  isLeader: boolean;
}

export default function ClubJoinRequests({ clubId, isLeader }: ClubJoinRequestsProps) {
  const queryClient = useQueryClient();
  const [processingId, setProcessingId] = useState<string | null>(null);

  const { data: requests, isLoading, isError } = useQuery({
    ...clubRequestsQueryOptions(clubId),
    enabled: isLeader, // Only fetch if user is the leader
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
          <CardTitle className="text-lg flex items-center gap-2">
            <IconUserPlus className="size-5" />
            Join Requests
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-sm text-muted-foreground">
            Loading requests...
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (isError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <IconUserPlus className="size-5" />
            Join Requests
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-sm text-destructive">
            Failed to load requests
          </div>
        </CardContent>
      </Card>
    );
  }

  const pendingRequests = requests?.filter(req => req.status === 'PENDING') || [];

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
        <CardTitle className="text-lg flex items-center justify-between">
          <span className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <IconUserPlus className="size-5 text-primary" />
            </div>
            <div>
              <div>Join Requests</div>
              {pendingRequests.length > 0 && (
                <p className="text-xs font-normal text-muted-foreground mt-0.5">
                  {pendingRequests.length} {pendingRequests.length === 1 ? 'person' : 'people'} waiting for approval
                </p>
              )}
            </div>
          </span>
          {pendingRequests.length > 0 && (
            <Badge variant="default" className="text-sm px-3 py-1">
              {pendingRequests.length}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {pendingRequests.length === 0 ? (
          <div className="text-center py-12">
            <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <IconClock className="size-8 text-muted-foreground" />
            </div>
            <p className="font-medium text-sm mb-1">No pending requests</p>
            <p className="text-xs text-muted-foreground">
              New join requests will appear here
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingRequests.map((request: ClubJoinRequest, index: number) => {
              const isProcessing = processingId === request.userId;
              return (
                <div key={request.id}>
                  {index > 0 && <Separator className="my-3" />}
                  <div className="flex items-start gap-4">
                    <Avatar className="size-14 ring-2 ring-muted">
                      <AvatarImage src={request.user?.image || undefined} alt={request.user?.name} />
                      <AvatarFallback className="bg-linear-to-br from-primary/20 to-primary/10 text-primary font-bold text-base">
                        {request.user?.name?.substring(0, 2).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0 space-y-2">
                      <div>
                        <p className="font-semibold text-base leading-tight">{request.user?.name}</p>
                        <div className="flex flex-col gap-1 mt-1.5">
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <IconMail className="size-3.5" />
                            <span className="truncate">{request.user?.email}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
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
                          className="flex-1 gap-1.5 h-9"
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
                          className="flex-1 gap-1.5 h-9 border-destructive/20 text-destructive hover:bg-destructive hover:text-destructive-foreground"
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
