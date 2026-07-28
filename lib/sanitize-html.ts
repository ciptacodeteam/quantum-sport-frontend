import DOMPurify from 'isomorphic-dompurify';

/** Sanitize CMS / rich-text HTML before rendering in the DOM. */
export function sanitizeHtml(html: string): string {
  if (!html) return '';

  return DOMPurify.sanitize(html, {
    USE_PROFILES: { html: true }
  });
}
