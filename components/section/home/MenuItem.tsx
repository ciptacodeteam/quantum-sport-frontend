import { type MenuItem } from '@/types';
import Link from 'next/link';

type Props = {
  item: MenuItem;
};

const MenuItem = ({ item }: Props) => {
  return (
    <Link
      href={item.url}
      prefetch
      className="group/menu flex flex-col items-center gap-2 lg:h-full lg:w-full"
    >
      <div className="bg-muted lg:hover:border-primary/40 flex h-16 w-16 items-center justify-center rounded-xl text-2xl lg:h-full lg:w-full lg:flex-col lg:items-start lg:justify-start lg:gap-3 lg:rounded-lg lg:border lg:bg-white lg:p-4 lg:transition-all lg:duration-300 lg:ease-out lg:hover:-translate-y-1 lg:hover:shadow-md">
        <div className="lg:bg-muted group-hover/menu:scale-105 lg:me-3 lg:mb-2 lg:flex lg:h-16 lg:w-16 lg:items-center lg:justify-center lg:rounded-lg lg:p-2 lg:transition-transform lg:duration-300 lg:ease-out">
          {item.icon}
        </div>

        <div>
          <span className="text-primary mb-1 hidden text-left font-semibold lg:block">
            {item.title}
          </span>
          <span className="text-muted-foreground hidden text-left text-sm lg:block">
            {item.subtitle}
          </span>
        </div>
      </div>

      {/* MOBILE TITLE tetap di luar */}
      <span className="text-sm lg:hidden">{item.title}</span>
    </Link>
  );
};

export default MenuItem;
