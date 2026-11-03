import { cleanup, fireEvent, render, screen, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, expect, it, vi } from 'vitest';
import BannerSection from './BannerSection';
import { useBranchStore } from '@/stores/useBranchStore';

const mocks = vi.hoisted(() => ({ get: vi.fn(), carousel: vi.fn() }));
vi.mock('@/api/banner', () => ({ getBannersApi: mocks.get }));
vi.mock('next/image', () => ({
  default: ({ fill, priority, unoptimized, ...props }: any) => <img {...props} />
}));
vi.mock('@/components/branches/BranchLink', () => ({
  default: (props: any) => <a {...props} />
}));
vi.mock('./MenuSection', () => ({ default: () => null }));
vi.mock('./LocationsSection', () => ({ default: () => null }));
vi.mock('./BrandIntroSection', () => ({ default: () => null }));
vi.mock('@/components/ui/carousel', () => ({
  Carousel: (props: any) => {
    mocks.carousel(props);
    return <div>{props.children}</div>;
  },
  CarouselContent: (props: any) => <div>{props.children}</div>,
  CarouselItem: (props: any) => <div>{props.children}</div>,
  CarouselDots: () => <div>Slide navigation</div>
}));
const clients: QueryClient[] = [];
const banner = (image = 'https://images.example.com/banner.webp') => ({
  id: 'banner-1',
  image,
  isActive: true,
  sequence: 1,
  link: null
});
function setup() {
  useBranchStore.setState({ branch: null });
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  clients.push(client);
  render(
    <QueryClientProvider client={client}>
      <BannerSection />
    </QueryClientProvider>
  );
  return client;
}
afterEach(() => {
  cleanup();
  clients.splice(0).forEach((client) => client.clear());
  vi.resetAllMocks();
});
it('loads shared admin banners before a branch has been selected and enables autoplay for multiple slides', async () => {
  mocks.get.mockResolvedValue({
    data: [
      banner(),
      { ...banner('https://images.example.com/second.webp'), id: 'banner-2', sequence: 2 }
    ]
  });
  setup();
  await waitFor(() => expect(screen.getAllByRole('img')[0]).toHaveAttribute('src', banner().image));
  expect(mocks.get).toHaveBeenCalledWith({}, expect.any(AbortSignal));
  expect(screen.getByText('Slide navigation')).toBeInTheDocument();
  expect(mocks.carousel.mock.lastCall?.[0].opts.loop).toBe(true);
  expect(mocks.carousel.mock.lastCall?.[0].plugins).toHaveLength(1);
});
it('refreshes the public cache after admin invalidation and retries a new image on the same banner ID', async () => {
  mocks.get.mockResolvedValueOnce({ data: [banner()] });
  const client = setup();
  await waitFor(() => expect(screen.getByRole('img')).toHaveAttribute('src', banner().image));
  fireEvent.error(screen.getByRole('img'));
  expect(screen.getByRole('img')).toHaveAttribute('src', '/assets/img/court-3.jpg');
  const newImage = 'https://images.example.com/updated.webp';
  mocks.get.mockResolvedValueOnce({ data: [banner(newImage)] });
  await act(async () => {
    await client.invalidateQueries({ queryKey: ['banners'] });
  });
  await waitFor(() => expect(screen.getByRole('img')).toHaveAttribute('src', newImage));
  expect(mocks.get).toHaveBeenCalledTimes(2);
});
