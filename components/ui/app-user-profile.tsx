'use client';

import { getNameInitial, getTwoWordName } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from './avatar';
import { Skeleton } from './skeleton';
import { useQuery } from '@tanstack/react-query';
import { adminProfileQueryOptions } from '@/queries/admin/auth';

const AppUserProfile = () => {
  const { data: user, isPending } = useQuery(adminProfileQueryOptions);

  if (isPending || !user?.id) {
    return <Skeleton className="h-10 w-32 rounded-lg" />;
  }

  return (
    <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
      <Avatar className="h-8 w-8 rounded-lg">
        {user.image && <AvatarImage src={user.image} alt={user.name} />}
        <AvatarFallback className="rounded-lg">{getNameInitial(user.name)}</AvatarFallback>
      </Avatar>
      <div className="hidden flex-1 text-left text-sm leading-tight md:grid">
        <span className="truncate font-medium">{getTwoWordName(user.name)}</span>
        <span className="line-clamp-1 truncate text-xs">{user.email}</span>
      </div>
    </div>
  );
};
export default AppUserProfile;
