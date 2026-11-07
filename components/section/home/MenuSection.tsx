import Image from 'next/image';
import BranchLink from '@/components/branches/BranchLink';

const menus = [
  { title: 'Padel', href: '/booking', image: '/assets/icons/mobile-menu/padel-2d.svg' },
  { title: 'Tennis', href: '/booking/tennis', image: '/assets/icons/mobile-menu/tennis-2d.svg' },
  {
    title: 'Value Pack',
    href: '/membership',
    image: '/assets/icons/mobile-menu/value-pack-2d.svg'
  },
  { title: 'Add-ons', href: '/add-ons', image: '/assets/icons/mobile-menu/ballboy-2d.svg' }
];

export default function MenuSection() {
  return (
    <nav aria-label="Menu olahraga" className="py-6 lg:hidden">
      <ul className="mx-auto grid max-w-md grid-cols-4 gap-2">
        {menus.map((menu) => (
          <li key={menu.href}>
            <BranchLink
              href={menu.href}
              className="group flex min-h-28 flex-col items-center justify-center gap-2.5 rounded-2xl text-center focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ad422b]"
            >
              <span className="flex size-14 items-center justify-center rounded-2xl bg-black transition-transform duration-200 group-hover:-translate-y-1 group-active:scale-95 motion-reduce:transform-none min-[375px]:size-[60px] sm:size-[72px] sm:rounded-[20px]">
                <Image
                  src={menu.image}
                  alt=""
                  width={48}
                  height={48}
                  className="size-10 object-contain min-[375px]:size-11 sm:size-[52px]"
                />
              </span>
              <span className="text-[11px] font-medium tracking-tight text-[#171717] sm:text-xs">
                {menu.title}
              </span>
            </BranchLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
