export interface WorkOrderRequestDto{
    clientId: number;
    addres: string;
    signInSheet: Date;
    signOutSheet: Date;
    ServiceDescripcion: string;
    observation: string;
}

export interface WorkOrderResponseDto{
    id: number;
    clientId: number;
    clientName: string;
    address: string;
    signInSheet: Date | string;
    signOutsheet: Date | string;
    observation: string;
    serviceObservation: string;
    createdId: number;
    createdByName: string;

}
export interface generalAttachmentResponseDto{
    id: number;
    mediaId: string;
    fileName?: string;
    workOrderId: number;
    mimeType?: string;
    mediaUrl?: string;
    createdAt: Date;
    createdById: number;
    createdByName: string;
    updatedById?: number;
    updatedByName?: string;
}

export interface WorkOrderContactLogsResponseDto{
    workOrderId: number;
    workOrderName: string;
    contactLogsId: number;
    contactLogName: string;
    createdAt: Date;
    updatedAt: Date;
    isActive: boolean;
}