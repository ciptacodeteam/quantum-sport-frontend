import MainBottomNavigation from '@/components/footers/MainBottomNavigation';
import MainHeader from '@/components/headers/MainHeader';
import BannerSection from '@/components/section/home/BannerSection';
import MembershipCtaSection from '@/components/section/home/MembershipCtaSection';
import MenuSection from '@/components/section/home/MenuSection';
import SponsorshipMarqueSection from '@/components/section/home/SponsorshipMarqueSection';

export default async function HomePage() {
  return (
    <>
      <MainHeader withNotificationBadge />
      <main className="mt-28 lg:mt-24">
        <BannerSection />
        <MenuSection />
        {/* <ActiveCourtSection /> */}
        <SponsorshipMarqueSection />
        <MembershipCtaSection />
      </main>
      <MainBottomNavigation />
    </>
  );
}
