import { Suspense } from 'react';
import ProfileContent from './profile-content';

function ProfileLoadingFallback() {
  return (
    <div className="flex h-dvh w-full items-center justify-center">
      <div className="text-muted-foreground">Loading profile...</div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<ProfileLoadingFallback />}>
      <ProfileContent />
    </Suspense>
  );
}
