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
        'mb-4 flex flex-col flex-wrap items-start justify-between gap-3 pb-4 sm:flex-row sm:items-center',
        withBorder && 'border-b',
        className
      )}
    >
      <div className="flex min-w-0 flex-col sm:min-w-48 sm:flex-1">
        <h2 className="mb-1 text-lg font-semibold">{title}</h2>
        {description && <p className="text-sm text-gray-600">{description}</p>}
      </div>
      {children && <div className="w-full max-w-full sm:w-auto">{children}</div>}
    </header>
  );
};
export default AppSectionHeader;
