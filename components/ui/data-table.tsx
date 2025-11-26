'use client';

import {
  type ColumnDef,
  type ColumnFiltersState,
  type ColumnMeta,
  type FilterFn,
  type GlobalFilterTableState,
  type RowData,
  type RowSelectionState,
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
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

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { rankItem } from '@tanstack/match-sorter-utils';
import { Loader2, Settings2 } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
        No data found.
      </TableCell>
    </TableRow>
  );
};

interface DataTableProps<TData extends RowData> {
  columns: ColumnDef<TData, any>[];
  data: TData[];
  loading?: boolean;
  /** Search box */
  enableGlobalSearch?: boolean;
  /** Optional add button on the top-right */
  addButton?: React.ReactNode;
  /** Extra content above the table (filters, etc.) */
  children?: React.ReactNode;

  /** Enable row multi-select checkboxes (default: true) */
  enableRowSelection?: boolean;
  /** Optional external row-id getter (recommended if your rows don't have `id`) */
  getRowId?: (originalRow: TData, index: number, parent?: any) => string;
  /** Called whenever selection changes (array of selected row ids) */
  onSelectionChange?: (selectedIds: string[]) => void;
  /** Custom bulk actions shown when there are selected rows */
  bulkActions?: React.ReactNode;

  /** Start with all columns visible; user can show/hide via dropdown (default: true) */
  enableColumnVisibility?: boolean;
  enableExpandAllRows?: boolean;
  enablePagination?: boolean;
  enablePageSize?: boolean;

  /** Server-side pagination support */
  serverSide?: boolean;
  /** Total count from server (required for server-side pagination) */
  totalCount?: number;
  /** Callback when pagination changes (page or pageSize) */
  onPaginationChange?: (page: number, pageSize: number) => void;
}

export function DataTable<TData extends RowData>({
  columns,
  data,
  loading,
  addButton,
  enableGlobalSearch = true,
  children,

  enableRowSelection = true,
  getRowId,
  onSelectionChange,
  bulkActions,

  enableColumnVisibility = true,
  enableExpandAllRows = false,
  enablePagination = true,
  enablePageSize = true,

  serverSide = false,
  totalCount,
  onPaginationChange,

  /**
   * Optional: Provide a function to return sub rows for a given row.
   * If provided, enables expandable rows.
   */
  getSubRows,
  /**
   * Optional: Render function for sub row content.
   */
  renderSubRow
}: DataTableProps<TData> & {
  getSubRows?: (row: any) => TData[] | undefined;
  renderSubRow?: (row: any) => React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Initialize pagination from URL params if serverSide is enabled
  const getInitialPagination = useCallback(() => {
    if (serverSide && searchParams) {
      const page = searchParams.get('page');
      const limit = searchParams.get('limit');
      return {
        pageIndex: page ? parseInt(page) - 1 : 0, // Convert 1-based to 0-based
        pageSize: limit ? parseInt(limit) : 10
      };
    }
    return { pageIndex: 0, pageSize: 10 };
  }, [serverSide, searchParams]);

  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [pagination, setPagination] = useState(getInitialPagination());
  const [expanded, setExpanded] = useState({});
  const isInitialMount = useRef(true);

  const fuzzyFilter = useCallback<FilterFn<RowData>>((row, columnId, value, addMeta) => {
    const itemRank = rankItem(row.getValue(columnId), value as string);
    addMeta({ itemRank });
    return itemRank.passed;
  }, []);

  const fallbackData = useMemo(() => data || [], [data]);

  // Calculate page count based on pagination mode
  const pageCount = useMemo(() => {
    if (!enablePagination) return 1;
    if (serverSide && totalCount !== undefined) {
      return Math.ceil(totalCount / pagination.pageSize);
    }
    return Math.ceil(fallbackData.length / pagination.pageSize);
  }, [enablePagination, serverSide, totalCount, pagination.pageSize, fallbackData.length]);

  // Selection column (checkboxes)
  const selectionColumn = useMemo<ColumnDef<TData>>(
    () => ({
      id: '_select',
      enableSorting: false,
      enableHiding: false,
      size: 50,
      header: ({ table }) => {
        const isAllSelected = table.getIsAllRowsSelected();
        const isSomeSelected = table.getIsSomeRowsSelected();
        return (
          <div className="flex-center">
            <Checkbox
              checked={isAllSelected || (isSomeSelected && 'indeterminate')}
              onCheckedChange={(checked) => table.toggleAllRowsSelected(!!checked)}
              aria-label="Select all"
            />
          </div>
        );
      },
      cell: ({ row }) => (
        <div className="pl-2">
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(checked) => row.toggleSelected(!!checked)}
            aria-label="Select row"
          />
        </div>
      ),
      meta: { width: 50 } as ColumnMeta<TData, any>
    }),
    []
  );

  const columnsWithSelection = useMemo(
    () => (enableRowSelection ? [selectionColumn, ...columns] : columns),
    [columns, enableRowSelection, selectionColumn]
  );

  // Sync pagination changes with URL params and parent component
  useEffect(() => {
    if (serverSide) {
      const page = pagination.pageIndex + 1; // Convert 0-based to 1-based
      const limit = pagination.pageSize;

      // Update URL params
      const params = new URLSearchParams(searchParams?.toString() || '');
      const currentPage = params.get('page');
      const currentLimit = params.get('limit');

      // Only update if values actually changed
      if (currentPage !== page.toString() || currentLimit !== limit.toString()) {
        params.set('page', page.toString());
        params.set('limit', limit.toString());
        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
      }

      // Notify parent component (skip on initial mount)
      if (!isInitialMount.current) {
        onPaginationChange?.(page, limit);
      } else {
        isInitialMount.current = false;
      }
    }
  }, [pagination.pageIndex, pagination.pageSize, serverSide, pathname]);

  const table = useReactTable({
    data,
    columns: columnsWithSelection,
    pageCount,
    getRowId,
    getSubRows,
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    onColumnFiltersChange: setColumnFilters,
    onRowSelectionChange: setRowSelection,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getExpandedRowModel: getSubRows ? getExpandedRowModel() : undefined,
    onExpandedChange: setExpanded,
    globalFilterFn: 'fuzzy' as GlobalFilterTableState['globalFilter'],
    enableMultiSort: false,
    enableRowSelection,
    manualPagination: serverSide,
    state: {
      sorting,
      pagination,
      columnFilters,
      rowSelection,
      columnVisibility,
      expanded
    },
    filterFns: { fuzzy: fuzzyFilter }
  });

  // If enablePagination is false, show all rows; otherwise use paginated rows
  const rowModel = enablePagination ? table.getRowModel() : table.getPrePaginationRowModel();

  // expose selected ids upward
  const selectedRowIds = useMemo(
    () => table.getSelectedRowModel().rows.map((r) => r.id),
    [table, rowSelection]
  );
  // notify parent (if requested)
  if (onSelectionChange) {
    // call synchronously in render is fine for idempotent callbacks, but to be safe:
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useMemo(() => {
      onSelectionChange(selectedRowIds);
    }, [selectedRowIds.join('|')]);
  }

  const handleSearchChange = useCallback(
    (value: string) => {
      table.setGlobalFilter(value || undefined);
    },
    [table]
  );

  const handleExpandAll = () => {
    table.toggleAllRowsExpanded();
    setPagination((old) => ({
      ...old,
      pageIndex: 0
    }));
  };

  const hasSelection = selectedRowIds.length > 0;

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 py-4">
        {enableGlobalSearch && (
          <Input
            placeholder="Search..."
            value={table.getState().globalFilter || ''}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="max-w-60 text-sm"
            disabled={loading}
          />
        )}

        <div className="flex items-center gap-2">{addButton}</div>

        {/* Right-side actions */}
        {enableColumnVisibility && (
          <div className="flex-center ml-auto gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2" disabled={loading}>
                  <Settings2 className="h-4 w-4" />
                  View
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>Toggle Columns</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {table
                  .getAllLeafColumns()
                  .filter((col) => col.id !== '_select' && col.getCanHide())
                  .map((column) => (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(v) => column.toggleVisibility(!!v)}
                    >
                      {column.id === 'id'
                        ? 'ID'
                        : column.id
                            .replace(/([A-Z])/g, ' $1')
                            .trim()
                            .toLowerCase()}
                    </DropdownMenuCheckboxItem>
                  ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}

        {enableExpandAllRows && (
          <div className="flex-center">
            <Button variant="outline" size="sm" onClick={handleExpandAll} disabled={loading}>
              {table.getIsAllRowsExpanded() ? 'Collapse All' : 'Expand All'}
            </Button>
          </div>
        )}
      </div>

      {/* Bulk actions bar */}
      {hasSelection && (
        <div className="mb-3 flex items-center justify-between rounded-md border px-3 py-2 text-sm">
          <div className="text-muted-foreground">{selectedRowIds.length} selected</div>
          <div className="flex items-center gap-2">
            {bulkActions}
            <Button variant="ghost" size="sm" onClick={() => table.resetRowSelection()}>
              Clear
            </Button>
          </div>
        </div>
      )}

      {children && <div className="py-2">{children}</div>}

      <div className="mt-1 rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const meta = header.column.columnDef.meta as ColumnMeta<TData, any>;
                  return (
                    <TableHead
                      key={header.id}
                      className={cn(
                        'hover:!bg-gray-100 dark:hover:!bg-gray-800',
                        header.column.id === '_select' && 'w-9'
                      )}
                      onClick={
                        header.column.getCanSort()
                          ? header.column.getToggleSortingHandler()
                          : undefined
                      }
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

                        {header.column.getCanSort() && header.column.id !== '_select' && (
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
            <Suspense fallback={<TableLoading columns={columnsWithSelection} />}>
              {loading ? (
                <TableLoading columns={columnsWithSelection} />
              ) : rowModel.rows?.length ? (
                rowModel.rows.flatMap((row) => {
                  const mainRow = (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() && 'selected'}
                      className={cn(row.getIsSelected() && 'bg-muted/40')}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell
                          key={cell.id}
                          className={cn(
                            'py-3 ps-5 whitespace-nowrap',
                            cell.column.id === '_select' && 'ps-3'
                          )}
                        >
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  );
                  const subRow =
                    row.getIsExpanded() && getSubRows && renderSubRow ? (
                      <TableRow key={row.id + '-sub'}>
                        <TableCell
                          colSpan={columnsWithSelection.length}
                          className="bg-gray-50 dark:bg-gray-900"
                        >
                          {renderSubRow(row.original)}
                        </TableCell>
                      </TableRow>
                    ) : null;
                  return subRow ? [mainRow, subRow] : [mainRow];
                })
              ) : (
                <TableEmpty columns={columnsWithSelection} />
              )}
            </Suspense>
          </TableBody>
        </Table>
      </div>

      <footer className="flex flex-wrap items-center justify-between gap-2 pt-4">
        {enablePageSize && (
          <div className="flex items-center space-x-2 text-sm">
            <div className="flex items-center">
              <Label htmlFor="page-size" className="text-muted-foreground mr-2 text-sm">
                Rows per page:
              </Label>
              <Select
                value={table.getState().pagination.pageSize.toString()}
                onValueChange={(value) => table.setPageSize(Number(value))}
              >
                <SelectTrigger className="w-20">
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
        )}

        {enablePagination && (
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

                    pages.push(0);
                    if (currentPage > 2) pages.push('ellipsis-left');
                    for (
                      let i = Math.max(1, currentPage - 1);
                      i <= Math.min(totalPages - 2, currentPage + 1);
                      i++
                    ) {
                      pages.push(i);
                    }
                    if (currentPage < totalPages - 3) pages.push('ellipsis-right');
                    if (totalPages > 1) pages.push(totalPages - 1);

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
        )}
      </footer>
    </div>
  );
}
