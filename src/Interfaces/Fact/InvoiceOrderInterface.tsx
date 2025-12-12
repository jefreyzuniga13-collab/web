export interface InvoiceOrderRequestDto {
  idUsuario: string;
  nombrede: string;
  noPedido: number;
  registroMaquina: string;
  noIdentificacion: string;
  observaciones: string;
  transporte: number;
  propina: number;
  tipoServicio: number;
  idEstado: number;
  codSucursal?: string;
  direcciones: Direcciones;
  detPago: DetPago; 
}

interface Direcciones {
  idDireccion: number;
  nombre: string;
  descripcion: string;
  referencia: string;
  latitud: number;
  longitud: number;
}

interface DetPago {
  codPago: number;
  monto: number;
  codBanco: string;
  montoC: number;
  cambio: number;
  valor_Pagar: number;
  nomsol: string;
  registro_maquina: string;
  codPagoNew: number;
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


export interface SendOrderMessage{
  conversationId: number;
  orderId: number;
  userId: number;
}