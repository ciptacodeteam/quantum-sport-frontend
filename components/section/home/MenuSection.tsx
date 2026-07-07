import MenuItem from './MenuItem';
import BookingMenuIcon from '@/assets/icons/menus/booking.svg';
import ClubMenuIcon from '@/assets/icons/menus/club.svg';
import MembershipMenuIcon from '@/assets/icons/menus/membership.svg';
import PadelCourtIcon from '@/assets/icons/menus/padelcourt.webp';
import SracademyLogo from '@/assets/icons/menus/sr.webp';
import Image from 'next/image';

const MenuSection = () => {
  const menuList = [
    {
      title: 'Padel',
      subtitle: 'Pesan lapangan dengan mudah dan bermain tanpa ribet.',
      url: '/booking',
      icon: (
        <Image
          src={PadelCourtIcon}
          alt=""
          className="size-9 object-contain mix-blend-multiply lg:size-10"
          aria-hidden
        />
      )
    },
    {
      title: 'Tennis',
      subtitle: 'Booking lapangan tennis dengan alur yang sama.',
      url: '/booking/tennis',
      icon: <BookingMenuIcon className="size-13 lg:size-12" />
    },
    {
      title: 'Coach',
      subtitle: 'Lihat profil coach, pengalaman, dan portfolio latihan.',
      url: '/coaches',
      icon: (
        <Image
          src={SracademyLogo}
          alt=""
          className="size-9 object-contain lg:size-10"
          aria-hidden
        />
      )
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
    }
  ];

  return (
    <section className="mx-auto my-7 w-11/12 max-w-7xl">
      <div className="mx-auto grid w-full grid-cols-5 gap-2 sm:gap-3 lg:gap-4">
        {menuList.map((item) => (
          <div key={item.title} className="flex justify-center">
            <MenuItem item={item} />
          </div>
        ))}
      </div>
    </section>
  );
};
export default MenuSection;
