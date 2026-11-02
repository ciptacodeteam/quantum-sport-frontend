import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { usePhoneStore } from '@/stores/usePhoneStore';

const mocks = vi.hoisted(() => ({ mutate: vi.fn(), error: vi.fn() }));
vi.mock('@tanstack/react-query', () => ({
  useMutation: () => ({ mutate: mocks.mutate, isPending: false })
}));
vi.mock('@/mutations/auth', () => ({ resetPasswordMutationOptions: () => ({}) }));
vi.mock('sonner', () => ({ toast: { error: mocks.error } }));

import ResetPasswordForm from './ResetPasswordForm';

beforeEach(() => {
  vi.resetAllMocks();
  usePhoneStore.getState().setPhone('+6281234567890');
  usePhoneStore.getState().setRequestId('request');
});
afterEach(() => {
  cleanup();
  usePhoneStore.getState().setPhone(null);
});

function submit() {
  render(<ResetPasswordForm />);
  fireEvent.change(screen.getByLabelText('New Password'), { target: { value: 'Password123!' } });
  fireEvent.change(screen.getByLabelText('Confirm Password'), {
    target: { value: 'Password123!' }
  });
  fireEvent.click(screen.getByRole('button', { name: 'Reset Password' }));
}

it('includes the server-issued reset capability when submitting the new password', async () => {
  usePhoneStore.getState().setResetToken('a'.repeat(64));
  submit();
  await waitFor(() =>
    expect(mocks.mutate).toHaveBeenCalledWith({
      phone: '+6281234567890',
      requestId: 'request',
      resetToken: 'a'.repeat(64),
      newPassword: 'Password123!'
    })
  );
});

it('does not submit a reset using only the public phone and requestId', async () => {
  submit();
  await waitFor(() => expect(mocks.error).toHaveBeenCalled());
  expect(mocks.mutate).not.toHaveBeenCalled();
});
