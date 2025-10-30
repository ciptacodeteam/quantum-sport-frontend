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
      title: 'Membership',
      url: '#',
      icon: <MembershipMenuIcon className="size-9" />
    },
    {
      title: 'Tournament',
      url: '#',
      icon: <TournamentMenuIcon className="size-9" />
    }
  ];

  return (
    <section className="mx-auto my-6 w-full max-w-7xl px-4">
      <div className="mx-auto grid w-full max-w-xl grid-cols-4 gap-6">
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
