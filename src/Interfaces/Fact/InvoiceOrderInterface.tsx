export interface InvoiceOrderRequestDto{
    idUsuario: number;
    nombrede: string;
    registroMaquina: string;
    noIdentificacion: string;
    observaciones: string;
    transporte: number; // distancia en km
    propina: number //Opcional
    tipoServicio: number;
    idEstado: number;
    codSucursal?: string;
    direcciones: Direcciones[];
    detPago: DetPago[]
    
}

//recupera, la informacion el uso de un map picker
interface Direcciones{
    idDireccion: number;
    nombre: string;
    referencia: string;
    latitud: number;
    longitud: number;
}

interface DetPago{
    codPago: number;
    monto: number;
    codBanco: string;
    montoC: number
    cambio: number;
    valor_Pagar: number;
    nomsol: string;
    registro_maquina: string;
    codPagoNew: number
}


// Get last invoice order
export interface InvoiceOrderInterface{
    noFactura: string;
    fechaFactura: string;
    totalPago: number;
    estado: string;
    cantidadProductos: number;
    descSucursal: string

}

//divisas
export interface Currencyto{
    codPago: number;
    descripcion_Pago: string;
    moneda_Fija: string;
    codExterno: string;
    codigo_Banco: string
}

export interface NearestBranchRequestDto{
    latitud :number;
    longitud: number;
}

export interface NearestBranchResponseDto{
    codSucursal: string;
    sucursal: string;
    serie: string;
    latitud: number;
    longitud: number;
}