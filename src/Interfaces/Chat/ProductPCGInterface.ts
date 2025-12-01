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
    descripcion: string;
    contenido: string;
    codUm: string;
    precio: number;
    permiteDescuento: string;
    aplicaIva: string;
    imagen?: string;
    tieneOpcion: boolean
}

export interface ProductoModificadorPCGInterface{
    codTipoModificador: string;
    codModificador: string;
    descripcionMod: string;
    esMultipleSeleccion: string;
    esRequerido: string;
    maximoSel: number;
    listOpciones: listaOpciones[]
}

export interface listaOpciones{
    codOpcion: string;
    descripcionOp: string;
    codPrecio: string;
    precioVenta: number;
    cantidad: number;
    aplicaIva: string;
    esOpcionDefecto: string;
    codUm: string;
    codTipoModificador: string
}