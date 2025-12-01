export interface CarDto{
    idUsuario: number;
    fecha: string;
    total: number;
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
    noPedido?: number;//al agregarlo es basillo, hasta cuando se recupera si se ontiene,pra el agregar al crrito basillloo
    imagen?: string;

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