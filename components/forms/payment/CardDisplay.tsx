'use client';

import { useMemo } from 'react';

interface CardDisplayProps {
  cardNumber: string;
  cardholderName: string;
  expiryMonth: number;
  expiryYear: number;
}

/**
 * Displays a visual preview of the credit card being entered
 */
export default function CardDisplay({
  cardNumber,
  cardholderName,
  expiryMonth,
  expiryYear
}: CardDisplayProps) {
  // Detect card brand based on card number
  const cardBrand = useMemo(() => {
    const num = cardNumber.replace(/\s/g, '');
    if (/^4/.test(num)) return 'VISA';
    if (/^5[1-5]/.test(num)) return 'MASTERCARD';
    if (/^3[47]/.test(num)) return 'AMEX';
    if (/^6(?:011|5)/.test(num)) return 'DISCOVER';
    return 'CARD';
  }, [cardNumber]);

  // Format expiry display
  const expiryDisplay = useMemo(() => {
    return `${String(expiryMonth).padStart(2, '0')}/${String(expiryYear).slice(-2)}`;
  }, [expiryMonth, expiryYear]);

  // Mask card number display
  const maskedCardNumber = useMemo(() => {
    if (!cardNumber) return '•••• •••• •••• ••••';
    const num = cardNumber.replace(/\s/g, '');
    if (num.length < 4) return cardNumber;
    const last4 = num.slice(-4);
    const masked = '•••• •••• •••• ' + last4;
    return masked;
  }, [cardNumber]);

  return (
    <div className="relative mx-auto mb-6 h-48 w-full max-w-sm">
      {/* Card Container */}
      <div
        className="relative h-full w-full transform overflow-hidden rounded-xl shadow-xl transition-transform"
        style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          perspective: '1000px'
        }}
      >
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 -mt-16 -mr-16 h-32 w-32 rounded-full bg-white opacity-10"></div>
        <div className="absolute bottom-0 left-0 -mb-20 -ml-20 h-40 w-40 rounded-full bg-white opacity-5"></div>

        {/* Card Content */}
        <div className="relative z-10 flex h-full flex-col justify-between p-6 text-white">
          {/* Header with card brand */}
          <div className="flex items-start justify-between">
            <span className="text-sm font-semibold tracking-wider">{cardBrand}</span>
            <span className="font-mono text-xs">{cardBrand === 'AMEX' ? '••••' : '••••'}</span>
          </div>

          {/* Card Number */}
          <div className="space-y-4">
            <div className="font-mono text-xl font-light tracking-widest">{maskedCardNumber}</div>

            {/* Footer with cardholder and expiry */}
            <div className="flex items-end justify-between text-xs">
              <div>
                <div className="mb-1 text-xs text-gray-300">CARD HOLDER</div>
                <div className="max-w-[180px] truncate font-semibold">
                  {cardholderName || 'YOUR NAME'}
                </div>
              </div>
              <div>
                <div className="mb-1 text-xs text-gray-300">EXPIRES</div>
                <div className="font-mono font-semibold">{expiryDisplay}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
