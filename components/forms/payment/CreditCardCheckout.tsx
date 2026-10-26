'use client';

import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getCardToken } from '@/lib/midtrans';
import { cardCheckoutMutationOptions } from '@/mutations/payment';
import type { CardCheckoutPayload, CreditCard } from '@/types/model';
import { useMutation } from '@tanstack/react-query';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import CreditCardForm, { type CreditCardFormData } from './CreditCardForm';
import SavedCardSelector from './SavedCardSelector';

interface CreditCardCheckoutProps {
  paymentMethodId: string;
  courtSlots?: string[];
  coachSlots?: string[];
  ballboySlots?: string[];
  inventories?: Array<{ inventoryId: string; quantity: number; courtSlotId?: string }>;
  onSuccess?: (data: any) => void;
  onError?: (error: any) => void;
  totalAmount?: number;
  userEmail?: string;
  userPhoneNumber?: string;
  userName?: string;
  userLastName?: string;
}

/**
 * Credit Card Checkout Component
 * Handles both new card entry and saved card selection
 * Card numbers are tokenized in the browser. The server charges that token with 3DS.
 */
export default function CreditCardCheckout({
  paymentMethodId,
  courtSlots,
  coachSlots,
  ballboySlots,
  inventories,
  onSuccess,
  onError,
  totalAmount = 0,
  userEmail,
  userPhoneNumber
}: CreditCardCheckoutProps) {
  const [useNewCard, setUseNewCard] = useState(false);
  const [selectedCard, setSelectedCard] = useState<CreditCard | null>(null);
  const [selectedCvv, setSelectedCvv] = useState('');

  const [isTokenizingCard, setTokenizingCard] = useState(false);

  const checkoutMutation = useMutation(cardCheckoutMutationOptions({ onSuccess, onError }));

  // Handle new card submission with Payment Session flow
  const handleNewCardSubmit = useCallback(
    async (data: CreditCardFormData) => {
      setTokenizingCard(true);
      try {
        const tokenId = await getCardToken({
          cardNumber: data.cardNumber,
          expiryMonth: data.expiryMonth,
          expiryYear: data.expiryYear,
          cvv: data.cvv
        });
        const payload: CardCheckoutPayload = {
          paymentMethodId,
          cardPayment: { tokenId, saveCard: data.saveCard || false }
        };
        if (courtSlots && courtSlots.length > 0) payload.courtSlots = courtSlots;
        if (coachSlots && coachSlots.length > 0) payload.coachSlots = coachSlots;
        if (ballboySlots && ballboySlots.length > 0) payload.ballboySlots = ballboySlots;
        if (inventories && inventories.length > 0) payload.inventories = inventories;

        const response = await checkoutMutation.mutateAsync(payload);
        if (response.paymentUrl && response.paymentStatus !== 'PAID') {
          window.location.href = response.paymentUrl;
        }
      } catch (err: any) {
        toast.error(err.message || 'Payment initialization failed. Please try again.');
        checkoutMutation.reset();
      } finally {
        setTokenizingCard(false);
      }
    },
    [paymentMethodId, courtSlots, coachSlots, ballboySlots, inventories, checkoutMutation]
  );

  // Handle saved card submission
  const handleSavedCardSubmit = useCallback(async () => {
    if (!selectedCard || !selectedCvv) {
      toast.error('Please select a card and enter CVV');
      return;
    }

    try {
      const payload: CardCheckoutPayload = {
        paymentMethodId,
        cardPayment: {
          savedCardId: selectedCard.id,
          cvv: selectedCvv
        }
      };

      if (courtSlots && courtSlots.length > 0) {
        payload.courtSlots = courtSlots;
      }
      if (coachSlots && coachSlots.length > 0) {
        payload.coachSlots = coachSlots;
      }
      if (ballboySlots && ballboySlots.length > 0) {
        payload.ballboySlots = ballboySlots;
      }
      if (inventories && inventories.length > 0) {
        payload.inventories = inventories;
      }

      await checkoutMutation.mutateAsync(payload);
    } catch (err) {
      console.error('Checkout error:', err);
    }
  }, [
    selectedCard,
    selectedCvv,
    paymentMethodId,
    courtSlots,
    coachSlots,
    ballboySlots,
    inventories,
    checkoutMutation
  ]);

  return (
    <div className="space-y-6">
      {/* Security notice */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
        <p className="text-sm text-blue-700">
          <strong>🔒 Your payment is secure.</strong> Card details are collected using Xendit
          Payment Session and processed securely. 3D Secure authentication will be required for
          additional security.
        </p>
      </div>

      <Tabs
        defaultValue="new-card"
        className="w-full"
        onValueChange={(value) => setUseNewCard(value === 'new-card')}
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="new-card">New Card</TabsTrigger>
          <TabsTrigger value="saved-cards">Saved Cards</TabsTrigger>
        </TabsList>

        {/* New Card Tab */}
        <TabsContent value="new-card" className="space-y-4">
          <CreditCardForm
            onSubmit={handleNewCardSubmit}
            isLoading={isTokenizingCard || checkoutMutation.isPending}
            showSaveOption={true}
            submitButtonText="Pay Now"
            initialEmail={userEmail}
            initialPhoneNumber={userPhoneNumber}
          />
        </TabsContent>

        {/* Saved Cards Tab */}
        <TabsContent value="saved-cards" className="space-y-4">
          <SavedCardSelector
            onCardSelect={(card, cvv) => {
              setSelectedCard(card);
              setSelectedCvv(cvv);
            }}
            onAddNewCard={() => {
              // This would trigger switching to new card tab
              // The parent component or tabs would handle this
            }}
            isLoading={checkoutMutation.isPending}
          />
          <Button
            onClick={handleSavedCardSubmit}
            className="w-full"
            disabled={checkoutMutation.isPending || !selectedCard || selectedCvv.length < 3}
            loading={checkoutMutation.isPending}
          >
            Pay Now
          </Button>
        </TabsContent>
      </Tabs>

      {/* Error message */}
      {checkoutMutation.error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-700">
            {(checkoutMutation.error as any)?.message || 'An error occurred. Please try again.'}
          </p>
        </div>
      )}

      {/* Amount display */}
      {totalAmount && (
        <div className="bg-primary/5 rounded-lg p-4 text-center">
          <p className="text-muted-foreground text-sm">Total Amount</p>
          <p className="text-primary text-2xl font-bold">
            Rp {totalAmount.toLocaleString('id-ID')}
          </p>
        </div>
      )}
    </div>
  );
}
