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

export function formatPhone(phone: string | null): string {
  if (!phone) return '';

  // Remove spaces, dashes, and parentheses
  const cleaned = phone.replace(/[\s\-()]/g, '');

  // Normalize Indonesian phone numbers to international format (+62)
  if (cleaned.startsWith('+62')) {
    return cleaned;
  }
  if (cleaned.startsWith('62')) {
    return `+${cleaned}`;
  }
  if (cleaned.startsWith('08')) {
    // Replace leading '08' with '+628'
    return `+62${cleaned.slice(1)}`;
  }
  if (cleaned.startsWith('8')) {
    // Add '+62' prefix for numbers starting with '8'
    return `+62${cleaned}`;
  }
  // Ensure the number starts with '+'
  return cleaned.startsWith('+') ? cleaned : `+${cleaned}`;
}
