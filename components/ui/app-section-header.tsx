import { cn } from '@/lib/utils';

type Props = {
  title: string;
  description?: string;
  children?: React.ReactNode;
  withBorder?: boolean;
  className?: string;
};
const AppSectionHeader = ({ title, description, children, withBorder, className }: Props) => {
  return (
    <header
      className={cn(
        'mb-4 flex flex-col items-start justify-between gap-3 pb-4 sm:flex-row sm:items-center',
        withBorder && 'border-b',
        className
      )}
    >
      <div className="flex flex-col">
        <h2 className="mb-1 text-lg font-semibold">{title}</h2>
        {description && <p className="text-sm text-gray-600">{description}</p>}
      </div>
      {children && <div className="w-full sm:w-auto">{children}</div>}
    </header>
  );
};
export default AppSectionHeader;
