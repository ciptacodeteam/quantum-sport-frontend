import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import PaymentMethodsSection from './PaymentMethodsSection';

afterEach(cleanup);

it('explains an empty period instead of displaying a blank card', () => {
  render(<PaymentMethodsSection data={{ summary: {}, methods: [] }} isLoading={false} />);
  expect(screen.getByText('No payments in this period')).toBeInTheDocument();
  expect(screen.getByText(/Try a different date range/)).toBeInTheDocument();
  expect(screen.queryByText('Revenue Comparison')).not.toBeInTheDocument();
  expect(screen.getByRole('region', { name: 'Payment overview' })).not.toHaveTextContent(
    /NaN|Infinity/
  );
});

it('sorts payment methods by revenue and calculates fees, net amounts and averages', () => {
  render(
    <PaymentMethodsSection
      isLoading={false}
      data={{
        summary: {
          totalAmount: 1000000,
          totalProcessingFees: 20000,
          totalTransactions: 3,
          methodCount: 2
        },
        methods: [
          {
            method: { id: 'cash', name: 'Cash' },
            total: 200000,
            processingFee: 0,
            count: 1,
            percentage: 20
          },
          {
            method: { id: 'qris', name: 'QRIS' },
            total: 800000,
            processingFee: 20000,
            count: 2,
            percentage: 80
          }
        ]
      }}
    />
  );
  expect(
    screen.getAllByRole('article').map((article) => article.getAttribute('aria-label'))
  ).toEqual(['QRIS', 'Cash']);
  const qris = within(screen.getByRole('article', { name: 'QRIS' }));
  expect(qris.getByText(/780\.000/)).toBeInTheDocument();
  expect(qris.getByText(/400\.000/)).toBeInTheDocument();
  expect(qris.getByText('80.0%')).toBeInTheDocument();
  expect(screen.getByRole('region', { name: 'Payment overview' })).toHaveTextContent(/980\.000/);
  expect(screen.getByText('Revenue Comparison')).toBeInTheDocument();
});

it('distinguishes unavailable data from a successful empty report', () => {
  render(<PaymentMethodsSection data={undefined} isLoading={false} />);
  expect(screen.getByText('Payment analytics unavailable')).toBeInTheDocument();
  expect(screen.queryByText('No payments in this period')).not.toBeInTheDocument();
});

it('keeps loading content separate from the empty state', () => {
  render(<PaymentMethodsSection data={undefined} isLoading />);
  expect(screen.getByRole('status', { name: 'Loading payment analytics' })).toBeInTheDocument();
  expect(screen.queryByText('No payments in this period')).not.toBeInTheDocument();
});
