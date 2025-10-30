import MainBottomNavigation from '@/components/footers/MainBottomNavigation';
import MainHeader from '@/components/headers/MainHeader';
import ActiveCourtSection from '@/components/section/home/ActiveCourtSection';
import BannerSection from '@/components/section/home/BannerSection';
import MembershipCtaSection from '@/components/section/home/MembershipCtaSection';
import MenuSection from '@/components/section/home/MenuSection';
import SponsorshipMarqueSection from '@/components/section/home/SponsorshipMarqueSection';

export default async function HomePage() {
  return (
    <>
      <MainHeader withNotificationBadge />
      <main className="mt-24 mb-[28%] w-full md:mt-14 lg:mb-0">
        <BannerSection />
        <MenuSection />
        <ActiveCourtSection />
        <SponsorshipMarqueSection />
        <MembershipCtaSection />
      </main>
      <MainBottomNavigation />
    </>
  );
}
