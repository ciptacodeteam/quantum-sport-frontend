'use client';
import Link from 'next/link';
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { createColumnHelper } from '@tanstack/react-table';
import dayjs from 'dayjs';

import { adminInvoicesQueryOptions } from '@/queries/admin/invoice';
import { DataTable } from '@/components/ui/data-table';
import { formatNumber } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { IconEye } from '@tabler/icons-react';

type InvoiceListItem = {
	id: string;
	number: string;
	type: 'BOOKING' | 'CLASS_BOOKING' | 'MEMBERSHIP';
	user: { id: string; name: string; email: string; phone?: string | null };
	subtotal: number;
	processingFee: number;
	total: number;
	status: 'PENDING' | 'PAID' | 'FAILED' | 'EXPIRED' | 'CANCELLED';
	issuedAt: string;
	paidAt?: string | null;
	cancelledAt?: string | null;
};

const colHelper = createColumnHelper<InvoiceListItem>();

const statusVariant: Record<InvoiceListItem['status'], 'default' | 'success' | 'warning' | 'destructive' | 'secondary' | 'info'> = {
	PENDING: 'warning',
	PAID: 'success',
	FAILED: 'destructive',
	EXPIRED: 'secondary',
	CANCELLED: 'secondary'
};

const typeLabel: Record<InvoiceListItem['type'], string> = {
	BOOKING: 'Booking',
	CLASS_BOOKING: 'Kelas',
	MEMBERSHIP: 'Membership'
};

const InvoiceTable = () => {
	const columns = useMemo(
		() => [
			colHelper.accessor('number', {
				header: 'No. Invoice'
			}),
			colHelper.accessor('type', {
				header: 'Tipe',
				cell: (info) => typeLabel[info.getValue()]
			}),
			colHelper.accessor((row) => row.user.name, {
				id: 'customer',
				header: 'Kustomer'
			}),
			colHelper.accessor('total', {
				header: 'Total',
				cell: (info) => `Rp ${formatNumber(info.getValue() as number)}`
			}),
			colHelper.accessor('status', {
				header: 'Status',
				cell: (info) => <Badge variant={statusVariant[info.getValue()]}>{info.getValue()}</Badge>
			}),
			colHelper.accessor('issuedAt', {
				header: 'Diterbitkan',
				cell: (info) => dayjs(info.getValue()).format('DD/MM/YYYY HH:mm')
			}),
			colHelper.display({
				id: 'actions',
				header: 'Aksi',
				cell: ({ row }) => (
					<Link href={`/admin/kelola-transaksi/${row.original.id}`} prefetch>
						<Button size="icon" variant="lightInfo" aria-label="Lihat detail">
							<IconEye />
						</Button>
					</Link>
				)
			})
		],
		[]
	);

	const { data, isPending } = useQuery(adminInvoicesQueryOptions());

	return (
		<DataTable
			loading={isPending}
			data={(data || []) as InvoiceListItem[]}
			columns={columns}
			enableRowSelection={false}
			addButton={null}
		/>
	);
};

export default InvoiceTable;


