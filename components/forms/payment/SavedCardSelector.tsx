'use client';

import { listCreditCardsApi } from '@/api/credit-cards';
import { Button } from '@/components/ui/button';
import { Field, FieldError, FieldGroup, FieldLabel, FieldSet } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Spinner } from '@/components/ui/spinner';
import type { CreditCard } from '@/types/model';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

interface SavedCardSelectorProps {
  onCardSelect: (card: CreditCard, cvv: string) => void;
  onAddNewCard?: () => void;
  selectedCardId?: string;
  isLoading?: boolean;
}

/**
 * Component to select or manage saved credit cards
 */
export default function SavedCardSelector({
  onCardSelect,
  onAddNewCard,
  // selectedCardId,
  isLoading = false
}: SavedCardSelectorProps) {
  const [selectedCvv, setSelectedCvv] = useState('');
  const [selectedCardId, setSelectedCardId] = useState<string>('');

  // Fetch saved cards
  const {
    data,
    isLoading: isLoadingCards,
    error
  } = useQuery({
    queryKey: ['credit-cards'],
    queryFn: listCreditCardsApi,
    staleTime: 5 * 60 * 1000 // 5 minutes
  });

  const cards = data?.data?.cards || [];

  // Set default card if available
  useEffect(() => {
    if (cards.length > 0 && !selectedCardId) {
      const defaultCard = cards.find((c) => c.isDefault) || cards[0];
      setSelectedCardId(defaultCard.id);
    }
  }, [cards, selectedCardId]);

  const handleCardSelect = (cardId: string) => {
    setSelectedCardId(cardId);
    setSelectedCvv('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedCard = cards.find((c) => c.id === selectedCardId);
    if (selectedCard && selectedCvv) {
      onCardSelect(selectedCard, selectedCvv);
    }
  };

  const handleCVVChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 4);
    setSelectedCvv(value);
  };

  if (isLoadingCards) {
    return (
      <div className="flex items-center justify-center py-8">
        <Spinner className="h-5 w-5" />
        <span className="text-muted-foreground ml-2 text-sm">Loading saved cards...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-destructive/10 text-destructive rounded-lg p-4 text-sm">
        Failed to load saved cards. Please try again.
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-muted-foreground mb-4 text-sm">Tidak ada kartu tersimpan.</p>
        {onAddNewCard && (
          <Button type="button" variant="outline" onClick={onAddNewCard}>
            Tambah Kartu Baru
          </Button>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <FieldSet>
        <FieldGroup>
          {/* Card Selection */}
          <Field>
            <FieldLabel>Select Card</FieldLabel>
            <RadioGroup
              value={selectedCardId}
              onValueChange={handleCardSelect}
              className="space-y-3"
            >
              {cards.map((card) => (
                <div
                  key={card.id}
                  className="border-input hover:bg-accent flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors"
                >
                  <RadioGroupItem value={card.id} id={`card-${card.id}`} />
                  <label htmlFor={`card-${card.id}`} className="flex-1 cursor-pointer">
                    <div className="text-sm font-medium">
                      {card.cardBrand} ending in {card.last4}
                    </div>
                    <div className="text-muted-foreground text-xs">
                      Expires {String(card.expMonth).padStart(2, '0')}/
                      {String(card.expYear).slice(-2)}
                      {card.isDefault && ' • Default'}
                    </div>
                  </label>
                </div>
              ))}
            </RadioGroup>
          </Field>

          {/* CVV Input */}
          {selectedCardId && (
            <Field>
              <FieldLabel htmlFor="savedCardCvv">
                CVV <span className="text-destructive">*</span>
              </FieldLabel>
              <Input
                id="savedCardCvv"
                type="password"
                placeholder="123"
                maxLength={4}
                value={selectedCvv}
                onChange={handleCVVChange}
                disabled={isLoading}
                autoComplete="off"
              />
              <p className="text-muted-foreground mt-1 text-xs">
                Enter the 3-4 digit code on the back of your card
              </p>
              {selectedCvv.length < 3 && selectedCvv.length > 0 && (
                <FieldError>CVV must be 3 or 4 digits</FieldError>
              )}
            </Field>
          )}

          {/* Add New Card Button */}
          {onAddNewCard && (
            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={onAddNewCard}
                className="text-primary text-sm hover:underline"
              >
                Use a different card
              </button>
            </div>
          )}
        </FieldGroup>
      </FieldSet>

      {/* Submit Button */}
      <Button
        type="submit"
        className="w-full"
        disabled={isLoading || !selectedCardId || selectedCvv.length < 3}
        loading={isLoading}
      >
        Continue with {cards.find((c) => c.id === selectedCardId)?.cardBrand} ••••{' '}
        {cards.find((c) => c.id === selectedCardId)?.last4}
      </Button>
    </form>
  );
}
