'use client';

import { cancelBookedCoachApi } from '@/api/admin/bookedCoach';
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
	adminBookedCoachQueryOptions,
	adminBookedCoachesQueryOptions,
	type AdminBookedCoachDetail,
	type AdminBookedCoachListItem
} from '@/queries/admin/bookedCoach';
import { IconEye, IconX } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { createColumnHelper } from '@tanstack/react-table';
import dayjs from 'dayjs';
import { useMemo } from 'react';

const BookedCoachTable = () => {
	const { confirmAndMutate: cancelBookedCoach } = useConfirmMutation(
		{
			mutationFn: (id: string) => cancelBookedCoachApi(id, 'Cancelled by admin')
		},
		{
			title: 'Batalkan Coach',
			description: 'Apakah Anda yakin ingin membatalkan coach ini dari pemesanan?',
			confirmText: 'Batalkan',
			cancelText: 'Tutup',
			destructive: true,
			toastMessages: {
				loading: 'Membatalkan coach...',
				success: () => 'Coach berhasil dibatalkan.',
				error: 'Gagal membatalkan coach.'
			},
			invalidate: ['admin', 'booked-coaches']
		}
	);

	const colHelper = createColumnHelper<AdminBookedCoachListItem>();

	const columns = useMemo(
		() => [
			colHelper.accessor((row) => row.coach, {
				id: 'coach',
				header: 'Coach',
				cell: (info) => {
					const coach = info.getValue();
					if (!coach) return '-';
					const coachType = (coach.coachType as any)?.name ?? coach.coachType ?? '-';
					return (
						<div className="flex flex-col">
							<span className="font-medium">{coach.staff?.name || '-'}</span>
							<span className="text-xs text-muted-foreground">{coachType}</span>
						</div>
					);
				}
			}),
			colHelper.accessor((row) => row.booking?.status, {
				id: 'bookingStatus',
				header: 'Status Pemesanan',
				cell: (info) => {
					const status = (info.getValue() || 'HOLD') as keyof typeof BOOKING_STATUS_MAP;
					return <Badge variant={BOOKING_STATUS_BADGE_VARIANT[status]}>{BOOKING_STATUS_MAP[status]}</Badge>;
				}
			}),
			colHelper.accessor((row) => row.booking?.customer, {
				id: 'customer',
				header: 'Pelanggan',
				cell: (info) => {
					const customer = info.getValue() as any;
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
			colHelper.accessor((row) => row.booking?.invoice ?? null, {
				header: 'Invoice',
				cell: (info) => {
					const invoice = info.getValue() as any;
					if (!invoice) return <span className="text-muted-foreground">-</span>;
					return (
						<div className="flex flex-col">
							<span className="font-medium">{invoice.number}</span>
							<span className="text-xs text-muted-foreground">{invoice.status}</span>
						</div>
					);
				}
			}),
			colHelper.accessor((row) => row.booking?.courtSlots ?? [], {
				header: 'Lapangan & Waktu',
				cell: (info) => {
					const slots = (info.getValue() as any[]) || [];
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
							<ManagedDialog id={`view-booked-coach-${item.id}`}>
								<DialogTrigger asChild>
									<Button size="icon" variant="lightInfo">
										<IconEye />
									</Button>
								</DialogTrigger>
								<DialogContent className="max-w-2xl">
									<DialogHeader className="mb-4">
										<DialogTitle>Detail Coach</DialogTitle>
									</DialogHeader>
									<CoachDetail id={item.id} />
								</DialogContent>
							</ManagedDialog>
							<Button
								size="icon"
								variant="destructive"
								onClick={() => cancelBookedCoach(item.id)}
								title="Batalkan Coach"
							>
								<IconX />
							</Button>
						</div>
					);
				}
			})
		],
		[colHelper, cancelBookedCoach]
	);

	const { data, isPending } = useQuery(adminBookedCoachesQueryOptions());

	return (
		<DataTable loading={isPending} data={data || []} columns={columns} enableRowSelection={false} />
	);
};

const CoachDetail = ({ id }: { id: string }) => {
	const { data, isPending } = useQuery(adminBookedCoachQueryOptions(id));

	if (isPending || !data) {
		return <div className="text-sm text-muted-foreground">Memuat detail...</div>;
	}

	const detail = data as AdminBookedCoachDetail;
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
					<p className="text-sm text-muted-foreground">Coach</p>
					<p className="font-medium">{detail.coach?.staff?.name || '-'}</p>
					{detail.coach?.coachType && (
						<p className="text-xs text-muted-foreground mt-1">
							{(detail.coach.coachType as any)?.name ?? detail.coach.coachType}
						</p>
					)}
				</div>
				<div>
					<p className="text-sm text-muted-foreground">Pelanggan</p>
					<p className="font-medium">{customer?.name || '-'}</p>
					{customer?.phone && <p className="text-xs text-muted-foreground">{formatPhone(customer.phone)}</p>}
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
				{detail.slot && (
					<div>
						<p className="text-sm text-muted-foreground">Waktu Coach</p>
						<p className="text-sm">
							{dayjs(detail.slot.startAt).format('DD MMM YYYY')} ·{' '}
							{detail.slot.startTime || dayjs(detail.slot.startAt).format('HH:mm')} -{' '}
							{detail.slot.endTime || dayjs(detail.slot.endAt).format('HH:mm')}
						</p>
					</div>
				)}
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
		</div>
	);
};

export default BookedCoachTable;


