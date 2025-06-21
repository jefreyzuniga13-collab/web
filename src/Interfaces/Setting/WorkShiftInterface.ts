import type { User } from "@/Interfaces/User/UserInterfaces";
import type { OpeningHourInterface } from "@/Interfaces/Setting/OpeningHour";

export interface WorkShiftInterface{
    id: number;
    openingHourId: number;
    assingedUserId: number;
    createdById: number;
    updatedById: number;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    openingHour: OpeningHourInterface;
    assignedUser: User;
    createdBy: User;
    updateBy: User;
}