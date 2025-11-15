'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Copy } from 'lucide-react';
import { getStatusColor, getStatusLabel } from './status';

type Props = {
  number: string;
  status: string;
  onBack: () => void;
  onCopy: () => void;
};

export default function InvoiceHeader({ number, status, onBack, onCopy }: Props) {
  return (
    <div className="mb-6">
      <Button variant="ghost" onClick={onBack} className="mb-4">
        Kembali
      </Button>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="mb-2 text-3xl font-bold">Invoice Detail</h1>
          <p className="flex items-center gap-2 text-gray-600">
            Nomor Invoice: <span className="font-semibold">{number}</span>
            <Button variant="ghost" size="sm" className="h-7 px-2" onClick={onCopy}>
              <Copy className="h-4 w-4" />
            </Button>
          </p>
        </div>
        <Badge className={getStatusColor(status)} variant="outline">
          {getStatusLabel(status)}
        </Badge>
      </div>
    </div>
  );
}
