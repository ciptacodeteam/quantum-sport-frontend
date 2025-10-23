import MainHeader from '@/components/headers/MainHeader';
import ProfileTest from '@/components/ProfileTest';
import BannerSection from '@/components/section/home/BannerSection';

export default async function HomePage() {
  // const cookieStore = await cookies();
  // const token = cookieStore.get('token')?.value;

  return (
    <>
      <MainHeader />
      <main className="mt-0 min-h-screen w-full md:mt-14">
        {/* {!token ? <LoginModalButton /> : <LogoutButton />} */}
        <BannerSection />
        <ProfileTest />
      </main>
    </>
  );
}
