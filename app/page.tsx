import LoginModalButton from '@/components/buttons/LoginModalButton';
import LogoutButton from '@/components/buttons/LogoutButton';
import ProfileTest from '@/components/ProfileTest';
import BannerSection from '@/components/section/home/BannerSection';
import { cookies } from 'next/headers';

export default async function HomePage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  return (
    <>
      {!token ? <LoginModalButton /> : <LogoutButton />}
      <BannerSection />
      <ProfileTest />
    </>
  );
}
