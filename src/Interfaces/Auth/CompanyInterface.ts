export interface CompanySelectorItem {
  companyId: number;
  name: string;
  code?: string | null;
  imageUrl?: string | null;
  isActive?: boolean;
}

export interface ActiveCompanyState {
  activeCompanyId: number | null;
  activeCompanyName: string;
  isGlobalMode: boolean;
}

export interface CompanyState extends ActiveCompanyState {
  companies: CompanySelectorItem[];
}