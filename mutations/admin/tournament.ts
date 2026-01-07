import {
  createTournamentApi,
  updateTournamentApi,
  deleteTournamentApi
} from '@/api/admin/tournament';
import type { MutationFuncProps } from '@/types';
import { mutationOptions } from '@tanstack/react-query';
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
    onError: (error) => {
      console.error('Error:', error);
      toast.error(error.msg || 'Failed to create tournament. Please try again.');
      onError?.(error);
    }
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
    onError: (error) => {
      console.error('Error:', error);
      toast.error(error.msg || 'Failed to update tournament. Please try again.');
      onError?.(error);
    }
  });

export const deleteTournamentMutationOptions = ({ onSuccess, onError }: MutationFuncProps = {}) =>
  mutationOptions({
    mutationFn: deleteTournamentApi,
    onSuccess: (data) => {
      const msg = data?.msg || 'Tournament deleted successfully!';
      toast.success(msg);
      onSuccess?.(data);
    },
    onError: (error) => {
      console.error('Error:', error);
      toast.error(error.msg || 'Failed to delete tournament. Please try again.');
      onError?.(error);
    }
  });
