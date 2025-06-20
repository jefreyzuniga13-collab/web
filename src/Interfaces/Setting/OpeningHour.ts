/* eslint-disable @typescript-eslint/no-explicit-any */
import type { User } from "@/Interfaces/User/UserInterfaces";

// export interface Column {
//   id: 'id' | 'name' | 'description' | 'isActive' | 'startTime' | 'endTime' | 'isHoliday';
//   label: string;
//   minWidth?: number;
//   align?: 'right';
//   format?: (value: number) => string;
// }


export interface Column<T> {
  id: Extract<keyof T, string> | 'actions'
  label: string
  minWidth?: number
  align?: 'left'|'right'|'center'
  format?: (v:any)=>string
  render?: (row: T)=>React.ReactNode
}

export interface Data {
  name: string;
  code: string;
  population: number;
  size: number;
  density: number;
}

// export interface  Props {
//   columns: Column[];
//   rows: Data[]
// }

export interface Props<T> {
  columns: Column<T>[];
  rows: T[];
}


export interface OpeningHourInterface {
  id: number;
  name: string;
  description: string;
  startTime: string | null;   // 'HH:mm'
  endTime: string | null;     // 'HH:mm'
  isHoliday: boolean;
  holidayDate: { day: number; month: number } | null;
  isActive: boolean;
  createdAt: string;   // ISO
  updatedAt: string;   // ISO
  createdById: number;
  updatedById: number;
  createdBy: User;
  updatedBy: User;
}

/**
 * Payload que envía el formulario (sin metadatos ni IDs).
 */
export type OpeningHourFormValues = Omit<
  OpeningHourInterface,
  | 'id'
  | 'createdAt'
  | 'updatedAt'
  | 'createdBy'
  | 'updatedBy'
  | 'createdById'
  | 'updatedById'
>;
