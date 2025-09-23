export interface ContactIdResultInterface{
    id: number
}

export interface INNOVAClientResultInterface{
    clientId?: string;
    clientName?: string;
    companyName?: string;
}

export interface InnovaClient{
    codCliente: string;
    nombre: string;
    telefono: string;
    celular: string;
    direccion: string;
    finalContrato: string;
    saldoUltimoCorte: number
}