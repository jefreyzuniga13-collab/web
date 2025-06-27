import type { User } from "../User/UserInterfaces";

export type ContactStatus =
  | 'New'
  | 'PendingApproval'
  | 'Approved'
  | 'Rejected'
  | 'AwaitingFullName'
  | 'AwaitingIdCard'
  | 'Completed';

  export interface ContactLogInterface{
    id: number;
    waName: string;
    waId: string | null;
    waUserId?: string | null;
    phone: string;
    idCard?: string;
    fullName?: string;
    companyName?: string;
    companyId?: number | null;
    isVerified?: boolean;
    status: ContactStatus | null;
    createdAt: string;
    updatedAt?: string;
    verifiedAt?: string;
    verifiedId?: number;
    verifiedBy?: User;
}