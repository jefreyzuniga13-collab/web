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