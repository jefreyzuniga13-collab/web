export type SINO = "S" | "N"

export interface FacturaTempo {
  noFactura: string
  serie: string
  tipo: string
  modo: string
  moneda: string
  aplicaIr: SINO
  aplicaIMI: SINO
  sucursal: string
  codCli: string
  nombreCliente: string
  codVendedor: string
  tasaCambio: number
  diasCredito: number
  usuario: string
  maquina: string
  exonerado: SINO
  noProforma: string
  tipoIdentificacion: number

  /**
   * Mantener el nombre exactamente como viene desde PCG.
   */
  identificaicon: string

  noOrden: string
  imprimir: string
  numero: number
  noApartado: string
  caja: string
  noReserva: string
  versionSistema: string
  codSubCli: number
  observacion: string
  verComoPreventa: SINO
  tipoServicio: number
  agente: number

  /**
   * Formato yyyyMMdd.
   */
  fechaFactura: string

  cajero: string
  subCliente: string
  numeroExoneracion: string
  noPreventa: string
  codEmpresa: string
  direccionCte: string
  telefonoCte: string
  tipoDocumentoLlamado: number

  detallePago: PagoGenerico[] | null

  clientePadre: string
  hayFormaPago: SINO
  valorTransporte: number
  referencia: string
  aplicaPropina: SINO
  etiqueta: string
  noConsignacion: string
  planPago: SINO
  idPromocion: string
  codreferido: string
  correo: string
  retiraSucursal: string

  codModificador?: string
  tipoComponente?: string
  unico?: string
}

/**
 * Modelo genérico enviado dentro de FacturaTempo.detallePago.
 */
export interface PagoGenerico {
  numPago: string
  concepto: string
  codPago: string
  tipoPago: string

  /**
   * true únicamente cuando el método puede generar cambio.
   *
   * Normalmente aplica solamente para efectivo.
   */
  aplicaCambio: boolean

  codPagoExterno: string
  banco: string

  /**
   * Dinero entregado por el cliente.
   */
  monto: number

  moneda?: string

  /**
   * Dinero entregado por el cliente.
   *
   * Para efectivo normalmente tiene el mismo valor que monto.
   */
  montoA: number

  /**
   * Cambio que debe recibir el cliente.
   */
  cambio: number

  tasaCambio: number

  /**
   * Mantener este nombre porque así lo consume PCG.
   */
  Fecha_o_Vence: string

  referencia: string
  numeroTransaccion: string
  cuentaContable?: string
  Dll: string
  Numero: string

  ultDigito: string
  tarjeta: string
  tarjetahabiente: string
  autorizacion: string
  termId: string
  afiliado: string

  /**
   * Monto realmente aplicado a la factura.
   */
  montoP: number

  /**
   * Monto recibido convertido según la tasa de cambio.
   */
  montoS: number

  indice: string
  codClienteCrd?: string
  facturaPinpad: string
  codEmpresa: string
  codSucursal: string
  montoFirma: string
  sobrante: string

  /**
   * Campos utilizados para guardar detalles de pagos electrónicos.
   */
  Codtransaccion: string
  CuentaHabiente: string
  CodStrCadsaccion: string
}

export interface ExistenciaSucursalItem {
  codsucursal: string
  sucursal: string
  serie: string
  existencia: number
  medida: string
  nombodega: string
  codbodega: string
  precio: string
}

/**
 * Configuración básica para efectivo.
 */
export interface PagoEfectivo {
  concepto: "Efectivo"
  codPago: string
  tipoPago: string
  aplicaCambio: boolean
  codPagoExterno: string
  banco: string
}

/**
 * Configuración básica para tarjeta.
 */
export interface PagoTarjeta {
  concepto: string
  codPago: string
  tipoPago: string
  aplicaCambio: boolean
  codPagoExterno: string
  banco: string

  fechaOVence: string
  ultDigito: string
}

/**
 * Configuración de transferencia.
 */
export interface PagoTransferencia {
  numPago: string
  concepto: string
  codPago: string
  tipoPago: string
  aplicaCambio: boolean
  codPagoExterno: string
  banco: string

  monto: number
  moneda: string
  montoA: number
  cambio: number
  tasaCambio: number
  fechaOVence: string
  referencia: string
  numeroTransaccion: string
  cuentaContable?: string

  ultDigito: string
  tarjeta: string
  tarjetahabiente: string
  autorizacion: string
  termId: string
  afiliado: string

  montoP: number
  montoS: number

  indice: string
  codClienteCrd: string
  facturaPinpad: string
  codEmpresa: string
  codSucursal: string
  montoFirma: string
  sobrante: string
}

/**
 * Solicitud para obtener bancos o tipos de pago desde PCG.
 */
export interface ObtenerDivisaPagosTipoReq {
  codigo: string
  formulario: string
  opcion: string
}

/**
 * Banco o tipo de pago retornado por PCG.
 */
export interface ObtenerDivisaPagosTipoRes {
  nombre: string
  codigo: string
  codigoExterno: string
  tipo: string
  banco: string
  aCambio: string
}