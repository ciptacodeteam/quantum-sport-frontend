import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type User = {
  name?: string | null;
  phone?: string | null;
};

export default function CustomerInfoCard({ user }: { user: User }) {
  if (!user) return null;
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">Informasi Pelanggan</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <p className="text-sm text-gray-600">Nama</p>
          <p className="font-semibold">{user.name || '-'}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">No. Telepon</p>
          <p className="font-semibold">{user.phone || '-'}</p>
        </div>
      </CardContent>
    </Card>
  );
}
