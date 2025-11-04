import { cn } from '@/lib/utils';

type Props = {
  children: React.ReactNode;
  wrapperClassName?: string;
  className?: string;
};

const BottomNavigationWrapper = ({ children, wrapperClassName, className }: Props) => {
  return (
    <div className={cn('fixed right-0 bottom-0 left-0 z-40', wrapperClassName)}>
      <div className="flex-center min-h-24 w-full border-t bg-white md:hidden">
        <nav className={cn('w-full max-w-7xl px-4', className)}>{children}</nav>
      </div>
    </div>
  );
};
export default BottomNavigationWrapper;
