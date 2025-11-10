'use client';

import { profileQueryOptions } from '@/queries/profile';
import useAuthModalStore from '@/stores/useAuthModalStore';
import { useQuery } from '@tanstack/react-query';
import { Button } from '../ui/button';
import { Skeleton } from '../ui/skeleton';
import LogoutButton from './LogoutButton';

const LoginModalButton = () => {
  const { data: user, isPending: isUserPending } = useQuery(profileQueryOptions);
  const openAuthModal = useAuthModalStore((state) => state.open);

  if (isUserPending) {
    return <Skeleton className="h-10 w-20" />;
  }

  if (user) {
    return <LogoutButton />;
  }

  return <Button onClick={openAuthModal}>Login</Button>;
};
export default LoginModalButton;
