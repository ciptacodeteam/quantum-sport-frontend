'use client';

import { deleteAdminClubApi } from '@/api/admin/club';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { useConfirmMutation } from '@/hooks/useConfirmDialog';
import { adminClubsQueryOptions } from '@/queries/admin/club';
import { approveAdminClubMutationOptions } from '@/mutations/admin/club';
import type { Club } from '@/types/model';
import { IconEye, IconTrash, IconWorld, IconLock, IconCheck } from '@tabler/icons-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createColumnHelper } from '@tanstack/react-table';
import dayjs from 'dayjs';
import { useRouter } from 'next/navigation';
import { useMemo } from 'react';

const ClubTable = () => {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: clubs, isLoading } = useQuery(adminClubsQueryOptions());

  const { confirmAndMutate } = useConfirmMutation(
    {
      mutationFn: deleteAdminClubApi
    },
    {
      title: 'Delete Club',
      description: 'Are you sure you want to delete this club? This action cannot be undone and all members will be removed.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      destructive: true,
      toastMessages: {
        loading: 'Deleting club...',
        success: () => 'Club successfully deleted.',
        error: 'Failed to delete club.'
      },
      invalidate: adminClubsQueryOptions().queryKey
    }
  );

  const { mutate: approveClub, isPending: isApproving } = useMutation(
    approveAdminClubMutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: adminClubsQueryOptions().queryKey });
      }
    })
  );

  const colHelper = createColumnHelper<Club>();

  const columns = useMemo(
    () => [
      colHelper.accessor('logo', {
        header: 'Logo',
        cell: (info) => (
          <Avatar className="size-10 rounded-lg">
            <AvatarImage src={info.getValue() || undefined} />
            <AvatarFallback className="rounded-lg bg-primary/10 text-primary font-semibold">
              {info.row.original.name.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        )
      }),
      colHelper.accessor('name', {
        header: 'Club Name',
        cell: (info) => (
          <div className="font-medium">{info.getValue()}</div>
        )
      }),
      colHelper.accessor('leader', {
        header: 'Leader',
        cell: (info) => {
          const leader = info.getValue();
          return (
            <div>
              <p className="font-medium">{leader?.name || 'N/A'}</p>
              <p className="text-xs text-muted-foreground">{leader?.email || ''}</p>
            </div>
          );
        }
      }),
      colHelper.accessor('visibility', {
        header: 'Visibility',
        cell: (info) => (
          <Badge variant={info.getValue() === 'PUBLIC' ? 'default' : 'secondary'}>
            {info.getValue() === 'PUBLIC' ? (
              <><IconWorld className="size-3 mr-1" /> Public</>
            ) : (
              <><IconLock className="size-3 mr-1" /> Private</>
            )}
          </Badge>
        )
      }),
      colHelper.accessor('isActive', {
        header: 'Status',
        cell: (info) => (
          <Badge variant={info.getValue() ? 'default' : 'secondary'}>
            {info.getValue() ? 'Active' : 'Inactive'}
          </Badge>
        )
      }),
      colHelper.accessor('createdAt', {
        header: 'Created At',
        cell: (info) => dayjs(info.getValue()).format('DD/MM/YYYY HH:mm')
      }),
      colHelper.display({
        id: 'actions',
        header: 'Actions',
        cell: (info) => {
          const club = info.row.original;
          return (
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => router.push(`/admin/kelola-club/${club.id}`)}
              >
                <IconEye className="size-4 mr-1" />
                View
              </Button>
              {!club.isActive && (
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => approveClub(club.id)}
                  disabled={isApproving}
                  loading={isApproving}
                >
                  <IconCheck className="size-4 mr-1" />
                  Approve
                </Button>
              )}
              <Button
                size="sm"
                variant="destructive"
                onClick={() => confirmAndMutate(club.id)}
              >
                <IconTrash className="size-4 mr-1" />
                Delete
              </Button>
            </div>
          );
        }
      })
    ],
    [colHelper, router, confirmAndMutate, approveClub, isApproving]
  );

  return (
    <div className="space-y-4">
      {/* Data Table */}
      <DataTable columns={columns} data={clubs || []} loading={isLoading} />
    </div>
  );
};

export default ClubTable;
