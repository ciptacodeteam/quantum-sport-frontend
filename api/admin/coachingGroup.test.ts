import { afterEach, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ post: vi.fn(), put: vi.fn(), delete: vi.fn() }));
vi.mock('@/lib/adminApi', () => ({ adminApi: mocks }));
import { coachingGroupApi } from './coachingGroup';
const input = {
  name: 'Northwest',
  sports: ['PADEL', 'TENNIS'] as ('PADEL' | 'TENNIS')[],
  branchIds: ['cemara', 'other'],
  isActive: false,
  description: 'Academy'
};
afterEach(() => vi.clearAllMocks());
it('sends arrays, booleans and the local image in a multipart create request', () => {
  const logo = new File(['image'], 'northwest.webp', { type: 'image/webp' });
  coachingGroupApi.save(undefined, { ...input, logo });
  const [path, form, config] = mocks.post.mock.calls[0];
  expect(path).toBe('/coaching-groups');
  expect(form).toBeInstanceOf(FormData);
  expect(JSON.parse(form.get('data'))).toEqual(input);
  expect(form.get('logo')).toBe(logo);
  expect(config.headers['Content-Type']).toBe('multipart/form-data');
});
it('does not send an empty logo during edits and sends removal only when requested', () => {
  coachingGroupApi.save('group', input);
  expect(mocks.put.mock.calls[0][1].has('logo')).toBe(false);
  expect(mocks.put.mock.calls[0][1].has('removeLogo')).toBe(false);
  coachingGroupApi.save('group', { ...input, removeLogo: true });
  expect(mocks.put.mock.calls[1][1].get('removeLogo')).toBe('true');
});

it('deletes only the requested group', () => {
  coachingGroupApi.remove('group-id');
  expect(mocks.delete).toHaveBeenCalledExactlyOnceWith('/coaching-groups/group-id');
});
