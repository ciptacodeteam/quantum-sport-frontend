import {
  saveCreditCardApi,
  cardCheckoutApi,
  membershipCardCheckoutApi,
  listCreditCardsApi,
  updateCreditCardApi,
  deleteCreditCardApi
} from '@/api/credit-cards';
import type { MutationFuncProps } from '@/types';
import { mutationOptions, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

/**
 * Save a new credit card
 */
export const saveCreditCardMutationOptions = ({ onSuccess, onError }: MutationFuncProps = {}) => {
  const queryClient = useQueryClient();

  return mutationOptions({
    mutationFn: saveCreditCardApi,
    onSuccess: (data) => {
      if (data.success) {
        toast.success('Card saved successfully!');
        // Invalidate cards list to refresh
        queryClient.invalidateQueries({ queryKey: ['credit-cards'] });
        onSuccess?.(data);
      } else {
        toast.error(data.message || 'Failed to save card');
      }
    },
    onError: (error: any) => {
      console.error('Error saving card:', error);
      const message =
        error?.response?.data?.message ||
        error.msg ||
        'Failed to save card. Please check your card details and try again.';
      toast.error(message);
      onError?.(error);
    }
  });
};

/**
 * List saved credit cards
 */
export const listCreditCardsMutationOptions = ({ onSuccess, onError }: MutationFuncProps = {}) =>
  mutationOptions({
    mutationFn: listCreditCardsApi,
    onSuccess: (data) => {
      onSuccess?.(data);
    },
    onError: (error: any) => {
      console.error('Error loading cards:', error);
      toast.error('Failed to load saved cards');
      onError?.(error);
    }
  });

/**
 * Update a credit card (mark as default, etc.)
 */
export const updateCreditCardMutationOptions = ({ onSuccess, onError }: MutationFuncProps = {}) => {
  const queryClient = useQueryClient();

  return mutationOptions({
    mutationFn: ({ id, payload }: { id: string; payload: { isDefault?: boolean } }) =>
      updateCreditCardApi(id, payload),
    onSuccess: (data) => {
      if (data.success) {
        toast.success('Card updated successfully!');
        queryClient.invalidateQueries({ queryKey: ['credit-cards'] });
        onSuccess?.(data);
      } else {
        toast.error(data.message || 'Failed to update card');
      }
    },
    onError: (error: any) => {
      console.error('Error updating card:', error);
      toast.error('Failed to update card');
      onError?.(error);
    }
  });
};

/**
 * Delete a credit card
 */
export const deleteCreditCardMutationOptions = ({ onSuccess, onError }: MutationFuncProps = {}) => {
  const queryClient = useQueryClient();

  return mutationOptions({
    mutationFn: deleteCreditCardApi,
    onSuccess: (data) => {
      toast.success('Card deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['credit-cards'] });
      onSuccess?.(data);
    },
    onError: (error: any) => {
      console.error('Error deleting card:', error);
      toast.error('Failed to delete card');
      onError?.(error);
    }
  });
};

/**
 * Checkout with credit card for booking (court slots, coaches, etc.)
 * Handles 3DS challenge if required
 */
export const cardCheckoutMutationOptions = ({ onSuccess, onError }: MutationFuncProps = {}) =>
  mutationOptions({
    mutationFn: cardCheckoutApi,
    onSuccess: (data) => {
      // Check if 3DS authentication is required
      if (data.paymentStatus === 'REQUIRES_ACTION' && data.paymentUrl) {
        // Redirect to 3DS challenge page
        // Store data for post-authentication handling
        sessionStorage.setItem('payment_3ds_data', JSON.stringify(data));
        window.location.href = data.paymentUrl;
        return;
      }

      // Payment succeeded without 3DS
      if (data.paymentStatus === 'SUCCEEDED' || data.status === 'CONFIRMED') {
        toast.success('Payment successful! Your booking has been confirmed.');
        onSuccess?.(data);
      } else {
        toast.success('Checkout completed! Please complete the payment.');
        onSuccess?.(data);
      }
    },
    onError: (error: any) => {
      console.error('Checkout error:', error);
      const message =
        error?.response?.data?.message ||
        error.msg ||
        'Unable to initialize payment. Please check your card details and try again. If the problem persists, contact support.';
      toast.error(message);
      onError?.(error);
    }
  });

/**
 * Checkout with credit card for membership
 * Handles 3DS challenge if required
 */
export const membershipCardCheckoutMutationOptions = ({
  onSuccess,
  onError
}: MutationFuncProps = {}) =>
  mutationOptions({
    mutationFn: membershipCardCheckoutApi,
    onSuccess: (data) => {
      // Check if 3DS authentication is required
      if (data.paymentStatus === 'REQUIRES_ACTION' && data.paymentUrl) {
        // Redirect to 3DS challenge page
        sessionStorage.setItem('payment_3ds_data', JSON.stringify(data));
        window.location.href = data.paymentUrl;
        return;
      }

      // Payment succeeded without 3DS
      if (data.paymentStatus === 'SUCCEEDED') {
        toast.success('Membership purchase successful!');
        onSuccess?.(data);
      } else {
        toast.success('Membership checkout completed! Please complete the payment.');
        onSuccess?.(data);
      }
    },
    onError: (error: any) => {
      console.error('Membership checkout error:', error);
      const message =
        error?.response?.data?.message ||
        error.msg ||
        'Unable to initialize payment. Please check your card details and try again. If the problem persists, contact support.';
      toast.error(message);
      onError?.(error);
    }
  });
