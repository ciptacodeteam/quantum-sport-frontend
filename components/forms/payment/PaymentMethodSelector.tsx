'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn, resolveMediaUrl } from '@/lib/utils';
import type { PaymentMethod } from '@/types/model';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import CreditCardCheckout from './CreditCardCheckout';
import { Button } from '@/components/ui/button';

interface PaymentMethodSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  paymentMethods: PaymentMethod[];
  selectedMethod: PaymentMethod | null;
  onMethodSelect: (method: PaymentMethod) => void;
  // Credit card specific props
  courtSlots?: string[];
  coachSlots?: string[];
  ballboySlots?: string[];
  inventories?: Array<{ inventoryId: string; quantity: number }>;
  totalAmount?: number;
}

/**
 * Payment method selector dialog
 * Shows available payment methods with option to enter credit card details
 */
export default function PaymentMethodSelector({
  isOpen,
  onClose,
  paymentMethods,
  selectedMethod,
  onMethodSelect,
  courtSlots,
  coachSlots,
  ballboySlots,
  inventories,
  totalAmount
}: PaymentMethodSelectorProps) {
  const [showCreditCardForm, setShowCreditCardForm] = useState(false);
  const creditCardMethod = paymentMethods.find((m) => m.channel === 'CARDS');

  const handleSelectMethod = (method: PaymentMethod) => {
    if (method.channel === 'CARDS') {
      // Show credit card form instead of closing dialog
      setShowCreditCardForm(true);
    } else {
      onMethodSelect(method);
      onClose();
    }
  };

  const handleCreditCardSuccess = () => {
    onClose();
    setShowCreditCardForm(false);
  };

  // Reset form when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setShowCreditCardForm(false);
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {showCreditCardForm ? 'Pay with Credit Card' : 'Select Payment Method'}
          </DialogTitle>
        </DialogHeader>

        {!showCreditCardForm ? (
          // Payment methods list
          <div className="grid gap-3 py-4">
            {paymentMethods.map((method) => (
              <button
                key={method.id}
                onClick={() => handleSelectMethod(method)}
                className={cn(
                  'hover:border-primary hover:bg-primary/5 flex items-center gap-4 rounded-lg border-2 p-4 text-left transition-colors',
                  selectedMethod?.id === method.id && !showCreditCardForm
                    ? 'border-primary bg-primary/10'
                    : 'border-muted'
                )}
              >
                {/* Method Logo/Icon */}
                <div className="bg-muted flex h-12 w-12 items-center justify-center rounded-lg">
                  {method.logo ? (
                    <Image
                      src={resolveMediaUrl(method.logo) as string}
                      alt={method.name}
                      width={48}
                      height={48}
                      className="object-contain"
                    />
                  ) : (
                    <span className="text-muted-foreground text-sm font-semibold">
                      {method.name.slice(0, 2).toUpperCase()}
                    </span>
                  )}
                </div>

                {/* Method Details */}
                <div className="flex-1">
                  <div className="font-semibold">{method.name}</div>
                  <div className="text-muted-foreground text-sm">
                    {method.fees > 0 || parseFloat(method.percentage || '0') > 0 ? (
                      <>
                        Fee: {method.fees > 0 && `Rp${method.fees.toLocaleString('id-ID')}`}
                        {method.fees > 0 && parseFloat(method.percentage || '0') > 0 && ' + '}
                        {parseFloat(method.percentage || '0') > 0 && `${method.percentage}%`}
                      </>
                    ) : (
                      'No additional fees'
                    )}
                  </div>
                </div>

                {/* Selection indicator */}
                <div
                  className={cn(
                    'flex h-5 w-5 items-center justify-center rounded-full border-2',
                    selectedMethod?.id === method.id && !showCreditCardForm
                      ? 'border-primary bg-primary'
                      : 'border-muted-foreground'
                  )}
                >
                  {selectedMethod?.id === method.id && !showCreditCardForm && (
                    <div className="h-2 w-2 rounded-full bg-white"></div>
                  )}
                </div>
              </button>
            ))}
          </div>
        ) : creditCardMethod ? (
          // Credit card checkout form
          <div className="py-4">
            <CreditCardCheckout
              paymentMethodId={creditCardMethod.id}
              courtSlots={courtSlots}
              coachSlots={coachSlots}
              ballboySlots={ballboySlots}
              inventories={inventories}
              totalAmount={totalAmount}
              onSuccess={handleCreditCardSuccess}
            />
          </div>
        ) : null}

        {/* Action buttons */}
        {!showCreditCardForm && (
          <div className="flex gap-3 border-t pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => {
                if (selectedMethod) {
                  onMethodSelect(selectedMethod);
                  onClose();
                }
              }}
              disabled={!selectedMethod}
              className="flex-1"
            >
              Continue
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
