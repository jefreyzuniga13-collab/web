export interface InvoiceOrderRequestDto {
  idUsuario: string
  nombrede: string
  noPedido: number
  registroMaquina: string
  noIdentificacion: string
  observaciones: string
  transporte: number
  propina: number
  tipoServicio: number
  idEstado: number
  codSucursal?: string
  direcciones: Direcciones
  detPago: DetPago
}

/**
 * Dirección enviada al servicio de orden.
 *
 * En el flujo de solo texto, latitud y longitud pueden enviarse en cero
 * porque la dirección no proviene del mapa.
 */
export interface Direcciones {
  idDireccion: number
  nombre: string
  descripcion: string
  referencia: string
  latitud: number
  longitud: number
}

/**
 * Detalle de pago enviado al servicio de orden.
 */
export interface DetPago {
  codPago: number
  monto: number
  codBanco: string
  montoC: number
  cambio: number
  valor_Pagar: number
  nomsol: string
  registro_maquina: string
  codPagoNew: number
}

/**
 * Última orden facturada.
 */
export interface InvoiceOrderInterface {
  noFactura: string
  fechaFactura: string
  totalPago: number
  estado: string
  cantidadProductos: number
  descSucursal: string
}

/**
 * Forma de pago disponible.
 */
export interface Currencyto {
  codPago: string
  descripcion_Pago: string
  moneda_Fija: string
  codExterno: string
  codigo_Banco: string
}

/**
 * Solicitud para enviar el mensaje relacionado a una orden.
 */
export interface SendOrderMessage {
  conversationId: number
  orderId: number
  userId: number
}

/**
 * Respuesta utilizada para generar el PDF de la orden facturada.
 */
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
    Cantidad: number
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

/**
 * Pasos disponibles dentro del checkout.
 */
export type CheckoutStep = "currency" | "location" | "paymentMethod"

/**
 * Métodos básicos utilizados por formularios antiguos.
 */
export type PaymentMethod = "card" | "cash" | "transfer"

/**
 * Datos de facturación y dirección del checkout.
 *
 * Para dirección de solo texto:
 * - address es obligatorio.
 * - addressName es opcional.
 * - city se utiliza como referencia opcional.
 * - no se requieren coordenadas.
 */
export interface BillingFormState {
  firstName: string
  lastName: string
  email: string
  country: string
  city: string
  address: string
  addressName: string
}

/**
 * Formulario antiguo para captura directa de tarjeta.
 */
export interface CardFormState {
  cardNumber: string
  expiry: string
  cvc: string
  nameOnCard: string
}