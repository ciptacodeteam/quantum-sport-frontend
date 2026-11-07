import { expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ error: vi.fn() }));
vi.mock('sonner', () => ({ toast: { error: mocks.error, success: vi.fn() } }));
vi.mock('@/api/admin/checkout', () => ({ adminCheckoutApi: vi.fn() }));
import { adminCheckoutMutationOptions } from './checkout';
it('shows the validation reason when admin checkout cannot submit', () => {
  const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
  const options = adminCheckoutMutationOptions();
  try {
    (options.onError as Function)({
      code: 422,
      message: 'Validation Error',
      errors: { name: 'ZodError', fields: { courtSlots: 'Slot lapangan tidak valid.' } }
    });
    expect(mocks.error).toHaveBeenCalledWith('Slot lapangan tidak valid.');
  } finally {
    consoleError.mockRestore();
  }
});
