import MenuItem from './MenuItem';
import BookingMenuIcon from '@/assets/icons/menus/booking.svg';
import ClubMenuIcon from '@/assets/icons/menus/club.svg';
import MembershipMenuIcon from '@/assets/icons/menus/membership.svg';
import TournamentMenuIcon from '@/assets/icons/menus/tournament.svg';

const MenuSection = () => {
  const menuList = [
    {
      title: 'Booking',
      subtitle: 'Pesan lapangan dengan mudah dan bermain tanpa ribet.',
      url: '/booking',
      icon: <BookingMenuIcon className="size-13 lg:size-12" />
    },
    {
      title: 'Club',
      subtitle: 'Temukan informasi lengkap tentang klub yang tersedia.',
      url: '/clubs',
      icon: <ClubMenuIcon className="size-9 lg:size-10" />
    },
    {
      title: 'Value Pack',
      subtitle: 'Dapatkan paket hemat dengan berbagai keuntungan eksklusif.',
      url: '/membership',
      icon: <MembershipMenuIcon className="size-9 lg:size-10" />
    },
    {
      title: 'Turnamen',
      subtitle: 'Ikuti berbagai event dan kompetisi padel seru yang diadakan rutin.',
      url: '/tournaments',
      icon: <TournamentMenuIcon className="size-9 lg:size-9" />
    }
  ];

  return (
    <section className="mx-auto my-8 w-11/12 max-w-7xl">
      <div className="mx-auto grid w-full grid-cols-4 gap-6 lg:gap-4">
        {menuList.map((item) => (
          <div key={item.title} className="flex-center flex-1">
            <MenuItem item={item} />
          </div>
        ))}
      </div>
    </section>
  );
};
export default MenuSection;
