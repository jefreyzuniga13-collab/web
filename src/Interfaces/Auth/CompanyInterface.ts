export interface CompanySelectorItem {
  companyId: number
  empresaId?: string | null
  name: string
  code?: string | null
  imageUrl?: string | null
  isActive?: boolean
  whatsAppPhone?: string
}

export interface ActiveCompanyState {
  activeCompanyId: number | null;
  activeCompanyName: string;
  activeCompanyImage: string;
  isGlobalMode: boolean;
  whatsAppPhone:string,
}

export interface CompanyState extends ActiveCompanyState {
  companies: CompanySelectorItem[];
}