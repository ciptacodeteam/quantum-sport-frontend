import { checkAdminAccountApi } from '@/api/admin/auth';
import LoginForm from '@/components/admin/forms/LoginForm';
import RegisterForm from '@/components/admin/forms/RegisterForm';
import { Card, CardContent } from '@/components/ui/card';
import { FieldDescription } from '@/components/ui/field';
import { cn, getPlaceholderImageUrl } from '@/lib/utils';
import Image from 'next/image';
import Link from 'next/link';

export default async function LoginPage() {
  const data = await checkAdminAccountApi();

  if (!data.success) {
    throw new Error('Failed to check admin account status');
  }

  return (
    <main>
      <div className={cn('flex flex-col gap-6')}>
        <Card className="overflow-hidden p-0">
          <CardContent className="grid p-0 md:grid-cols-2">
            {data.data.hasAdmin ? <LoginForm /> : <RegisterForm />}
            <div className="bg-muted relative hidden md:block">
              <Image
                src={getPlaceholderImageUrl({ width: 600, height: 800, text: 'Quantum Sport' })}
                alt="Image"
                className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
                fill
                preload
                unoptimized
              />
            </div>
          </CardContent>
        </Card>
        <FieldDescription className="px-6 text-center">
          &copy; {new Date().getFullYear()} Quantum Sport. All rights reserved.{' '}
          <Link
            href="https://ciptacode.id"
            className="hover:text-primary underline underline-offset-4"
            target="_blank"
            rel="noopener noreferrer"
          >
            Ciptacode
          </Link>
        </FieldDescription>
      </div>
    </main>
  );
}
