export interface DynamicParamRequiestDto{
    publicId?: string;//funciona para evitar exponer el id del identity de la base de datos
    name: string;
    description?: string;
    type: string;// puede ser de duracion de tiempo o de rating
    minValue: number;
    maxValue: number;
    label?: string;
    value: string;
    sortOrder?: number;
    isActive: boolean

    userIds?: number[];
}

export interface DynamicParamResponseDto{
    publicId: string;
    name: string;
    description?: string;
    type: string;
    minValue: number;
    maxValue: number;
    label?: string;
    value: string;
    sortOrder?: number;
    isActive: boolean;
    createdAt?: Date;
    updatedAt?: Date;
    createdByFullName?: string;
    updatedByFullName?: string

    // Datos de los usauarios a los que aplica
     userIds?: number[];
}