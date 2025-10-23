import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { PropsWithChildren } from 'react';

const AdminAuthLayout = async ({ children }: PropsWithChildren) => {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  if (!!token) redirect('/admin/dashboard');

  return (
    <div className="bg-muted flex-center min-h-svh flex-col p-6 md:p-10">
      <div className="w-full max-w-sm md:max-w-4xl">{children}</div>
    </div>
  );
};
export default AdminAuthLayout;
