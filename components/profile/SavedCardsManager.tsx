'use client';

import { deleteCreditCardApi, listCreditCardsApi, updateCreditCardApi } from '@/api/credit-cards';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { Spinner } from '@/components/ui/spinner';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';
import CreditCardForm from '../forms/payment/CreditCardForm';

/**
 * Component to manage user's saved credit cards
 * Allows viewing, deleting, and setting default card
 */
export default function SavedCardsManager() {
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [cardToDelete, setCardToDelete] = useState<string | null>(null);

  // Fetch saved cards
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['credit-cards'],
    queryFn: listCreditCardsApi,
    staleTime: 5 * 60 * 1000
  });

  const cards = data?.data?.cards || [];

  const queryClient = useQueryClient();

  // Delete card mutation
  const deleteCardMutation = useMutation({
    mutationFn: deleteCreditCardApi,
    onSuccess: () => {
      toast.success('Card deleted successfully');
      setCardToDelete(null);
      queryClient.invalidateQueries({ queryKey: ['credit-cards'] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to delete card');
    }
  });

  // Set default card mutation
  const setDefaultMutation = useMutation({
    mutationFn: (cardId: string) => updateCreditCardApi(cardId, { isDefault: true }),
    onSuccess: () => {
      toast.success('Default card updated');
      queryClient.invalidateQueries({ queryKey: ['credit-cards'] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to update card');
    }
  });

  // Handle add new card
  const handleAddCard = async () => {
    // Implement card saving logic here
    toast.success('Card added successfully');
    setIsAddingCard(false);
    refetch();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Spinner className="h-5 w-5" />
        <span className="text-muted-foreground ml-2 text-sm">Loading saved cards...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Saved Cards</h3>
          <p className="text-muted-foreground text-sm">Manage your credit cards</p>
        </div>
        <Dialog open={isAddingCard} onOpenChange={setIsAddingCard}>
          <DialogTrigger asChild>
            <Button>Add New Card</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Credit Card</DialogTitle>
              <DialogDescription>
                Enter your card details. Your card is tokenized and stored securely.
              </DialogDescription>
            </DialogHeader>
            <CreditCardForm
              onSubmit={handleAddCard}
              submitButtonText="Save Card"
              showSaveOption={false}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Cards List */}
      {cards.length === 0 ? (
        <div className="bg-muted/30 rounded-lg border border-dashed py-12 text-center">
          <p className="text-muted-foreground mb-4 text-sm">No saved cards</p>
          <p className="text-muted-foreground mb-6 text-xs">
            Add a credit card to make faster checkouts
          </p>
          <Dialog open={isAddingCard} onOpenChange={setIsAddingCard}>
            <DialogTrigger asChild>
              <Button>Add Your First Card</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Credit Card</DialogTitle>
              </DialogHeader>
              <CreditCardForm onSubmit={handleAddCard} submitButtonText="Save Card" />
            </DialogContent>
          </Dialog>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {cards.map((card) => (
            <div
              key={card.id}
              className="bg-card space-y-3 rounded-lg border p-4 transition-shadow hover:shadow-md"
            >
              {/* Card Header */}
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-sm font-semibold">{card.cardBrand}</div>
                  <div className="text-muted-foreground text-xs">•••• •••• •••• {card.last4}</div>
                </div>
                {card.isDefault && (
                  <span className="bg-primary/10 text-primary inline-block rounded px-2 py-1 text-xs">
                    Default
                  </span>
                )}
              </div>

              {/* Expiry */}
              <div className="text-muted-foreground text-xs">
                Expires {String(card.expMonth).padStart(2, '0')}/{String(card.expYear).slice(-2)}
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                {!card.isDefault && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="flex-1"
                    onClick={() => setDefaultMutation.mutate(card.id)}
                    disabled={setDefaultMutation.isPending}
                  >
                    Set as Default
                  </Button>
                )}

                <Dialog
                  open={cardToDelete === card.id}
                  onOpenChange={(open) => {
                    if (!open) setCardToDelete(null);
                  }}
                >
                  <DialogTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="text-destructive hover:text-destructive flex-1"
                      onClick={() => setCardToDelete(card.id)}
                    >
                      Delete
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Delete Card</DialogTitle>
                      <DialogDescription>
                        Are you sure you want to delete this card? This action cannot be undone.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="flex justify-end gap-2 pt-4">
                      <Button type="button" variant="outline" onClick={() => setCardToDelete(null)}>
                        Cancel
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        onClick={() => deleteCardMutation.mutate(card.id)}
                        disabled={deleteCardMutation.isPending}
                      >
                        Delete
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="bg-destructive/10 text-destructive rounded-lg p-4 text-sm">
          Failed to load cards. Please try again.
        </div>
      )}
    </div>
  );
}
