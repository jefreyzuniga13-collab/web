export interface CompanySystemParamsInterface{
    companyId: number;
    systemParamId: number;
    metaChannelId: number;
    isActive: boolean;
    createdAt: string;
    updatedAt?: string; 
    createdById?: string;
    updatedById?: string;
    id?: number;
}