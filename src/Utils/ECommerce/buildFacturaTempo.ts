import type {
  FacturaTempo,
  PagoGenerico,
  SINO
} from "@/Interfaces/Ecommerce/FacturaTempo"

import { FechaManagua } from "@/Utils/FechaManagua"
import { safeStr } from "@/Utils/ECommerce/formatters"
import { safePositiveNumber } from "@/Utils/ECommerce/utils"
import { tasaCambio } from "@/Constants/tasaCambio"

type BuildFacturaTempoParams = {
  /**
   * Factura base cargada desde storage o plantilla inicial.
   */
  facturaBase: FacturaTempo

  /**
   * Sucursal donde se factura.
   */
  codSucursalFactura: string

  /**
   * Consecutivo de factura obtenido desde PCG.
   */
  consecutivo: number

  /**
   * Id del pedido temporal o LogCart.
   */
  orderId: number | string

  /**
   * Id del contacto del CRM.
   */
  contactId: number

  /**
   * Nombre visible del cliente.
   */
  nombreCliente: string

  /**
   * Dirección final usada para facturar.
   */
  direccionCte: string

  /**
   * Referencia de dirección o sucursal.
   */
  referencia: string

  /**
   * Costo de transporte final.
   */
  valorTransporte: number

  /**
   * Indica si el cliente retira en sucursal.
   */
  retiraSucursal: SINO | string

  /**
   * Observación del pedido.
   */
  observacion?: string

  /**
   * Serie de factura.
   */
  serie?: string | null

  /**
   * Pagos que se enviarán a PCG.
   */
  detallePago: PagoGenerico[]

  /**
   * Tasa de cambio.
   */
  tasa: number

  /**
   * Código de cliente PCG si existe.
   */
  codCli?: string

  /**
   * Teléfono del cliente si existe.
   */
  telefonoCte?: string

  /**
   * Correo del cliente si existe.
   */
  correo?: string

  /**
   * RUC o cédula. La API lo recibe en el campo identificaicon.
   */
  identificacion?: string
}

/**
 * Construye el request final de FacturaTempo.
 *
 * Esta función centraliza los campos comunes entre:
 * CheckoutPage del cliente y pago directo del agente en CartTab.
 */
export const buildFacturaTempo = ({
  facturaBase,
  codSucursalFactura,
  consecutivo,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  orderId,
  contactId,
  nombreCliente,
  direccionCte,
  referencia,
  valorTransporte,
  retiraSucursal,
  observacion = "",
  serie = null,
  detallePago,
  tasa,
  codCli,
  telefonoCte,
  correo,
  identificacion
}: BuildFacturaTempoParams): FacturaTempo => {
  return {
    ...facturaBase,

    sucursal: codSucursalFactura,
    serie: serie ?? facturaBase.serie,

    codCli: safeStr(codCli ?? facturaBase.codCli),
    nombreCliente: safeStr(nombreCliente),
    clientePadre: safeStr(nombreCliente),
    identificaicon: safeStr(identificacion ?? facturaBase.identificaicon),

    direccionCte: safeStr(direccionCte),
    referencia: safeStr(referencia),

    telefonoCte: safeStr(telefonoCte ?? facturaBase.telefonoCte),
    correo: safeStr(correo ?? facturaBase.correo),

    usuario: String(contactId),
    maquina: `CRM-${contactId}`,

    fechaFactura: FechaManagua.obtenerFormatoLimpio(),
    tasaCambio: tasa ?? tasaCambio,

    numero: consecutivo,
    idPromocion: "",
    noOrden: "",

    valorTransporte: safePositiveNumber(valorTransporte),
    aplicaPropina: "N",

    observacion: safeStr(observacion),
    hayFormaPago: "S",

    retiraSucursal: safeStr(retiraSucursal || "N"),

    detallePago
  }
}