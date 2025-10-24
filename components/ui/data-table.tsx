'use client';

import {
  type ColumnDef,
  type ColumnFiltersState,
  type ColumnMeta,
  type FilterFn,
  type GlobalFilterTableState,
  type RowData,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable
} from '@tanstack/react-table';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious
} from '@/components/ui/pagination';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';

import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { rankItem } from '@tanstack/match-sorter-utils';
import { Loader2 } from 'lucide-react';
import { Suspense, useCallback, useMemo, useState } from 'react';
import { Label } from './label';

type TableLoadingProps = {
  columns: ColumnDef<any, any>[];
};

const TableLoading = ({ columns }: TableLoadingProps) => {
  return (
    <TableRow>
      <TableCell colSpan={columns.length} className="h-24 text-center">
        <div className="mx-auto flex w-fit items-center gap-2">
          <Loader2 className="mx-auto h-6 w-6 animate-spin" />
          <span className="ml-2">Loading...</span>
        </div>
      </TableCell>
    </TableRow>
  );
};

type TableEmptyProps = {
  columns: ColumnDef<any, any>[];
};

const TableEmpty = ({ columns }: TableEmptyProps) => {
  return (
    <TableRow>
      <TableCell colSpan={columns.length} className="h-24 text-center">
        Tidak ada data.
      </TableCell>
    </TableRow>
  );
};

interface DataTableProps<TData> {
  columns: ColumnDef<TData, any>[];
  data: TData[];
  loading?: boolean;
  withAddButton?: boolean;
  withSearch?: boolean;
  children?: React.ReactNode;
  addButton?: React.ReactNode;
}

export function DataTable<TData>({
  columns,
  data,
  loading,
  addButton,
  withSearch = true,
  children
}: DataTableProps<TData>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10
  });

  const fuzzyFilter = useCallback<FilterFn<RowData>>((row, columnId, value, addMeta) => {
    // Rank the item
    const itemRank = rankItem(row.getValue(columnId), value as string);

    // Store the itemRank info
    addMeta({ itemRank });

    // Return if the item should be filtered in/out
    return itemRank.passed;
  }, []);

  const fallbackData = useMemo(() => data || [], [data]);

  const table = useReactTable({
    data,
    columns,
    pageCount: Math.ceil(fallbackData.length / pagination.pageSize),
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onPaginationChange: setPagination,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    globalFilterFn: 'fuzzy' as GlobalFilterTableState['globalFilter'],
    enableMultiSort: false,
    state: {
      sorting,
      pagination,
      columnFilters
    },
    filterFns: {
      fuzzy: fuzzyFilter
    }
  });

  const handleSearchChange = useCallback(
    (value: string) => {
      if (value) {
        table.setGlobalFilter(value);
      } else {
        table.setGlobalFilter(undefined);
      }
    },
    [table]
  );

  return (
    <div>
      <div className="flex items-center gap-4 py-4">
        {withSearch && (
          <Input
            placeholder="Search..."
            value={table.getState().globalFilter || ''}
            onChange={(event) => handleSearchChange(event.target.value)}
            className="max-w-60 text-sm"
            disabled={loading}
          />
        )}
        {addButton}
      </div>

      {children && <div className="py-2">{children}</div>}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const meta = header.column.columnDef.meta as ColumnMeta<TData, any>;
                  return (
                    <TableHead
                      key={header.id}
                      className="hover:!bg-gray-100 dark:hover:!bg-gray-800"
                      onClick={header.column.getToggleSortingHandler()}
                      style={{ width: meta?.width || 'auto' }}
                    >
                      <div
                        className={cn(
                          'flex-between relative p-3 text-nowrap select-none',
                          header.column.getCanSort() ? 'cursor-pointer' : 'cursor-default'
                        )}
                        style={{ width: meta?.width || 'auto' }}
                      >
                        <span className="mr-8">
                          {header.isPlaceholder
                            ? null
                            : flexRender(header.column.columnDef.header, header.getContext())}
                        </span>

                        {header.column.getCanSort() && (
                          <span
                            className={cn(
                              'absolute top-0 right-3 bottom-0 h-full w-3 before:absolute before:bottom-1/2 before:left-0 before:text-xs before:!leading-none before:text-gray-300 before:content-["▲"] after:absolute after:top-1/2 after:left-0 after:text-xs after:!leading-none after:text-gray-300 after:content-["▼"] dark:before:text-gray-500 dark:after:text-gray-500',
                              header.column.getIsSorted() === 'asc' &&
                                'before:text-primary dark:before:text-primary',
                              header.column.getIsSorted() === 'desc' &&
                                'after:text-primary dark:after:text-primary'
                            )}
                          />
                        )}
                      </div>
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            <Suspense fallback={<TableLoading columns={columns} />}>
              {loading ? (
                <TableLoading columns={columns} />
              ) : table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
                    {row.getVisibleCells().map((cell) => {
                      return (
                        <TableCell key={cell.id} className={cn('py-3 ps-5 whitespace-nowrap')}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))
              ) : (
                <TableEmpty columns={columns} />
              )}
            </Suspense>
          </TableBody>
        </Table>
      </div>
      <footer className="flex flex-wrap items-center justify-between gap-2 pt-4">
        <div className="flex items-center space-x-2 text-sm">
          <div className="flex items-center">
            <Label htmlFor="page-size" className="text-muted-foreground mr-2 text-sm">
              Rows per page:
            </Label>
            <Select
              onValueChange={(value) => {
                table.setPageSize(Number(value));
              }}
              defaultValue={table.getState().pagination.pageSize.toString()}
            >
              <SelectTrigger className="w-[80px]">
                <SelectValue placeholder="Page Size" />
              </SelectTrigger>
              <SelectContent>
                {[10, 20, 30, 40, 50].map((pageSize) => (
                  <SelectItem key={pageSize} value={pageSize.toString()}>
                    {pageSize}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mt-4 flex w-full items-center justify-center space-x-2 lg:mt-0 lg:w-fit lg:justify-end">
          <Pagination>
            <PaginationContent className="mx-auto lg:mx-0 lg:ml-auto lg:w-fit">
              <PaginationItem
                className={cn(
                  'cursor-pointer',
                  (!table.getCanPreviousPage() || loading) && 'cursor-not-allowed opacity-50'
                )}
              >
                <PaginationPrevious
                  onClick={() => table.previousPage()}
                  isActive={table.getCanPreviousPage() && !loading}
                />
              </PaginationItem>
              {table.getPageCount() > 0 ? (
                (() => {
                  const currentPage = table.getState().pagination.pageIndex;
                  const totalPages = table.getPageCount();
                  const pages: (number | 'ellipsis-left' | 'ellipsis-right')[] = [];

                  // Always show first page
                  pages.push(0);

                  // Show ellipsis if currentPage > 2
                  if (currentPage > 2) {
                    pages.push('ellipsis-left');
                  }

                  // Show previous, current, next (if in range)
                  for (
                    let i = Math.max(1, currentPage - 1);
                    i <= Math.min(totalPages - 2, currentPage + 1);
                    i++
                  ) {
                    pages.push(i);
                  }

                  // Show ellipsis if currentPage < totalPages - 3
                  if (currentPage < totalPages - 3) {
                    pages.push('ellipsis-right');
                  }

                  // Always show last page if more than one page
                  if (totalPages > 1) {
                    pages.push(totalPages - 1);
                  }

                  // Remove duplicates and sort
                  const uniquePages = Array.from(new Set(pages)).filter(
                    (p) =>
                      p === 'ellipsis-left' ||
                      p === 'ellipsis-right' ||
                      (typeof p === 'number' && p >= 0 && p < totalPages)
                  );

                  return uniquePages.map((page, idx) => {
                    if (page === 'ellipsis-left') {
                      return (
                        <PaginationItem key={`ellipsis-left-${idx}`}>
                          <PaginationEllipsis
                            onClick={() => table.setPageIndex(Math.max(currentPage - 2, 0))}
                            className="cursor-pointer"
                          />
                        </PaginationItem>
                      );
                    }
                    if (page === 'ellipsis-right') {
                      return (
                        <PaginationItem key={`ellipsis-right-${idx}`}>
                          <PaginationEllipsis
                            onClick={() =>
                              table.setPageIndex(Math.min(currentPage + 2, totalPages - 1))
                            }
                            className="cursor-pointer"
                          />
                        </PaginationItem>
                      );
                    }
                    if (typeof page === 'number') {
                      return (
                        <PaginationItem
                          key={page}
                          className={cn('cursor-pointer', currentPage === page && 'rounded')}
                        >
                          <PaginationLink
                            isActive={currentPage === page}
                            onClick={() => table.setPageIndex(page)}
                          >
                            {page + 1}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    }
                    return null;
                  });
                })()
              ) : (
                <div className="flex items-center gap-1 px-2 text-sm font-medium">No results</div>
              )}

              <PaginationItem
                className={cn(
                  'cursor-pointer',
                  (!table.getCanNextPage() || loading) && 'cursor-not-allowed opacity-50'
                )}
              >
                <PaginationNext
                  onClick={() => table.nextPage()}
                  isActive={table.getCanNextPage() && !loading}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      </footer>
    </div>
  );
}
