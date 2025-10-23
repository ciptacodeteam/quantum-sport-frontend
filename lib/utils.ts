import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getPlaceholderImageUrl({
  width = 400,
  height = 300,
  text = 'Placeholder Image'
}: {
  width?: number;
  height?: number;
  text?: string;
} = {}): string {
  const encodedText = encodeURIComponent(text);
  return `https://placehold.co/${width}x${height}?text=${encodedText}`;
}

export function whatsappMessageFormatter(message: string) {
  return encodeURIComponent(message);
}

export function sendWhatsappMessage(phoneNumber: string, message: string) {
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${whatsappMessageFormatter(message)}`;
  window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
}

export function getWhatsappMessageUrl(phoneNumber: string, message: string) {
  return `https://wa.me/${phoneNumber}?text=${whatsappMessageFormatter(message)}`;
}

export function formatNumber(value: number, locale = 'id-ID'): string {
  return new Intl.NumberFormat(locale).format(value);
}

export function formatPhone(phone: string | null) {
  if (!phone) return '';

  // Remove spaces, dashes, and parentheses
  const cleaned = phone.replace(/[\s\-()]/g, '');

  // Handle numbers starting with '+62'
  if (cleaned.startsWith('+62')) {
    return cleaned;
  }

  // Handle numbers starting with '62'
  if (cleaned.startsWith('62')) {
    return `+${cleaned}`;
  }

  // Handle numbers starting with '08'
  if (cleaned.startsWith('08')) {
    return `+62${cleaned.slice(1)}`;
  }

  // Default: just add '+'
  if (!cleaned.startsWith('+')) {
    return `+${cleaned}`;
  }

  return cleaned;
}
