import type { LogCartResponseDto } from '@/Interfaces/Crm/LogCartInterface';
import type { ExistenciaSucursalItem } from '@/Interfaces/Ecommerce/FacturaTempo';
export interface CategoriaPCGInterface {
    id: number;
    codGrupo: string;
    grupo: string;
    imagen: string;
}
export interface ProductoPCGInterface{
    id: number;
    idProducto: number;
    codProducto: string;
    codCategoria: string;
    descripcion: string;//enviar en mesaje
    contenido: string; //enviar en mensjae
    codUm: string;
    precio: number;//enviar en mensaje
    permiteDescuento: string;
    aplicaIva: string;
    imagen?: string; //enviar en mensaje, esto es una url
    tieneOpcion: boolean;// slo enviar  ifnromacion de modificar y opciones, solo es true caso contario no tiene
    marca: string | null;
    existencia: number;
}
export interface ProductoModificadorPCGInterface{
    codTipoModificador: string;
    codModificador: string;
    descripcionMod: string;
    esMultipleSeleccion: string;
    esRequerido: string; //cuando es requida se deve de seleccionar, antes de poner proceder a agregar al carrito
    maximoSel: number;//maxima cantidad de seleccione por una lista de opciones al ser seleccionada
    listOpciones: listaOpciones[]
}
export interface listaOpciones{
    codOpcion: string;
    descripcionOp: string;//enviar en mensaje
    codPrecio: string;
    precioVenta: number;//enviar en mensaje
    cantidad: number;
    aplicaIva: string;
    esOpcionDefecto: string;//Si es S, se deve de seleccionar por defecto, sin que el usuario la selecione.
    codUm: string;
    codTipoModificador: string
}
export type LockedInfo = {
  branch: string
  branchName: string
  wherehouse: string
  wherehouseCode: string
  serie: string
  codPrecio: string
}
export type SelectedModifierOption = {
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
export type AddProductParams = {
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

export type AddProductInput = {
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

export type PickerSelectValue = {
  codsucursal: string
  sucursal: string
  nombodega: string
  codBodega: string
  serie: string
  codPrecio?: string | null
  codprecio?: string | null
  CodPrecio?: string | null
}
export type SucursalPickerProps = {
  open: boolean
  loading: boolean
  codProducto: string
  items: ExistenciaSucursalItem[]
  selectedCodSucursal: string | null
  onClose: () => void
  onSelect: (v: PickerSelectValue) => void | Promise<void>
}

export type ResolveOrderResult = {
  existingLog: LogCartResponseDto | null
  noPedido: string
  branch: string
  branchName: string
  wherehouse: string
  wherehouseCode: string
  serie: string
  codPrecio: string
}

export type WithCodPrecio = {
  codPrecio?: string | null
  codprecio?: string | null
  CodPrecio?: string | null
}