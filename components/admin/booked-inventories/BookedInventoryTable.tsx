'use client';

import { cancelBookedInventoryApi } from '@/api/admin/bookedInventory';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import {
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
	ManagedDialog
} from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useConfirmMutation } from '@/hooks/useConfirmDialog';
import { BOOKING_STATUS_BADGE_VARIANT, BOOKING_STATUS_MAP } from '@/lib/constants';
import { formatPhone } from '@/lib/utils';
import {
	adminBookedInventoriesQueryOptions,
	adminBookedInventoryQueryOptions,
	type AdminBookedInventoryDetail,
	type AdminBookedInventoryListItem
} from '@/queries/admin/bookedInventory';
import { IconEye, IconX } from '@tabler/icons-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createColumnHelper } from '@tanstack/react-table';
import dayjs from 'dayjs';
import { useMemo } from 'react';

const currency = (n: number) => `Rp ${new Intl.NumberFormat('id-ID').format(n)}`;

const BookedInventoryTable = () => {
	const queryClient = useQueryClient();

	const { confirmAndMutate: cancelBookedInventory } = useConfirmMutation(
		{
			mutationFn: (id: string) => cancelBookedInventoryApi(id, 'Cancelled by admin')
		},
		{
			title: 'Batalkan Inventori',
			description: 'Apakah Anda yakin ingin membatalkan inventori ini dari pemesanan?',
			confirmText: 'Batalkan',
			cancelText: 'Tutup',
			destructive: true,
			toastMessages: {
				loading: 'Membatalkan inventori...',
				success: () => 'Inventori berhasil dibatalkan.',
				error: 'Gagal membatalkan inventori.'
			},
			invalidate: ['admin', 'booked-inventories']
		}
	);

	const colHelper = createColumnHelper<AdminBookedInventoryListItem>();

	const columns = useMemo(
		() => [
			colHelper.accessor((row) => row.inventory.name, {
				id: 'inventoryName',
				header: 'Inventori',
				cell: (info) => <span className="font-medium">{info.getValue()}</span>
			}),
			colHelper.accessor('quantity', {
				header: 'Qty',
				cell: (info) => <span>{info.getValue()}</span>
			}),
			colHelper.accessor('unitPrice', {
				header: 'Harga Satuan',
				cell: (info) => <span className="tabular-nums">{currency(info.getValue())}</span>
			}),
			colHelper.accessor('totalPrice', {
				header: 'Total',
				cell: (info) => <span className="font-medium tabular-nums">{currency(info.getValue())}</span>
			}),
			colHelper.accessor((row) => row.booking.status, {
				id: 'bookingStatus',
				header: 'Status Pemesanan',
				cell: (info) => {
					const status = info.getValue() as keyof typeof BOOKING_STATUS_MAP;
					return <Badge variant={BOOKING_STATUS_BADGE_VARIANT[status]}>{BOOKING_STATUS_MAP[status]}</Badge>;
				}
			}),
			colHelper.accessor((row) => row.booking?.customer ?? (row as any).customer, {
				id: 'customer',
				header: 'Pelanggan',
				cell: (info) => {
					const original = info.row.original as any;
					const customer =
						info.getValue() ||
						original?.booking?.customer ||
						original?.customer ||
						original?.user ||
						null;
					if (!customer) return '-';
					return (
						<div className="flex flex-col">
							<span className="font-medium">{customer.name}</span>
							{customer.phone && (
								<span className="text-xs text-muted-foreground">{formatPhone(customer.phone)}</span>
							)}
						</div>
					);
				}
			}),
			colHelper.accessor((row) => (row as any).invoice ?? row.booking?.invoice ?? null, {
				header: 'Invoice',
				cell: (info) => {
					const invoice = info.getValue();
					if (!invoice) return <span className="text-muted-foreground">-</span>;
					return (
						<div className="flex flex-col">
							<span className="font-medium">{invoice.number}</span>
							<span className="text-xs text-muted-foreground">{invoice.status}</span>
						</div>
					);
				}
			}),
			colHelper.accessor((row) => (row as any).courtSlots ?? row.booking?.courtSlots ?? [], {
				header: 'Lapangan & Waktu',
				cell: (info) => {
					let slots = info.getValue() || [];
					// Fallback: derive slots from booking.details if API doesn't return top-level courtSlots
					if ((!slots || slots.length === 0) && (info.row.original as any).booking?.details) {
						const details = (info.row.original as any).booking.details as Array<any>;
						slots = details.map((d) => ({
							court: d.court ?? null,
							startAt: d.slot?.startAt ?? d.startAt,
							endAt: d.slot?.endAt ?? d.endAt,
							date: d.date ? String(d.date) : dayjs(d.slot?.startAt ?? d.startAt).format('YYYY-MM-DD'),
							time:
								(d.time as string) ||
								`${dayjs(d.slot?.startAt ?? d.startAt).format('HH:mm')} - ${dayjs(d.slot?.endAt ?? d.endAt).format('HH:mm')}`
						}));
					}
					if (slots.length === 0) return '-';
					const first = slots[0];
					const isExpired = dayjs(first.endAt).isBefore(dayjs());
					return (
						<Tooltip>
							<TooltipTrigger>
								<div className="flex flex-col">
									<span className="font-medium">{first.court?.name || '-'}</span>
									<span className={`text-xs ${isExpired ? 'text-destructive' : 'text-muted-foreground'}`}>
										{dayjs(first.startAt).format('DD MMM YYYY')} · {first.time}
									</span>
									{slots.length > 1 && (
										<span className="text-xs text-muted-foreground">+{slots.length - 1} slot</span>
									)}
								</div>
							</TooltipTrigger>
							<TooltipContent>
								<div className="space-y-1">
									{slots.slice(0, 4).map((s, idx) => (
										<div key={idx} className="text-xs">
											{dayjs(s.startAt).format('DD MMM')} — {s.court?.name || '-'} ({s.time})
										</div>
									))}
									{slots.length > 4 && <div className="text-xs text-muted-foreground">dan lainnya...</div>}
								</div>
							</TooltipContent>
						</Tooltip>
					);
				}
			}),
			colHelper.accessor('createdAt', {
				header: 'Dibuat',
				cell: (info) => dayjs(info.getValue()).format('DD/MM/YYYY HH:mm')
			}),
			colHelper.display({
				id: 'actions',
				header: 'Aksi',
				cell: ({ row }) => {
					const item = row.original;
					return (
						<div className="flex items-center gap-2">
							<ManagedDialog id={`view-booked-inventory-${item.id}`}>
								<DialogTrigger asChild>
									<Button size="icon" variant="lightInfo">
										<IconEye />
									</Button>
								</DialogTrigger>
								<DialogContent className="max-w-2xl">
									<DialogHeader className="mb-4">
										<DialogTitle>Detail Inventori</DialogTitle>
									</DialogHeader>
									<InventoryDetail id={item.id} />
								</DialogContent>
							</ManagedDialog>
							<Button
								size="icon"
								variant="destructive"
								onClick={() => cancelBookedInventory(item.id)}
								title="Batalkan Inventori"
							>
								<IconX />
							</Button>
						</div>
					);
				}
			})
		],
		[colHelper, cancelBookedInventory]
	);

	const { data, isPending } = useQuery(adminBookedInventoriesQueryOptions());

	return (
		<DataTable
			loading={isPending}
			data={data || []}
			columns={columns}
			enableRowSelection={false}
		/>
	);
};

const InventoryDetail = ({ id }: { id: string }) => {
	const { data, isPending } = useQuery(adminBookedInventoryQueryOptions(id));

	if (isPending || !data) {
		return <div className="text-sm text-muted-foreground">Memuat detail...</div>;
	}

	const detail = data as AdminBookedInventoryDetail;
	const customer =
		(detail as any).booking?.customer ??
		(detail as any).booking?.user ??
		(detail as any).customer ??
		null;
	const invoice = (detail as any).booking?.invoice ?? (detail as any).invoice ?? null;
	const bookingCourtSlots =
		((detail as any).booking?.courtSlots as any[]) ?? ((detail as any).courtSlots as any[]) ?? [];

	return (
		<div className="space-y-4">
			<div className="grid grid-cols-2 gap-4">
				<div>
					<p className="text-sm text-muted-foreground">Inventori</p>
					<p className="font-medium">{detail.inventory.name}</p>
					{detail.inventory.description && (
						<p className="text-xs text-muted-foreground mt-1">{detail.inventory.description}</p>
					)}
				</div>
				<div>
					<p className="text-sm text-muted-foreground">Pelanggan</p>
					<p className="font-medium">{customer?.name || '-'}</p>
					{customer?.phone && (
						<p className="text-xs text-muted-foreground">{formatPhone(customer.phone)}</p>
					)}
				</div>
				<div>
					<p className="text-sm text-muted-foreground">Jumlah</p>
					<p className="font-medium">
						{detail.quantity} × {currency(detail.unitPrice)} = {currency(detail.totalPrice)}
					</p>
				</div>
				<div>
					<p className="text-sm text-muted-foreground">Status Pemesanan</p>
					<Badge variant={BOOKING_STATUS_BADGE_VARIANT[(detail as any).booking?.status as keyof typeof BOOKING_STATUS_MAP]}>
						{BOOKING_STATUS_MAP[(detail as any).booking?.status as keyof typeof BOOKING_STATUS_MAP]}
					</Badge>
				</div>
				<div>
					<p className="text-sm text-muted-foreground">Invoice</p>
					{invoice ? (
						<div className="flex flex-col">
							<span className="font-medium">{invoice.number}</span>
							<span className="text-xs text-muted-foreground">{invoice.status}</span>
							{invoice.payment?.method && (
								<span className="text-xs text-muted-foreground">
									Metode: {(invoice.payment.method as any)?.name ?? invoice.payment.method}
								</span>
							)}
						</div>
					) : (
						<span className="text-muted-foreground">-</span>
					)}
				</div>
				<div>
					<p className="text-sm text-muted-foreground">Dibuat</p>
					<p className="text-sm">
						{dayjs((detail as any).booking?.createdAt ?? detail.createdAt).format('DD/MM/YYYY HH:mm')}
					</p>
				</div>
			</div>

			{bookingCourtSlots?.length > 0 && (
				<div>
					<p className="text-sm font-medium mb-2">Slot Lapangan</p>
					<div className="space-y-2">
						{bookingCourtSlots.map((cs: any, idx: number) => (
							<div key={idx} className="border rounded-lg p-3 bg-muted/50">
								<div className="flex justify-between items-start">
									<div>
										<p className="font-medium">{(cs.court as any)?.name || '-'}</p>
										{cs.slot ? (
											<p className="text-sm text-muted-foreground">
												{dayjs(cs.slot.startAt).format('DD MMM YYYY')} · {cs.slot.startTime} - {cs.slot.endTime}
											</p>
										) : (
											<p className="text-sm text-muted-foreground">
												{dayjs(cs.startAt).format('DD MMM YYYY')} · {cs.time}
											</p>
										)}
									</div>
								</div>
							</div>
						))}
					</div>
				</div>
			)}

			{detail.coaches?.length > 0 && (
				<div>
					<p className="text-sm font-medium mb-2">Coach</p>
					<div className="space-y-2">
						{detail.coaches.map((c, idx) => (
							<div key={idx} className="border rounded-lg p-3 bg-muted/50">
								<p className="font-medium">{c.staff.name}</p>
								<p className="text-sm text-muted-foreground">
									{(c as any).coachType?.name ?? c.coachType}{' '}
									· {dayjs(c.slot.startAt).format('HH:mm')} - {dayjs(c.slot.endAt).format('HH:mm')}
								</p>
							</div>
						))}
					</div>
				</div>
			)}

			{detail.ballboys?.length > 0 && (
				<div>
					<p className="text-sm font-medium mb-2">Ballboy</p>
					<div className="space-y-2">
						{detail.ballboys.map((b, idx) => (
							<div key={idx} className="border rounded-lg p-3 bg-muted/50">
								<p className="font-medium">{b.staff.name}</p>
								<p className="text-sm text-muted-foreground">
									{dayjs(b.slot.startAt).format('HH:mm')} - {dayjs(b.slot.endAt).format('HH:mm')}
								</p>
							</div>
						))}
					</div>
				</div>
			)}
		</div>
	);
};

export default BookedInventoryTable;


