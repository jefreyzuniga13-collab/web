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
    waId: string;
    waUserId?: string;
    phone: string;
    idCard?: string;
    fullName?: string;
    companyId?: number;
    isVerified?: boolean;
    status: ContactStatus;
    createdAt: string;
    updatedAt?: string;
}