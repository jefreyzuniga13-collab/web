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


//ImprimeOrdenFactura
export interface PrintOrdenFactInterfaceRaw {
  DatosGenerales: {
    NoFactura: string
    FechaFactura: string
    Nombrede: string
  }
  DatosDireccion: {
    Nombre: string
    Descripcion: string
    Referencia: string
  }
  Carrito: Array<{
    Codigo: string
    Descripcion: string
    Imagen: string
    UnidadMedida: string
    Precio: number
    TotalMenu: number
    Opciones: Array<{
      Codigo: string
      Descripcion: string
      Cantidad: number
      UnidadMedida: string
      Precio: number
      TotalMenu: number
    }> | null
  }>
  DetallePago: {
    Valor_Pagar: number
    SubTotal: number
    Descuento: number
    Iva: number
    TotalPago: number
    MetodoPago: string
    Monto: number
    Propina: number
    Transporte: number
  }
}


//Checkout

export type CheckoutStep = "currency" | "location" | "paymentMethod";
export type PaymentMethod = "card" | "cash" | "transfer";

export interface BillingFormState {
  firstName: string;
  lastName: string;
  email: string;
  country: string;
  city: string;
  address: string;
  addressName: string;
}

export interface CardFormState {
  cardNumber: string;
  expiry: string;
  cvc: string;
  nameOnCard: string;
}