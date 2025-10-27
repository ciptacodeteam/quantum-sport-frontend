import { Skeleton } from '@/components/ui/skeleton';

const loading = () => {
  return (
    <div className="flex flex-col gap-4">
      <Skeleton className="h-6 w-1/3 rounded-md" />
      <Skeleton className="h-10 w-full rounded-md" />
      <Skeleton className="h-10 w-full rounded-md" />
      <Skeleton className="h-10 w-full rounded-md" />
    </div>
  );
};
export default loading;
