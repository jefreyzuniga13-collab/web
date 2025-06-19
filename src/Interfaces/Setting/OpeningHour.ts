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
  id: keyof T;
  label: string;
  minWidth?: number;
  align?: 'right';
  format?: (value: any) => string;
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

export interface OpeningHourInterface{
    id: number;
    name: string;
    description: string;
    startTime: string;
    endTime: string;
    isHoliday: boolean;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;

    createdById: number;
    updatedById: number;
    createdBy: User;
    updatedBy: User;
}
