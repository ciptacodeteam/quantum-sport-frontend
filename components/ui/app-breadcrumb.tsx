'use client';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from '@/components/ui/breadcrumb';
import { usePathname } from 'next/navigation';
import { Fragment } from 'react';

const AppBreadcrumb = () => {
  const pathname = usePathname();

  const breadcrumbs = pathname.split('/').filter((segment) => segment);

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {breadcrumbs.map((segment, index) => {
          const href = '/' + breadcrumbs.slice(0, index + 1).join('/');
          const isLast = index === breadcrumbs.length - 1;
          const name = segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');
          return (
            <Fragment key={href}>
              <BreadcrumbItem isCurrentPage={isLast}>
                {isLast ? (
                  <BreadcrumbPage>{name}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink href={href}>{name}</BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {!isLast && <BreadcrumbSeparator />}
            </Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
};
export default AppBreadcrumb;
