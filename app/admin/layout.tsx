'use client';

import { useLayoutEffect, type PropsWithChildren } from 'react';

export default function AdminThemeLayout({ children }: PropsWithChildren) {
  useLayoutEffect(() => {
    // Radix menus and dialogs render outside this layout through portals.
    const root = document.documentElement;
    const previous = root.getAttribute('data-admin-theme');
    root.setAttribute('data-admin-theme', 'true');
    return () => {
      if (previous === null) root.removeAttribute('data-admin-theme');
      else root.setAttribute('data-admin-theme', previous);
    };
  }, []);

  return <div className="admin-theme min-h-dvh min-w-0">{children}</div>;
}
