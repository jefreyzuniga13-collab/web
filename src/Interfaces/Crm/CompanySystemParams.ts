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


export interface CompanySystemParamRequest {
    companyId: number;
    systemParamId: number;
    metaChannelId: number;
    isActive: boolean;
    value: string;
}


export interface CompanySystemParamProj {
    companyId: number;
    companyName: string;
    systemParamId: number;
    systemParamName: string;
    metaChannelId: number;
    metaChannelName: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    createdById: number;
    updatedById: number;
    createdByName: string;
    updatedByName: string;
    value: string;
}


export type MetaChannelOption = {
  id: number
  name: string
}

export const metaChannels: MetaChannelOption[] = [
  { id: 1, name: 'WhatsApp' },
  { id: 2, name: 'Messenger' },
  { id: 3, name: 'Instagram' },
]