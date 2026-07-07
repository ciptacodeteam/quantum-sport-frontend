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
      className="group/menu flex w-full min-w-0 flex-col items-center gap-2 text-center lg:h-full lg:text-left"
    >
      <div className="bg-muted/80 ring-border/60 group-hover/menu:bg-primary/8 group-hover/menu:ring-primary/25 flex h-[58px] w-[58px] items-center justify-center rounded-lg text-2xl ring-1 transition-all duration-300 ease-out group-hover/menu:-translate-y-0.5 group-hover/menu:shadow-sm sm:h-16 sm:w-16 lg:hover:border-primary/40 lg:h-full lg:w-full lg:flex-col lg:items-start lg:justify-start lg:gap-3 lg:rounded-md lg:border lg:bg-white lg:p-4 lg:ring-0 lg:hover:-translate-y-1 lg:hover:shadow-md">
        <div className="flex items-center justify-center transition-transform duration-300 ease-out group-hover/menu:scale-105 lg:bg-muted lg:me-3 lg:mb-2 lg:h-16 lg:w-16 lg:rounded-md lg:p-2">
          {item.icon}
        </div>

        <div className="hidden lg:block">
          <span className="text-primary mb-1 hidden text-left font-semibold lg:block">
            {item.title}
          </span>
          <span className="text-muted-foreground hidden text-left text-sm lg:block">
            {item.subtitle}
          </span>
        </div>
      </div>

      <span className="block min-h-8 max-w-[68px] text-center text-[11px] leading-tight font-medium text-zinc-800 sm:max-w-[76px] sm:text-xs lg:hidden">
        {item.title}
      </span>
    </Link>
  );
};

export default MenuItem;
