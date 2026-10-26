import LoginForm from '@/components/admin/forms/LoginForm';
import RegisterForm from '@/components/admin/forms/RegisterForm';
import { Card, CardContent } from '@/components/ui/card';
import { FieldDescription } from '@/components/ui/field';
import { env } from '@/env';
import { cn, getPlaceholderImageUrl } from '@/lib/utils';
import Image from 'next/image';
import Link from 'next/link';

export default async function LoginPage() {
  const hasAdmin: boolean | null = await fetch(
    `${env.NEXT_PUBLIC_API_URL}/admin/auth/check-account`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
      cache: 'no-store',
      signal: AbortSignal.timeout(8000)
    }
  )
    .then(async (res) => {
      if (!res.ok) {
        throw new Error('Failed to fetch admin account status');
      }

      const data = await res.json();
      if (typeof data?.data?.hasAdmin !== 'boolean') {
        throw new Error('Invalid admin account status');
      }
      return data.data.hasAdmin;
    })
    .catch(() => {
      return null;
    });

  return (
    <main>
      <div className={cn('flex flex-col gap-6')}>
        <Card className="overflow-hidden p-0">
          <CardContent className="grid p-0 md:grid-cols-2">
            {hasAdmin === null ? (
              <div role="alert" className="space-y-4 p-6 md:p-8">
                <h1 className="text-xl font-semibold">Koneksi server belum tersedia</h1>
                <p className="text-sm leading-relaxed text-black/55">
                  Status akun admin belum dapat diperiksa. Pastikan backend berjalan, lalu coba
                  lagi.
                </p>
                <a
                  href="/admin/auth/login"
                  className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex rounded-full px-6 py-3 text-sm font-medium"
                >
                  Coba lagi
                </a>
              </div>
            ) : hasAdmin ? (
              <LoginForm />
            ) : (
              <RegisterForm />
            )}
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
