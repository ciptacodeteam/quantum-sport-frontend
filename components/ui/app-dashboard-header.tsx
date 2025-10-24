import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';
import AppBreadcrumb from './app-breadcrumb';
import AppNotificationDropdown from './app-notification-dropdown';
import AppProfileMenu from './app-profile-menu';

const AppDashboardHeader = () => {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b">
      <div className="flex items-center gap-2 px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mr-2 hidden data-[orientation=vertical]:h-4 lg:inline-flex"
        />
        <div className="hidden lg:block">
          <AppBreadcrumb />
        </div>
      </div>
      <div className="flex items-center gap-2 px-4">
        <AppNotificationDropdown />
        <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
        <AppProfileMenu />
      </div>
    </header>
  );
};
export default AppDashboardHeader;
