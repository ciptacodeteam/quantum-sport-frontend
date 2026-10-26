'use client';

import Link from 'next/link';
import type { ComponentProps } from 'react';
import { useBranchStore } from '@/stores/useBranchStore';

// Ask for the playing location when entering a booking or package flow.
export default function BranchLink({ onClick, ...props }: ComponentProps<typeof Link>) {
  const openSelector = useBranchStore((state) => state.openSelector);
  return (
    <Link
      {...props}
      onClick={(event) => {
        onClick?.(event);
        if (
          event.defaultPrevented ||
          event.button !== 0 ||
          event.metaKey ||
          event.ctrlKey ||
          event.shiftKey ||
          event.altKey ||
          (props.target && props.target !== '_self')
        )
          return;
        const href = typeof props.href === 'string' ? props.href : props.href.pathname;
        if (href && /^\/(booking(?:\/tennis)?|membership|add-ons)\/?(?:[?#].*)?$/.test(href)) {
          event.preventDefault();
          openSelector(href);
        }
      }}
    />
  );
}
