import type { User } from "@/Interfaces/User/UserInterfaces";
import type { OpeningHourInterface } from "@/Interfaces/Setting/OpeningHour";

export interface WorkShiftInterface {
  id: number;
  openingHourId: number;
  assignedUserId: number;
  validFrom?: string | null;
  validTo?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string | null;
  createdById?: number;
  updatedById?: number;
  openingHour: OpeningHourInterface;
  assignedUser: User;
  createdBy?: User;
  updatedBy?: User;
}

export type WorkShiftFormValues = {
  openingHourId: number;
  assignedUserId: number;
  validFrom?: Date | string | null;
  validTo?: Date | string | null;
  isActive: boolean;
};