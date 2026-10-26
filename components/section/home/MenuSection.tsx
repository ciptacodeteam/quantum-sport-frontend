import Image from 'next/image';
import Link from 'next/link';

const menus = [
  { title: 'Padel', href: '/booking', image: '/assets/icons/mobile-menu/padel.png' },
  { title: 'Tennis', href: '/booking/tennis', image: '/assets/icons/mobile-menu/tennis.png' },
  { title: 'Value Pack', href: '/membership', image: '/assets/icons/mobile-menu/value-pack.png' },
  { title: 'Add Ons', href: '/add-ons', image: '/assets/icons/mobile-menu/add-ons-v2.png' }
];

export default function MenuSection() {
  return (
    <nav aria-label="Menu olahraga" className="py-6 lg:hidden">
      <ul className="mx-auto grid max-w-md grid-cols-4 gap-2">
        {menus.map((menu) => (
          <li key={menu.href}>
            <Link
              href={menu.href}
              className="group flex min-h-28 flex-col items-center justify-center gap-2.5 rounded-2xl text-center focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ad422b]"
            >
              <span className="relative block size-16 transition-transform duration-200 group-hover:-translate-y-1 group-active:scale-95 motion-reduce:transform-none min-[375px]:size-[72px] sm:size-[88px]">
                <span
                  aria-hidden="true"
                  className="absolute top-0 left-1/2 size-14 -translate-x-1/2 rounded-2xl bg-[#ad422b]/80 min-[375px]:size-[60px] sm:size-[72px] sm:rounded-[20px]"
                />
                <Image
                  src={menu.image}
                  alt=""
                  width={80}
                  height={80}
                  sizes="(min-width: 640px) 80px, (min-width: 375px) 68px, 64px"
                  className={`absolute -right-1 size-16 max-w-none object-contain min-[375px]:size-[68px] sm:-right-2 sm:size-20 ${menu.href === '/add-ons' ? '-bottom-1.5' : 'bottom-0'}`}
                />
              </span>
              <span className="text-[11px] font-medium tracking-tight text-[#171717] sm:text-xs">
                {menu.title}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
