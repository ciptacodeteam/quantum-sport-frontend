'use client';

import { getNameInitial, getTwoWordName } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from './avatar';
import { Skeleton } from './skeleton';
import { useQuery } from '@tanstack/react-query';
import { adminProfileQueryOptions } from '@/queries/admin/auth';

const AppUserProfile = ({ compact = false }: { compact?: boolean }) => {
  const { data: user, isPending } = useQuery(adminProfileQueryOptions);

  if (isPending || !user?.id) {
    return <Skeleton className="h-10 w-32 rounded-lg" />;
  }

  return (
    <div className="flex min-w-0 items-center gap-2.5 px-1 py-1.5 text-left text-sm">
      <Avatar className="h-8 w-8 shrink-0 rounded-lg">
        {user.image && <AvatarImage src={user.image} alt={user.name} />}
        <AvatarFallback className="rounded-lg">{getNameInitial(user.name)}</AvatarFallback>
      </Avatar>
      <div className="hidden min-w-0 flex-1 gap-1 text-left text-sm leading-tight md:grid">
        <span className="max-w-36 truncate font-medium">{getTwoWordName(user.name)}</span>
        {!compact && (
          <span
            className="text-muted-foreground max-w-60 truncate text-xs"
            title={user.email ?? undefined}
          >
            {user.email}
          </span>
        )}
      </div>
    </div>
  );
};
export default AppUserProfile;
