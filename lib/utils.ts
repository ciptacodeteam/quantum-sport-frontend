import type { SearchParamsData } from '@/types';
import { clsx, type ClassValue } from 'clsx';
import { jwtDecode } from 'jwt-decode';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function mergedQueryParamUrl(url: string, params: SearchParamsData = {}) {
  const urlParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value != null && value !== '') {
      urlParams.set(key, String(value));
    }
  });

  if (urlParams.toString()) url += `?${urlParams.toString()}`;

  return url;
}

export function getNameInitial(name: string | null | undefined): string {
  if (!name) return 'U';
  return name
    .split(' ')
    .map((n) => n.charAt(0).toUpperCase())
    .join('')
    .slice(0, 2);
}

export function maskText(text: string, unmaskedStart = 2, unmaskedEnd = 2, maskChar = '*'): string {
  if (text.length <= unmaskedStart + unmaskedEnd) {
    return text;
  }
  const start = text.slice(0, unmaskedStart);
  const end = text.slice(-unmaskedEnd);
  const maskedSection = maskChar.repeat(text.length - unmaskedStart - unmaskedEnd);
  return `${start}${maskedSection}${end}`;
}

export function getTwoWordName(fullname: string): string {
  if (!fullname) return '';
  const words = fullname.trim().split(/\s+/);
  if (words.length === 1) return words[0] || '';
  return `${words[0]} ${words[1]}`;
}

export function getPlaceholderImageUrl({
  width = 400,
  height = 300,
  text = 'Placeholder'
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

export function formatCurrency(
  value: number,
  locale = 'id-ID',
  currency: string | null = 'IDR'
): string {
  if (!Number.isFinite(value)) return '-';
  if (!currency) {
    return new Intl.NumberFormat(locale, { minimumFractionDigits: 0 }).format(value);
  }
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0
  }).format(value);
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

export async function isJwtAndDecode(token: string): Promise<{ isJwt: boolean; decoded: any }> {
  if (!token || typeof token !== 'string') {
    return { isJwt: false, decoded: null };
  }
  try {
    const decodedToken = jwtDecode(token);
    // You can add further checks here if needed, e.g., for specific claims
    return { isJwt: true, decoded: decodedToken };
  } catch {
    // This likely means it's not a valid JWT format
    return { isJwt: false, decoded: null };
  }
}

export function isAdminToken(token: string | null): boolean {
  if (!token) return false;
  try {
    const decoded: any = jwtDecode(token);
    // Check if token has admin role
    return decoded?.role === 'ADMIN' || decoded?.role === 'COACH' || decoded?.role === 'BALLBOY';
  } catch {
    return false;
  }
}

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function generateRandomString(length: number): string {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }
  return text.slice(0, maxLength) + '...';
}

export function capitalizeWords(str: string): string {
  return str.replace(/\b\w/g, (char) => char.toUpperCase());
}

export function resolveMediaUrl(path: string | null | undefined): string | null {
  if (!path) return null;

  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? '';
  if (!baseUrl) return path;

  const normalizedBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  const normalizedPath = path.startsWith('/') ? path.slice(1) : path;
  return `${normalizedBase}/${normalizedPath}`;
}
