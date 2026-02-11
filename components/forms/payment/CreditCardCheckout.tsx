'use client';

import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useXenditCardCollection } from '@/hooks/useXenditTokenization';
import { cardCheckoutMutationOptions } from '@/mutations/payment';
import type { CardCheckoutPayload, CreditCard } from '@/types/model';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import CreditCardForm, { type CreditCardFormData } from './CreditCardForm';
import SavedCardSelector from './SavedCardSelector';

interface CreditCardCheckoutProps {
  paymentMethodId: string;
  courtSlots?: string[];
  coachSlots?: string[];
  ballboySlots?: string[];
  inventories?: Array<{ inventoryId: string; quantity: number }>;
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
 * Uses Xendit Payment Session for card collection and 3DS
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
  userPhoneNumber,
  userName,
  userLastName
}: CreditCardCheckoutProps) {
  const router = useRouter();
  const [useNewCard, setUseNewCard] = useState(false);
  const [selectedCard, setSelectedCard] = useState<CreditCard | null>(null);
  const [selectedCvv, setSelectedCvv] = useState('');

  const {
    collectCard,
    isLoading: isCollectingCard,
    error: collectionError
  } = useXenditCardCollection();

  const checkoutMutation = useMutation(cardCheckoutMutationOptions({ onSuccess, onError }));

  // Handle new card submission with Payment Session flow
  const handleNewCardSubmit = useCallback(
    async (data: CreditCardFormData) => {
      try {
        // Step 1: Create Payment Session on backend
        const payload: CardCheckoutPayload = {
          paymentMethodId,
          cardPayment: {
            saveCard: data.saveCard || false
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

        // Backend creates Payment Session and returns paymentSessionId
        await checkoutMutation.mutateAsync(payload, {
          onSuccess: async (response: any): Promise<void> => {
            try {
              // Step 2: Collect card data using Payment Session
              if (response.data?.paymentSessionId) {
                const cardResult = await collectCard({
                  paymentSessionId: response.data.paymentSessionId,
                  cardNumber: data.cardNumber,
                  expiryMonth: data.expiryMonth,
                  expiryYear: data.expiryYear,
                  cvv: data.cvv,
                  cardholderFirstName: userName || 'Cardholder',
                  cardholderLastName: userLastName || 'User',
                  cardholderEmail: userEmail,
                  cardholderPhoneNumber: userPhoneNumber
                });

                // Step 3: Redirect to 3DS authentication
                if (cardResult.actionUrl) {
                  console.log('Redirecting to 3DS:', cardResult.actionUrl);
                  router.push(cardResult.actionUrl);
                  return;
                }
              }
            } catch (cardError: any) {
              // Card collection failed - abort the flow
              console.error('Card collection failed:', cardError);
              toast.error(cardError.message || 'Card processing failed. Please try again.');

              // Cancel booking and payment session
              void (async () => {
                try {
                  const invoiceId = response.data?.invoiceNumber || response.data?.invoiceId;
                  const sessionId = response.data?.paymentSessionId;

                  // Cancel booking if invoice was created
                  if (invoiceId) {
                    console.log('Cancelling booking:', invoiceId);
                    const { cancelBookingApi } = await import('@/api/booking');
                    await cancelBookingApi(invoiceId, {
                      reason: 'Card payment processing failed'
                    });
                    console.log('Booking cancelled successfully');
                  }

                  // Cancel payment session
                  if (sessionId) {
                    console.log('Cancelling payment session:', sessionId);
                    const { cancelPaymentSession } = await import('@/api/payment-session');
                    await cancelPaymentSession({ sessionId });
                    console.log('Payment session cancelled successfully');
                  }
                } catch (cancelErr) {
                  console.error('Failed to cancel booking/session:', cancelErr);
                  // Don't show error to user - the main error is already shown
                }
              })();

              // Reset mutation to allow retry
              checkoutMutation.reset();

              // Cancel the checkout flow - don't proceed
              throw cardError;
            }
          }
        });
      } catch (err: any) {
        console.error('Card collection or checkout error:', err);
        toast.error(err.message || 'Payment initialization failed. Please try again.');

        // Ensure mutation is reset for retry
        checkoutMutation.reset();
      }
    },
    [
      collectCard,
      paymentMethodId,
      courtSlots,
      coachSlots,
      ballboySlots,
      inventories,
      checkoutMutation
    ]
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

      {/* Collection error */}
      {collectionError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-700">{collectionError}</p>
        </div>
      )}

      {/* Tabs for new card vs saved cards */}
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
            isLoading={isCollectingCard || checkoutMutation.isPending}
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
