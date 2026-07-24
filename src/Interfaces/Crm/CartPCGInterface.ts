import type { ProductoPCGInterface } from "@/Interfaces/Chat/ProductPCGInterface"
import type {
  ExistenciaSucursalItem,
  SINO,
} from "@/Interfaces/Ecommerce/FacturaTempo"
import type { LogCartResponseDto } from "@/Interfaces/Crm/LogCartInterface"

/**
 * Carrito temporal recuperado desde OrdenEn.
 */
export interface CarDto {
  idUsuario?: number
  fecha: string
  noPedido: number
  total: number
  tipoServicio: number
  listDetalle: ListDetalleCarrito[]

  /**
   * Valores calculados y retornados por la API.
   */
  venta?: number
  subTotal?: number
  descuento?: number
  iva?: number
}

/**
 * Producto, opción o componente almacenado en el carrito temporal.
 */
export interface ListDetalleCarrito {
  /**
   * P: producto principal.
   * O: opción de modificador.
   * R: componente que no debe recibir descuento global.
   */
  tipoComponente: string

  indice: number

  /**
   * Identificador de la línea dentro de det_factura_tempo.
   * El procedimiento lo utiliza junto con el producto para
   * aplicar cambios sobre una línea específica.
   */
  financiamiento: number

  codTipoModificador: string
  codModificador: string

  /**
   * Código del grupo o categoría del producto.
   */
  codGrupo: string

  codProducto: string
  codOpcion: string
  descripcion: string
  cantidad: number
  precioV: number

  /**
   * Total correspondiente a cantidad por precio.
   */
  totalMenu: number

  codUm: string
  observaciones?: string

  /**
   * Identificador generado por la API para relacionar
   * el producto principal con sus modificadores.
   */
  unico?: string

  /**
   * Al insertar puede estar vacío o en cero.
   * Se obtiene correctamente al recuperar OrdenEn.
   */
  noPedido: number

  imagen?: string
  tipoServicio?: number

  /**
   * Indica si la línea permite aplicar descuento.
   */
  permiteDescuento: SINO

    /**
   * Procentaje de descuento, y el decueno en monto aplicado
   */
  porcenDescto: string;
  descuento: number;

  /**
   * Opciones asociadas al producto principal.
   */
  listOpciones?: ListOpciones[]
}

/**
 * Opción asociada a un modificador de producto.
 */
export interface ListOpciones {
  codOpcion: string
  descripcionOp: string
  codPrecio: number
  precioVenta: string
  cantidad: number
  totalMenu: number
  codUm: string
  codTipoModificador: string
  codModificador: string
}

/**
 * Operaciones permitidas sobre una línea de factura temporal.
 *
 * Descuento: monto absoluto en córdobas.
 * %desc.: porcentaje visible entre 0 y 100.
 * Descuento$: monto absoluto expresado en dólares.
 */
export type TipoTrabajo =
  | "INSERT"
  | "CANTIDAD"
  | "Descuento"
  | "%desc."
  | "Descuento$"

/**
 * Forma en que sp_insertaDetalleFacturaTempo interpreta
 * el valor enviado en la propiedad descuento.
 *
 * N: no se está aplicando descuento.
 * P: descuento porcentual.
 * V: descuento por valor monetario.
 */
export type TipoDescuentoFacturaTempo = "N" | "P" | "V"

/**
 * Request utilizado para insertar o actualizar líneas
 * dentro de det_factura_tempo. También se reutiliza
 * para aplicar descuentos por producto.
 */
export interface DetalleFacturaTempoRequest {
  usuario: string
  maquina: string
  codproducto: string
  codprecio: string

  precio?: number | null
  cantidadmovimiento?: number | null
  medidamovimiento?: string | null

  tipotrabajo: TipoTrabajo
  financiamiento?: number | null
  codvendedor?: string | null
  codcliente?: string | null
  producto?: string | null

  sucursal: string
  bodega: string
  nofactura: string
  tipo: string
  tipodesc: TipoDescuentoFacturaTempo
  tasacambio: number
  descuento: number

  autorizado?: SINO | null
  tabla: string
  vincularse?: string | null
  servicioventa: number
  facturaexonerada?: SINO | null
  lote?: string | null
  vencimiento?: string | null
  vienedelabusqueda?: SINO | null
  observacion?: string | null

  iddescuentolineal?: number | null
  vienedebusquedaprioridadproducto?: SINO | null
  pol_Sumacant?: SINO | null

  /**
   * Se envía como texto porque el procedimiento
   * almacenado la recibe como DbType.String.
   */
  fecha: string

  /**
   * P para producto principal y O para opción,
   * según el sistema utilizado.
   */
  tipoComponente: string

  /**
   * Identificador que relaciona un modificador
   * con su producto principal.
   */
  unico: string

  codModificador: string

  /**
   * A: Atento/restaurante.
   * P: PCG ERP.
   */
  sistema: string

  /**
   * Código de orden de servicio utilizado por Atento.
   */
  ordenServicio: string

  /**
   * Canal o tipo de factura relacionado con la conversación.
   */
  tipoFac: string
}

/**
 * Respuesta general del endpoint que modifica
 * la factura temporal.
 */
export interface ApiResponseDetalleFacturaTempo {
  success: boolean
  data: DetalleFacturaTempoData
  message: string
}

export interface DetalleFacturaTempoData {
  header: DetalleFacturaTempoHeader
  detalle: DetalleFacturaTempoItem[]
}

export interface DetalleFacturaTempoHeader {
  msj: string
  cargaFila: SINO
  icono: string
  titulo: string
  permiso: SINO
  opcionPermiso: number
  dato: string | number | boolean | null
  cargaSuma: SINO
  saldo: number
}

/**
 * Línea retornada después de insertar un producto
 * en la factura temporal.
 */
export interface DetalleFacturaTempoItem {
  numero: number | null
  codigo: string
  noParte: string
  barras: string
  referencia: string
  producto: string
  peso: number
  color: string
  talla: string
  observacion: string
  os: string

  /**
   * Ejemplo: "722.00 UND".
   */
  saldo: string

  /**
   * Código de unidad de medida.
   */
  medida: string

  bonificacion: string
  cantidad: number
  vendedor: string
  lote: string

  /**
   * Fecha retornada por la API en formato ISO.
   */
  vencimiento: string

  precioSinIva: number
  precio: number
  precioDesc: number
  subTotal: number
  total: number

  /**
   * Identificador utilizado para vincular modificadores.
   */
  unico: string
}

/**
 * Request para obtener el consecutivo de una factura temporal.
 */
export interface FaloteRequestDto {
  codSucursal: string
  documento: string
}

export interface FaloteResponseDto {
  consecutivo: number
  serie?: string
}

/**
 * Datos generales utilizados al generar la factura definitiva.
 */
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
   * Se conserva este nombre porque así lo define actualmente la API.
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
   * Fecha utilizada por PCG en formato yyyyMMdd.
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
  detallePago: string
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
}

/**
 * Totales calculados por VspConsolidadoFactura.
 */
export interface InvoiceTotalsDto {
  subTotal: number
  descuento: number
  subneto: number
  iva: number
  retenciones: number
  propina: number
  transporte: number
  total: number
  totaldolar: number
}

/**
 * Sucursal, bodega y precio bloqueados para la orden activa.
 */
export interface LockedInfo {
  branch: string
  branchName: string
  wherehouse: string
  wherehouseCode: string
  serie: string
  codPrecio: string
}

/**
 * Opción de modificador seleccionada por el agente.
 */
export interface SelectedModifierOption {
  codTipoModificador: string
  codModificador: string
  descripcionMod: string
  codOpcion: string
  descripcionOp: string
  codPrecio: string
  precioVenta: number
  cantidad: number
  codUm: string
  aplicaIva: string
}

/**
 * Parámetros completos para agregar un producto
 * cuando la sucursal y bodega ya fueron seleccionadas.
 */
export interface AddProductParams {
  product: ProductoPCGInterface
  qty: number
  observacion: string
  branch: string
  branchName: string
  wherehouse: string
  wherehouseCode: string
  serie: string
  codPrecio: string
  modifierOptions: SelectedModifierOption[]
  onDoneUiReset: boolean
}

/**
 * Entrada flexible para agregar un producto.
 *
 * Los datos de sucursal pueden omitirse cuando el flujo
 * debe abrir el selector de sucursal y bodega.
 */
export interface AddProductInput {
  product: ProductoPCGInterface
  qty: number
  observacion?: string
  branch?: string
  branchName?: string
  wherehouse?: string
  wherehouseCode?: string
  serie?: string
  codPrecio?: string
  modifierOptions?: SelectedModifierOption[]
  onDoneUiReset?: boolean
}

/**
 * Lista de productos que se agregan en una operación masiva.
 */
export type AddProductsInput = AddProductInput[]

/**
 * Datos seleccionados desde el modal de existencia por sucursal.
 */
export interface PickerSelectValue {
  codsucursal: string
  sucursal: string
  nombodega: string
  codBodega: string
  serie: string

  /**
   * Se soportan las diferentes variantes porque
   * pueden venir con distinta capitalización desde la API.
   */
  codPrecio?: string | null
  codprecio?: string | null
  CodPrecio?: string | null
}

/**
 * Propiedades requeridas por el selector de sucursal.
 */
export interface SucursalPickerProps {
  open: boolean
  loading: boolean
  codProducto: string
  items: ExistenciaSucursalItem[]
  selectedCodSucursal: string | null
  onClose: () => void
  onSelect: (value: PickerSelectValue) => void | Promise<void>
}

/**
 * Resultado de resolver o crear la orden temporal.
 */
export interface ResolveOrderResult {
  existingLog: LogCartResponseDto | null
  noPedido: string
  branch: string
  branchName: string
  wherehouse: string
  wherehouseCode: string
  serie: string
  codPrecio: string
}

/**
 * Permite leer codPrecio aunque la API cambie
 * la capitalización del nombre de la propiedad.
 */
export interface WithCodPrecio {
  codPrecio?: string | null
  codprecio?: string | null
  CodPrecio?: string | null
}

/**
 * Tipo de descuento seleccionado por el agente.
 *
 * La transformación final depende de la operación:
 * - Descuento global: 10% se prepara como factor 0.10.
 * - Descuento por producto: 10% se envía como 10 porque
 *   sp_insertaDetalleFacturaTempo realiza la división entre 100.
 */
export enum TipoDescuento {
  /**
   * Descuento absoluto expresado como cantidad de dinero.
   */
  A = "A",

  /**
   * Descuento porcentual expresado visualmente de 0 a 100.
   */
  P = "P",
}

/**
 * Sistema empresarial asociado al cliente.
 */
export enum Vertical {
  /**
   * Atento o sistema de restaurante.
   */
  A = "A",

  /**
   * PCG ERP.
   */
  P = "P",
}

/**
 * Datos necesarios para aplicar un descuento sobre
 * un producto principal que ya existe en el carrito.
 *
 * El detalle debe pertenecer a un producto principal y
 * tener permiteDescuento en S. Las opciones no se envían.
 */
export interface AplicarDescuentoProductoParams {
  detalle: ListDetalleCarrito
  descuento: string
  tipo: TipoDescuento
}

/**
 * Valor ingresado por el agente desde la interfaz.
 *
 * En este punto todavía se encuentra en formato visible:
 * - Porcentual: "10".
 * - Absoluto: "150".
 */
export interface AplicarDescuentoGlobalParams {
  descuento: string
  tipo: TipoDescuento
}

/**
 * Parámetros utilizados por el utility que valida
 * y transforma el descuento antes de llamar al endpoint.
 */
export interface PrepararDescuentoGlobalParams {
  sistema: string | null | undefined
  tipo: TipoDescuento
  valor: string | number

  /**
   * Permite validar que un descuento absoluto
   * no supere el subtotal de la orden.
   */
  subtotal?: number | null
}

/**
 * Resultado normalizado por el utility de descuento.
 */
export interface DescuentoGlobalPreparado {
  sistema: Vertical
  tipo: TipoDescuento

  /**
   * Valor final preparado para la API.
   *
   * Ejemplos:
   * - Porcentual visible 10: "0.1".
   * - Absoluto visible 150: "150.00".
   */
  descuentoApi: string

  /**
   * Indica si deben enviarse IdCuenta e IdOrden.
   *
   * Estos valores son requeridos principalmente
   * por el flujo del sistema Atento.
   */
  requiereCuentaOrden: boolean
}

/**
 * Request enviado al endpoint de descuento global.
 */
export interface DescuentoGlobalReq {
  /**
   * Porcentual: factor decimal, por ejemplo "0.10".
   * Absoluto: cantidad monetaria, por ejemplo "150.00".
   */
  descuento: string

  usuario: string
  maquina: string
  sucursal: string
  cliente: string
  idDescuento: string
  sumaDescuento: SINO
  exonerado: SINO
  sistema: Vertical
  tipo: TipoDescuento
  idCuenta: string
  idOrden: string
}