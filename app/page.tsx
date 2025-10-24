import MainBottomNavigation from '@/components/footers/MainBottomNavigation';
import MainHeader from '@/components/headers/MainHeader';
import ActiveCourtSection from '@/components/section/home/ActiveCourtSection';
import BannerSection from '@/components/section/home/BannerSection';
import MembershipCtaSection from '@/components/section/home/MembershipCtaSection';
import MenuSection from '@/components/section/home/MenuSection';

export default async function HomePage() {
  return (
    <>
      <MainHeader />
      <main className="mt-0 mb-[28%] w-full md:mt-14">
        <BannerSection />
        <MenuSection />
        <ActiveCourtSection />
        <MembershipCtaSection />
      </main>
      <MainBottomNavigation />
    </>
  );
}
