import { expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ redirect: vi.fn() }));
vi.mock('next/navigation', () => ({ redirect: mocks.redirect }));
import AddOnsPage from './page';
it('redirects the retired customer add-ons route to court booking', () => {
  AddOnsPage();
  expect(mocks.redirect).toHaveBeenCalledWith('/booking');
});
