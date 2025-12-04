import { ROLE } from '@/lib/constants';
import { adminProfileQueryOptions } from '@/queries/admin/auth';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

type RoleAccessConfig = {
  allowedRoles: string[];
  redirectTo?: string;
  onUnauthorized?: () => void;
};

/**
 * Hook to control access based on user role
 * @param config - Configuration object with allowedRoles and optional redirect
 * @returns Object with user data and access status
 */
export function useRoleAccess(config: RoleAccessConfig) {
  const router = useRouter();
  const { data: me, isLoading } = useQuery(adminProfileQueryOptions);

  const userRole = me?.role?.toUpperCase?.();
  const hasAccess = userRole ? config.allowedRoles.includes(userRole) : false;

  useEffect(() => {
    if (isLoading || !me) return;

    if (!hasAccess) {
      if (config.onUnauthorized) {
        config.onUnauthorized();
      } else if (config.redirectTo) {
        router.replace(config.redirectTo);
      } else {
        // Default redirect based on role
        if (userRole === ROLE.COACH || userRole === ROLE.BALLBOY) {
          router.replace('/admin/kelola-karyawan');
        } else if (userRole === ROLE.CASHIER) {
          router.replace('/admin/booking-lapangan');
        } else if (userRole === ROLE.ADMIN_VIEWER) {
          router.replace('/admin/booking-lapangan');
        } else {
          router.replace('/admin/booking-lapangan');
        }
      }
    }
  }, [hasAccess, isLoading, me, userRole, router, config]);

  return {
    user: me,
    isLoading,
    hasAccess,
    userRole
  };
}

/**
 * Hook to check if user is super admin (ADMIN role)
 */
export function useIsSuperAdmin() {
  const { data: me } = useQuery(adminProfileQueryOptions);
  return me?.role?.toUpperCase?.() === ROLE.ADMIN;
}

/**
 * Hook to check if user has any of the specified roles
 */
export function useHasRole(roles: string[]) {
  const { data: me } = useQuery(adminProfileQueryOptions);
  const userRole = me?.role?.toUpperCase?.();
  return userRole ? roles.includes(userRole) : false;
}
