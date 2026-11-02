import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import type { PropsWithChildren } from 'react';

const mocks = vi.hoisted(() => ({ user: { id: 'staff-1', mustChangePassword: true } }));
vi.mock('@tanstack/react-query', () => ({
  useQuery: () => ({
    data: mocks.user,
    isPending: false,
    isError: false
  }),
  useQueryClient: () => ({ clear: vi.fn() })
}));
vi.mock('@/queries/admin/auth', () => ({ adminProfileQueryOptions: {} }));
vi.mock('@/lib/admin-session', () => ({
  hasAdminSessionCookie: () => true,
  clearAdminSessionCookie: vi.fn()
}));
vi.mock('next/navigation', () => ({ useRouter: () => ({ replace: vi.fn() }) }));
vi.mock('@/components/admin/forms/RequiredPasswordChange', () => ({
  default: () => <div>Required password change</div>
}));
vi.mock('@/components/ui/app-dashboard-header', () => ({ default: () => null }));
vi.mock('@/components/ui/app-sidebar', () => ({ AppSidebar: () => null }));
vi.mock('@/components/ui/sidebar', () => ({
  SidebarProvider: ({ children }: PropsWithChildren) => <div>{children}</div>,
  SidebarInset: ({ children }: PropsWithChildren) => <div>{children}</div>
}));
import Layout from './layout';

beforeEach(() => {
  mocks.user = { id: 'staff-1', mustChangePassword: true };
});
afterEach(() => cleanup());

it('withholds dashboard content until the required password change is complete', () => {
  render(
    <Layout>
      <div>Private dashboard</div>
    </Layout>
  );
  expect(screen.getByText('Required password change')).toBeInTheDocument();
  expect(screen.queryByText('Private dashboard')).not.toBeInTheDocument();
});

it('renders dashboard content for an account without a pending password change', () => {
  mocks.user = { id: 'staff-1', mustChangePassword: false };
  render(
    <Layout>
      <div>Private dashboard</div>
    </Layout>
  );
  expect(screen.getByText('Private dashboard')).toBeInTheDocument();
});
