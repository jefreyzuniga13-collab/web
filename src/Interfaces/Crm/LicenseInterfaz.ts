export interface LicenseRequest {
    name: string;
    description: string;
    isActive: boolean;
    isRecurrent: boolean;
    duration?: number; // Solo se requiere si isRecurrent es true
    benefits: string[]; // Lista de beneficios
}

export interface CompaniesLicenseRequest {
    licencesId: number;
    companyId: number;
    validFrom: string;
    validTo: string;
    isActive: boolean;
    isSuspended: boolean;
    isLocked: boolean;
    observation: string;
}

export interface LicenseProj {
    id: number;
    name: string;
    description: string;
    totalCount: number;
    createdById: number;
    isActive: boolean;
    createdByName: string;
    createdAt: string;
    updatedById: number;
    updatedByName: string;
    updatedAt: string;
    isRecurrent: boolean;
    duration?: number; // Solo se requiere si isRecurrent es true
    benefits: string[]; // Lista de beneficios
}

export interface CompaniesLicenseProj {
    id: number;
    licencesId: number;
    licenseName: string;
    createdById: number;
    createdByName: string;
    createdAt: string;
    updatedById: number;
    updatedByName: string;
    updatedAt: string;
    totalCount: number;
    companyId: number;
    companyName: string;
    validFrom: string;
    validTo: string;
    isActive: boolean;
    isSuspended: boolean;
    isLocked: boolean;
    observation:string  
}


export interface FormErrors {
  companyId: string
  licencesId: string
  validFrom: string
  validTo: string
  observation: string
}