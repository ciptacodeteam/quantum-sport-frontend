import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { PropsWithChildren } from 'react';

const AdminDashboardLayout = async ({ children }: PropsWithChildren) => {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  if (!token) redirect('/admin/auth/login');

  return <>{children}</>;
};
export default AdminDashboardLayout;
