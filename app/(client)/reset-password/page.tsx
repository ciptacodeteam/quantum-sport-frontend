import ResetPasswordWithTokenForm from '@/components/forms/auth/ResetPasswordWithTokenForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

type ResetPasswordPageProps = {
  searchParams?: Promise<{
    token?: string | string[];
  }>;
};

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const rawToken = resolvedSearchParams?.token;
  const token = Array.isArray(rawToken) ? rawToken[0] : rawToken;

  return (
    <main className="bg-muted/30 flex min-h-screen items-center justify-center px-4 py-12">
      <Card className="border-border/80 w-full max-w-xl shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-semibold">Reset your password</CardTitle>
          <CardDescription>
            Choose a new password for your Quantum Sport account to finish resetting your access.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResetPasswordWithTokenForm token={token} />
        </CardContent>
      </Card>
    </main>
  );
}
