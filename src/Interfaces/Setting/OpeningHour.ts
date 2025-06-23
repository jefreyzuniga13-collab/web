/* eslint-disable @typescript-eslint/no-explicit-any */
import type { User } from "@/Interfaces/User/UserInterfaces";

export type RecurrenceType = 'Weekly' | 'AnnualHoliday' | 'OneTimeHoliday';

export interface Column<T> {
  id: Extract<keyof T, string> | 'actions';
  label: string;
  minWidth?: number;
  align?: 'left' | 'right' | 'center';
  format?: (v: any) => string;
  render?: (row: T) => React.ReactNode;
}

export interface DayMonth {
  day: number;
  month: number;
}

export interface OpeningHourInterface {
  id: number;
  name: string;
  description?: string;
  recurrence: RecurrenceType;
  daysOfWeek?: string[];
  holidayDate?: DayMonth | null;
  specificDate?: string | null;
  startTime: string | null;
  endTime: string | null;
  effectiveFrom?: string | null;
  effectiveTo?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string | null;
  createdById?: number;
  updatedById?: number;
  createdBy?: User;
  updatedBy?: User;
}

/**
 * Payload que envía el formulario (sin metadatos ni IDs).
 */
export type OpeningHourFormValues = {
  name: string;
  description?: string;
  recurrence: RecurrenceType;
  daysOfWeek?: string[];
  holidayDate?: DayMonth | null;
  specificDate?: Date | string | null;
  startTime: string | null;
  endTime: string | null;
  effectiveFrom?: Date | string | null;
  effectiveTo?: Date | string | null;
  isActive: boolean;
};

export type OpeningHourFormState = {
  name: string;
  description?: string;
  recurrence: RecurrenceType;
  daysOfWeek: string[];
  holidayDate: Date | null;
  specificDate: Date | null;
  startTime: Date | null;
  endTime: Date | null;
  effectiveFrom: Date | null;
  effectiveTo: Date | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};