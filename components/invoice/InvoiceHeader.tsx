'use client';

import { Badge } from '@/components/ui/badge';
import { getStatusColor, getStatusLabel } from './status';

type Props = {
  status: string;
};

export default function InvoiceHeader({ status }: Props) {
  return (
    <header className="mb-6">
      <div className="flex-between">
        <h1 className="mb-2 text-2xl font-bold">Invoice Detail</h1>
        <Badge className={getStatusColor(status)} variant="outline">
          {getStatusLabel(status)}
        </Badge>
      </div>
    </header>
  );
}
