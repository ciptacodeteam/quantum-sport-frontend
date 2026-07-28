'use client';

import { sanitizeHtml } from '@/lib/sanitize-html';
import type { HTMLAttributes } from 'react';

type Props = HTMLAttributes<HTMLDivElement> & {
  html: string;
};

export function SanitizedHtml({ html, className, ...rest }: Props) {
  const safeHtml = sanitizeHtml(html);

  return (
    <div className={className} {...rest} dangerouslySetInnerHTML={{ __html: safeHtml }} />
  );
}
