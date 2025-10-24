'use client';

import { createColumnHelper } from '@tanstack/react-table';
import { formatNumber } from '@/lib/utils';
import dayjs from 'dayjs';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/data-table';

const dummyTableData = [
  {
    id: '250301-1230-SKAO',
    name: 'Makanan Kucing Premium',
    category: 'Makanan',
    price: 150000,
    status: 'Dibayar',
    date: '2024-06-01'
  },
  {
    id: '250301-1231-SKAO',
    name: 'Pasir Kucing Wangi',
    category: 'Aksesoris',
    price: 50000,
    status: 'Dibayar',
    date: '2024-06-02'
  },
  {
    id: '250301-1232-SKAO',
    name: 'Vitamin Anjing',
    category: 'Obat',
    price: 75000,
    status: 'Menunggu',
    date: '2024-06-03'
  },
  {
    id: '250301-1233-SKAO',
    name: 'Mainan Kucing Bola',
    category: 'Mainan',
    price: 30000,
    status: 'Dibatalkan',
    date: '2024-06-04'
  },
  {
    id: '250301-1234-SKAO',
    name: 'Makanan Anjing Premium',
    category: 'Makanan',
    price: 180000,
    status: 'Dibayar',
    date: '2024-06-05'
  },
  {
    id: '250301-1235-SKAO',
    name: 'Shampoo Kucing',
    category: 'Perawatan',
    price: 40000,
    status: 'Dibayar',
    date: '2024-06-06'
  },
  {
    id: '250301-1236-SKAO',
    name: 'Kandang Anjing Besar',
    category: 'Aksesoris',
    price: 350000,
    status: 'Menunggu',
    date: '2024-06-07'
  },
  {
    id: '250301-1237-SKAO',
    name: 'Obat Cacing Kucing',
    category: 'Obat',
    price: 25000,
    status: 'Dibayar',
    date: '2024-06-08'
  },
  {
    id: '250301-1238-SKAO',
    name: 'Mainan Anjing Tali',
    category: 'Mainan',
    price: 45000,
    status: 'Dibayar',
    date: '2024-06-09'
  },
  {
    id: '250301-1239-SKAO',
    name: 'Makanan Kucing Ekonomis',
    category: 'Makanan',
    price: 90000,
    status: 'Dibatalkan',
    date: '2024-06-10'
  },
  {
    id: '250301-1240-SKAO',
    name: 'Vitamin Kucing',
    category: 'Obat',
    price: 60000,
    status: 'Dibayar',
    date: '2024-06-11'
  }
];

const RecentTransactionSection = () => {
  const colHelper = createColumnHelper<(typeof dummyTableData)[number]>();
  const columns = [
    colHelper.accessor('id', {
      header: 'ID',
      cell: (info) => info.getValue(),
      meta: {
        ps: '5',
        width: 150
      }
    }),
    colHelper.accessor('name', {
      header: 'Nama Produk',
      cell: (info) => info.getValue(),
      meta: {
        ps: '5',
        width: 200
      }
    }),
    colHelper.accessor('category', {
      header: 'Kategori',
      cell: (info) => info.getValue(),
      meta: {
        ps: '5',
        width: 100
      }
    }),
    colHelper.accessor('price', {
      header: 'Harga',
      cell: (info) => `Rp ${formatNumber(info.getValue() as number)}`,
      meta: {
        ps: '5',
        width: 100
      }
    }),
    colHelper.accessor('status', {
      header: 'Status',
      cell: (info) => {
        const status = info.getValue();
        let variant: 'default' | 'success' | 'warning' | 'destructive' = 'default';
        if (status === 'Dibayar') variant = 'success';
        else if (status === 'Menunggu') variant = 'warning';
        else if (status === 'Dibatalkan') variant = 'destructive';
        return <Badge variant={variant}>{status}</Badge>;
      },
      meta: {
        ps: '5',
        width: 100
      }
    }),
    colHelper.accessor('date', {
      header: 'Tanggal',
      cell: (info) => dayjs(info.getValue() as string).format('DD MMM YYYY'),
      meta: {
        ps: '5',
        width: 120
      }
    })
  ];

  return (
    <section className="mt-6">
      <DataTable data={dummyTableData} columns={columns} />
    </section>
  );
};
export default RecentTransactionSection;
