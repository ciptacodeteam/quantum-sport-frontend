import MenuItem from './MenuItem';
import BookingMenuIcon from '@/assets/icons/menus/booking.svg';
import ClubMenuIcon from '@/assets/icons/menus/club.svg';
import MembershipMenuIcon from '@/assets/icons/menus/membership.svg';
import TournamentMenuIcon from '@/assets/icons/menus/tournament.svg';

const MenuSection = () => {
  const menuList = [
    {
      title: 'Booking',
      url: '/booking',
      icon: <BookingMenuIcon className="size-13" />
    },
    {
      title: 'Club',
      url: '#',
      icon: <ClubMenuIcon className="size-9" />
    },
    {
      title: 'Value Pack',
      url: '/valuepack',
      icon: <MembershipMenuIcon className="size-9" />
    },
    {
      title: 'Turnamen',
      url: '#',
      icon: <TournamentMenuIcon className="size-9" />
    }
  ];

  return (
    <section className="mx-auto max-w-7xl w-11/12 my-8">
      <div className="mx-auto grid w-full grid-cols-4 gap-6">
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
