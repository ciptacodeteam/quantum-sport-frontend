import {
  createTournamentApi,
  updateTournamentApi,
  deleteTournamentApi
} from '@/api/admin/tournament';
import type { MutationFuncProps } from '@/types';
import { mutationOptions } from '@tanstack/react-query';
import { handleMutationError } from '@/lib/handle-mutation-error';
import { toast } from 'sonner';

export const adminCreateTournamentMutationOptions = ({
  onSuccess,
  onError
}: MutationFuncProps = {}) =>
  mutationOptions({
    mutationFn: createTournamentApi,
    onSuccess: (data) => {
      const msg = data?.msg || 'Tournament created successfully!';
      toast.success(msg);
      onSuccess?.(data);
    },
    onError: (error) =>
      handleMutationError(error, {
        onError,
        fallbackMessage: 'Failed to create tournament. Please try again.'
      })
  });

export const adminUpdateTournamentMutationOptions = ({
  onSuccess,
  onError
}: MutationFuncProps = {}) =>
  mutationOptions({
    mutationFn: updateTournamentApi,
    onSuccess: (data) => {
      const msg = data?.msg || 'Tournament updated successfully!';
      toast.success(msg);
      onSuccess?.(data);
    },
    onError: (error) =>
      handleMutationError(error, {
        onError,
        fallbackMessage: 'Failed to update tournament. Please try again.'
      })
  });

export const deleteTournamentMutationOptions = ({ onSuccess, onError }: MutationFuncProps = {}) =>
  mutationOptions({
    mutationFn: deleteTournamentApi,
    onSuccess: (data) => {
      const msg = data?.msg || 'Tournament deleted successfully!';
      toast.success(msg);
      onSuccess?.(data);
    },
    onError: (error) =>
      handleMutationError(error, {
        onError,
        fallbackMessage: 'Failed to delete tournament. Please try again.'
      })
  });
