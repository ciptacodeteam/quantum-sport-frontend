import MainBottomNavigation from '@/components/footers/MainBottomNavigation';
import MainHeader from '@/components/headers/MainHeader';
import BannerSection from '@/components/section/home/BannerSection';

export default function HomePage() {
  return (
    <>
      <MainHeader withNotificationBadge withBorder />
      <main className="mt-[100px]">
        <BannerSection />
        {/* <ActiveCourtSection /> */}
      </main>
      <MainBottomNavigation />
    </>
  );
}
