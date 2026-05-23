export interface CarDto{
    idUsuario?: number;
    fecha: string;
    noPedido: number;
    total: number;
    tipoServicio: number;
    listDetalle: ListDetalleCarrito[]

    //Para la respuesta:
    venta?: number;
    subTotal?: number;
    descuento?: number;
    iva?: number;
}

export interface ListDetalleCarrito{
    tipoComponente: string;//Cuando es un producto, se manda P, cuando es una opcion del modificador se envia O (esto dos espera la api) 
    indice: number;
    codTipoModificador: string;
    codModificador: string;
    codGrupo: string;//es losmismo que el codigo de categorua
    codProducto: string;
    codOpcion: string;
    descripcion: string;
    cantidad: number;
    precioV: number;
    totalMenu: number;//cantidad por numoero
    codUm: string;
    observaciones?: string;
    unico?: string;//basillo, lo genera la api, se obtiene haytas que se recupe4ra
    noPedido: number;//al agregarlo es basillo, hasta cuando se recupera si se ontiene,pra el agregar al crrito basillloo
    imagen?: string;
    tipoServicio?: number;

    // Para las respuestas:
    listOpciones?: ListOpciones[]
}

export interface ListOpciones{
    codOpcion: string;
    descripcionOp: string;
    codPrecio: number;
    precioVenta: string;
    cantidad: number;
    totalMenu: number;
    codUm: string;
    codTipoModificador: string;
    codModificador: string;
}


// Estandar
//creat inteferaz

export type TipoTrabajo = "INSERT" | "CANTIDAD";

export interface DetalleFacturaTempoRequest {
  usuario: string;
  maquina: string;
  codproducto: string;
  codprecio: string;
  precio?: number | null; 
  cantidadmovimiento?: number | null; 
  medidamovimiento?: string | null; 
  tipotrabajo: TipoTrabajo;
  financiamiento?: number | null;
  codvendedor?: string | null;
  codcliente?: string | null;
  producto?: string | null; 
 
  sucursal: string;
  bodega: string;
  nofactura: string;
  tipo: string;
  tipodesc: string;
  tasacambio: number;
  descuento: number;

  autorizado?: string | null; //"S" | "N" 
  tabla: string;
  vincularse?: string | null;
  servicioventa: number;
  facturaexonerada?: string | null; // "S"|"N"
  lote?: string | null;
  vencimiento?: string | null; 
  vienedelabusqueda?: string | null; // "S"|"N"
  observacion?: string | null;

  iddescuentolineal?: number | null;
  vienedebusquedaprioridadproducto?: string | null; // "S"|"N"
  pol_Sumacant?: string | null; // "S"|"N"

  // extra que no viene en request/valores directo
  fecha: string; // en C# la envías como DbType.String


  tipoComponente: string;
  unico: string
  codModificador: string
  sistema: string
  ordenServicio: string
  tipoFac: string
}


type YesNo = "S" | "N";
export interface ApiResponseDetalleFacturaTempo {
  success: boolean;
  data: DetalleFacturaTempoData;
  message: string;
}

export interface DetalleFacturaTempoData {
  header: DetalleFacturaTempoHeader;
  detalle: DetalleFacturaTempoItem[];
}

export interface DetalleFacturaTempoHeader {
  msj: string;
  cargaFila: YesNo
  icono: string;
  titulo: string;
  permiso:  YesNo
  opcionPermiso: number;
  dato: string | number | boolean | null; // en tu ejemplo es null
  cargaSuma:  YesNo
  saldo: number;
}

export interface DetalleFacturaTempoItem {
  numero: number | null;
  codigo: string;
  noParte: string;
  barras: string;
  referencia: string;
  producto: string;
  peso: number;
  color: string;
  talla: string;
  observacion: string;
  os: string;

  saldo: string;      // "722.00 UND" (texto)
  medida: string;     // "0103-001"
  bonificacion: string;

  cantidad: number;
  vendedor: string;

  lote: string;
  vencimiento: string; // "1900-01-01T00:00:00" (ISO string)

  precioSinIva: number;
  precio: number;
  precioDesc: number;

  subTotal: number;
  total: number;

  //Modificadores y ópcional
  unico: string;
}

//Obtener el numero de falote
export interface FaloteRequestDto{
    codSucursal : string;
    documento: string;
}
export interface FaloteResponseDto{
    consecutivo: number;
    serie?: string
}


// Datos del clientes
export interface FacturaTempo {
  noFactura: string;
  serie: string;
  tipo: string;
  modo: string;
  moneda: string;
  aplicaIr: "S" | "N";
  aplicaIMI: "S" | "N";
  sucursal: string;
  codCli: string;
  nombreCliente: string;
  codVendedor: string;
  tasaCambio: number;
  diasCredito: number;
  usuario: string;
  maquina: string;
  exonerado: "S" | "N";
  noProforma: string;
  tipoIdentificacion: number;
  identificaicon: string; // mantener el nombre tal cual viene
  noOrden: string;
  imprimir: string;
  numero: number;
  noApartado: string;
  caja: string;
  noReserva: string;
  versionSistema: string;
  codSubCli: number;
  observacion: string;
  verComoPreventa: "S" | "N";
  tipoServicio: number;
  agente: number;
  fechaFactura: string; // yyyyMMdd
  cajero: string;
  subCliente: string;
  numeroExoneracion: string;
  noPreventa: string;
  codEmpresa: string;
  direccionCte: string;
  telefonoCte: string;
  tipoDocumentoLlamado: number;

  detallePago: string;

  clientePadre: string;
  hayFormaPago: "S" | "N";
  valorTransporte: number;
  referencia: string;
  aplicaPropina: "S" | "N";
  etiqueta: string;
  noConsignacion: string;
  planPago: "S" | "N";
  idPromocion: string;
  codreferido: string;
  correo: string;
}



export interface InvoiceTotalsDto {
  subTotal: number;
  descuento: number;
  subneto: number;
  iva: number;
  retenciones: number;
  propina: number;
  transporte: number;
  total: number;
  totaldolar: number;
}
