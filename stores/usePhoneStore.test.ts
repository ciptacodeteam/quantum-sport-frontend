import { beforeEach, expect, it } from 'vitest';
import { usePhoneStore } from './usePhoneStore';

beforeEach(() => usePhoneStore.getState().setPhone(null));

it('discards the reset capability when the phone changes or the flow closes', () => {
  usePhoneStore.getState().setResetToken('secret');
  usePhoneStore.getState().setPhone(null);
  expect(usePhoneStore.getState().resetToken).toBeNull();
});

it('discards the old capability when requesting a new OTP', () => {
  usePhoneStore.getState().setResetToken('secret');
  usePhoneStore.getState().setRequestId('new-request');
  expect(usePhoneStore.getState().resetToken).toBeNull();
});
