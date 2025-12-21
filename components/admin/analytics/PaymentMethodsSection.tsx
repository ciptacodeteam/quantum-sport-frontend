'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { cn, formatCurrency } from '@/lib/utils';
import { IconCreditCard, IconReceiptTax, IconTrendingUp, IconUsers } from '@tabler/icons-react';
import Image from 'next/image';

interface PaymentMethodsSectionProps {
  data: any;
  isLoading: boolean;
}

// Color mapping for payment methods

export default function PaymentMethodsSection({ data, isLoading }: PaymentMethodsSectionProps) {
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-3">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="mt-2 h-8 w-32" />
              </CardHeader>
            </Card>
          ))}
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Data Available</CardTitle>
          <CardDescription>Unable to load payment method analytics</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const summary = data.summary || {};
  const methods = Array.isArray(data.methods) ? data.methods : [];

  // Calculate metrics
  const avgTransactionValue =
    summary.totalTransactions > 0 ? summary.totalAmount / summary.totalTransactions : 0;
  const netRevenue = (summary.totalAmount || 0) - (summary.totalProcessingFees || 0);
  const feePercentage =
    summary.totalAmount > 0 ? ((summary.totalProcessingFees || 0) / summary.totalAmount) * 100 : 0;

  // Sort methods by total amount descending
  const sortedMethods = [...methods].sort((a, b) => (b.total || 0) - (a.total || 0));

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardDescription className="text-sm">Gross Revenue</CardDescription>
            <IconTrendingUp className="text-primary h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summary.totalAmount || 0)}</div>
            <p className="text-muted-foreground text-xs">Before processing fees</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardDescription className="text-sm">Processing Fees</CardDescription>
            <IconReceiptTax className="text-destructive h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-destructive text-2xl font-bold">
              {formatCurrency(summary.totalProcessingFees || 0)}
            </div>
            <p className="text-muted-foreground text-xs">{feePercentage.toFixed(2)}% of gross</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardDescription className="text-sm">Net Revenue</CardDescription>
            <IconTrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(netRevenue)}</div>
            <p className="text-muted-foreground text-xs">
              Avg: {formatCurrency(avgTransactionValue)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardDescription className="text-sm">Transactions</CardDescription>
            <IconUsers className="text-primary h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalTransactions || 0}</div>
            <p className="text-muted-foreground text-xs">
              {summary.methodCount || 0} payment method{(summary.methodCount || 0) !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Methods</CardTitle>
          <CardDescription className="mt-2">
            {data.dateRange?.startDate && data.dateRange?.endDate && (
              <>
                Period: {new Date(data.dateRange.startDate).toLocaleDateString()} -{' '}
                {new Date(data.dateRange.endDate).toLocaleDateString()}
              </>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="mt-4">
          <div className="space-y-4">
            {sortedMethods.map((method) => {
              const avgPerTransaction = method.count > 0 ? method.total / method.count : 0;
              const netAmount = (method.total || 0) - (method.processingFee || 0);
              const methodFeePercentage =
                method.total > 0 ? ((method.processingFee || 0) / method.total) * 100 : 0;

              return (
                <div key={method.method?.id} className={cn('rounded-lg border p-4 transition-all')}>
                  <div className="space-y-4">
                    {/* Header with logo and title */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className={cn('rounded-lg bg-gray-100 p-2.5')}>
                          {method.method?.logo ? (
                            <Image
                              src={method.method.logo}
                              alt={method.method.name}
                              unoptimized
                              width={20}
                              height={20}
                              className="h-5 w-5 object-contain"
                            />
                          ) : (
                            <IconCreditCard className="h-5 w-5 text-gray-500" />
                          )}
                        </div>
                        <div>
                          <div className={cn('font-semibold')}>{method.method?.name}</div>
                          <p className="text-muted-foreground text-xs">
                            {method.count} transaction{method.count !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-sm font-semibold">
                        {method.percentage?.toFixed(1)}%
                      </Badge>
                    </div>

                    {/* Progress Bar */}
                    <Progress value={method.percentage || 0} className="h-2.5" />

                    {/* Metrics Grid */}
                    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                      <div className="space-y-1">
                        <p className="text-muted-foreground text-xs">Gross Amount</p>
                        <p className="font-semibold">{formatCurrency(method.total)}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-muted-foreground text-xs">Fees</p>
                        <p className="text-destructive font-semibold">
                          {formatCurrency(method.processingFee || 0)}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-muted-foreground text-xs">Net Amount</p>
                        <p className="font-semibold text-green-600">{formatCurrency(netAmount)}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-muted-foreground text-xs">Avg Transaction</p>
                        <p className="font-semibold">{formatCurrency(avgPerTransaction)}</p>
                      </div>
                    </div>

                    {/* Fee Info */}
                    {method.processingFee > 0 && (
                      <div className="flex items-center gap-2 rounded bg-gray-50 px-3 py-2 text-xs">
                        <IconReceiptTax className="text-destructive h-3.5 w-3.5" />
                        <span className="text-muted-foreground">
                          Fee rate: {methodFeePercentage.toFixed(2)}%
                        </span>
                      </div>
                    )}

                    {/* Transactions Button */}
                    {/* {method.transactions && method.transactions.length > 0 && (
                      <ManagedDialog id={`payment-method-${method.method?.id}`}>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full justify-center text-xs"
                          >
                            <IconEye className="mr-1.5 h-3.5 w-3.5" />
                            View {method.transactions.length} Transaction
                            {method.transactions.length !== 1 ? 's' : ''}
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>{method.method?.name} Transactions</DialogTitle>
                          </DialogHeader>
                          <div className="max-h-96 space-y-3 overflow-y-auto">
                            {method.transactions.map((tx: any) => (
                              <div
                                key={tx.id}
                                className="flex items-center justify-between rounded-lg border p-3"
                              >
                                <div>
                                  <p className="text-muted-foreground font-mono text-sm">{tx.id}</p>
                                  <p className="text-muted-foreground text-xs">
                                    {new Date(tx.date).toLocaleString()}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="font-semibold">{formatCurrency(tx.amount)}</p>
                                  {tx.processingFee > 0 && (
                                    <p className="text-destructive text-xs">
                                      -{formatCurrency(tx.processingFee)}
                                    </p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </DialogContent>
                      </ManagedDialog>
                    )} */}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Revenue Comparison */}
      {sortedMethods.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Revenue Comparison</CardTitle>
            <CardDescription>Gross revenue distribution by payment method</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {sortedMethods.map((method) => {
                const barWidth = (method.total / (summary.totalAmount || 1)) * 100;

                return (
                  <div key={method.method?.id} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{method.method?.name}</span>
                      <span className="text-muted-foreground">{formatCurrency(method.total)}</span>
                    </div>
                    <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
                      <div
                        className={cn('bg-primary h-full transition-all duration-300')}
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
