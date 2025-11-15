export const getStatusColor = (status: string) => {
  const statusMap: Record<string, string> = {
    HOLD: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    PAID: 'bg-green-100 text-green-800 border-green-200',
    CONFIRMED: 'bg-green-100 text-green-800 border-green-200',
    FAILED: 'bg-red-100 text-red-800 border-red-200',
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
    EXPIRED: 'Kadaluarsa'
  };
  return labels[status] || status;
};
