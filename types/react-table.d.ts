/* eslint-disable @typescript-eslint/no-unused-vars */
import '@tanstack/react-table';
import type { BuiltInFilterFn, FilterFn } from '@tanstack/react-table';

declare module '@tanstack/react-table' {
  interface ColumnMeta<TData extends RowData, TValue> {
    ps?: string;
    width?: number | string;
  }
}

export interface GlobalFilterTableState<TData extends AnyData> {
  globalFilter: FilterFnOption<TData>;
}

export type FilterFnOption<TData extends AnyData> = 'auto' | 'fuzzy';
