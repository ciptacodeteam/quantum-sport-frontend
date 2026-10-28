import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import AdminThemeLayout from './layout';

afterEach(() => {
  cleanup();
  document.documentElement.removeAttribute('data-admin-theme');
});

it('enables the admin palette for portals and removes it when leaving admin', () => {
  const { unmount } = render(
    <AdminThemeLayout>
      <p>Admin content</p>
    </AdminThemeLayout>
  );
  expect(document.documentElement).toHaveAttribute('data-admin-theme', 'true');
  expect(screen.getByText('Admin content')).toBeInTheDocument();
  unmount();
  expect(document.documentElement).not.toHaveAttribute('data-admin-theme');
});

it('restores the existing document theme state on cleanup', () => {
  document.documentElement.setAttribute('data-admin-theme', 'previous');
  const { unmount } = render(
    <AdminThemeLayout>
      <p>Admin content</p>
    </AdminThemeLayout>
  );
  unmount();
  expect(document.documentElement).toHaveAttribute('data-admin-theme', 'previous');
});
