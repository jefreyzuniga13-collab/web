import type { User } from "../User/UserInterfaces";

export type ContactStatus =
  | 'New'
  | 'PendingApproval'
  | 'Approved'
  | 'Rejected'
  | 'AwaitingFullName'
  | 'AwaitingIdCard'
  | 'Completed';

export type IdType = 
  | 'NationalCard'
  | 'Passport'
  | 'ResidenceCard';

  export interface ContactLogInterface{
    id: number | null;
    waName: string | null;
    waId: string | null;
    waUserId?: string | null;
    phone: string;
    idCard?: string | null;
    passport?: string | null;
    idType: IdType | null;
    residenceCard?: string | null;
    fullName?: string | null;
    companyName?: string;
    companyId?: number | null;
    isVerified?: boolean | null;
    isActive?: boolean | null;
    status: ContactStatus | null;
    createdAt: string | null;
    updatedAt?: string | null;
    verifiedAt?: string | null;
    verifiedId?: number | null;
    verifiedBy?: User | null;
}