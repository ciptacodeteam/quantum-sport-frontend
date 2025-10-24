import { type MenuItem } from '@/types';
import Link from 'next/link';

type Props = {
  item: MenuItem;
};

const MenuItem = ({ item }: Props) => {
  return (
    <Link href={item.url} prefetch className="flex flex-col items-center gap-2">
      <div className="bg-muted flex h-16 w-16 items-center justify-center rounded-full text-2xl">
        {item.icon}
      </div>
      <span className="text-sm">{item.title}</span>
    </Link>
  );
};
export default MenuItem;
