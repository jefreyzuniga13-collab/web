/* eslint-disable @typescript-eslint/no-explicit-any */


// export interface Column {
//   id: 'id' | 'name' | 'description' | 'isActive' | 'startTime' | 'endTime' | 'isHoliday';
//   label: string;
//   minWidth?: number;
//   align?: 'right';
//   format?: (value: number) => string;
// }


export type ColumnBreakpoint = 'sm' | 'md' | 'lg'

export interface Column<T> {
  id: Extract<keyof T, string> | 'actions'
  label: string
  minWidth?: number
  align?: 'left' | 'right' | 'center'
  format?: (v: any) => string
  render?: (row: T) => React.ReactNode
  hideBelow?: ColumnBreakpoint
}


// export interface Data {
//   name: string;
//   code: string;
//   population: number;
//   size: number;
//   density: number;
// }

// export interface  Props {
//   columns: Column[];
//   rows: Data[]
// }

export interface Props<T> {
  columns: Column<T>[];
  rows: T[];
   count: number
  /** Página actual (0-indexed) */
  page: number
  /** Filas por página */
  rowsPerPage: number
  /** Opciones de filas por página */
  rowsPerPageOptions?: number[]
  loading?: boolean
  onPageChange: (event: unknown, newPage: number) => void
  onRowsPerPageChange: (event: React.ChangeEvent<HTMLInputElement>) => void
}