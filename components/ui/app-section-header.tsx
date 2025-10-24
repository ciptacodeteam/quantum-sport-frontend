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
        'mb-4 flex items-center justify-between pb-4',
        withBorder && 'border-b',
        className
      )}
    >
      <div className="flex flex-col">
        <h2 className="mb-1 text-lg font-semibold">{title}</h2>
        {description && <p className="text-sm text-gray-600">{description}</p>}
      </div>
      {children}
    </header>
  );
};
export default AppSectionHeader;
