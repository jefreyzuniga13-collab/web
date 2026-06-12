export enum ContactStatus {
    New,
    PendingApproval,
    Approved,
    Rejected,
    AwaitingFullName,
    AwaitingIdType,
    AwaitingIdCard,
    AwaitingPassword,
    AwaitingResidenceCard,
    AwaitingCompanyName,
    Completed
}

export interface ContactLogProj {
  id: number;
  psid?: string | null;
  phone?: string | null;
  waId?: string | null;
  waName?: string | null;
  waUserId?: string | null;
  fullName?: string | null;
  companyName?: string | null;
  status: ContactStatus | string;
  isProvidingData?: boolean | null;
  isBlocked?: boolean | null;

  totalRecords: number;
  totalByClassification: number;

  contactClassificationId: number;
  contactClassificationName: string;
  contactClassificationIcono: string;
  contactClassificationBgColor: string;
  clasificacion?: string | null;
}

export interface ContactClassificationGroupProj {
  contactClassificationId: number;
  classification: string;
  icono: string;
  bgColor: string;
  total: number;
  pageNumber: number;
  pageSize: number;
  hasMore: boolean;
  items: ContactLogProj[];
}