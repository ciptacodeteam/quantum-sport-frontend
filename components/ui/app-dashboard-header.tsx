import AdminBranchControl from '@/components/branches/AdminBranchControl';
import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';
import AppBreadcrumb from './app-breadcrumb';
import AppNotificationDropdown from './app-notification-dropdown';
import AppProfileMenu from './app-profile-menu';

const AppDashboardHeader = () => {
  return (
    <header className="flex min-h-16 min-w-0 shrink-0 flex-wrap items-center justify-between gap-3 border-b px-4 py-3">
      <div className="flex min-w-0 items-center gap-2">
        <SidebarTrigger className="-ml-1 size-11" />
        <Separator
          orientation="vertical"
          className="mr-2 hidden data-[orientation=vertical]:h-4 lg:inline-flex"
        />
        <div className="hidden 2xl:block">
          <AppBreadcrumb />
        </div>
      </div>
      <div className="flex max-w-full min-w-0 flex-wrap items-center gap-2">
        <AdminBranchControl />
        <AppNotificationDropdown />
        <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
        <AppProfileMenu />
      </div>
    </header>
  );
};
export default AppDashboardHeader;
