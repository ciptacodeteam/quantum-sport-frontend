export const getStatusColor = (status: string) => {
  const statusMap: Record<string, string> = {
    HOLD: 'bg-[#ad422b]/5 text-[#ad422b] border-[#ad422b]/20',
    PENDING: 'bg-[#ad422b]/5 text-[#ad422b] border-[#ad422b]/20',
    PAID: 'bg-[#111111] text-white border-[#111111]',
    CONFIRMED: 'bg-[#111111] text-white border-[#111111]',
    FAILED: 'bg-[#ad422b]/5 text-[#ad422b] border-[#ad422b]/20',
    CANCELLED: 'bg-gray-100 text-gray-800 border-gray-200',
    EXPIRED: 'bg-gray-100 text-gray-800 border-gray-200'
  };
  return statusMap[status] || 'bg-gray-100 text-gray-800 border-gray-200';
};

export const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    HOLD: 'Menunggu Pembayaran',
    PENDING: 'Menunggu Pembayaran',
    PAID: 'Lunas',
    CONFIRMED: 'Terkonfirmasi',
    FAILED: 'Gagal',
    CANCELLED: 'Dibatalkan',
    EXPIRED: 'Kedaluwarsa'
  };
  return labels[status] || status;
};
