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

  detallePago: PagoGenerico[] | null;

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
  retiraSucursal: string;
}


export interface ExistenciaSucursalItem {
  codsucursal: string;
  sucursal: string;
  serie: string;
  existencia: number;
  medida: string;
}



//Si selecciona fectivo
export interface PagoEfectivo {
  concepto: "Efectivo";
  codPago: string;
  tipoPago: string;
  aplicaCambio: boolean;
  codPagoExterno: string;
  banco: string; 
}

//si selecciona trajeta, se deve de manda a listar ExistenciaSucursalItem, enviando el codPago
export interface PagoTarjeta {
  concepto: string; 
  codPago: string;
  tipoPago: string; 
  aplicaCambio: boolean;      // false
  codPagoExterno: string;
  banco: string;

  // Campos variables
  fechaOVence: string;
  ultDigito: string;
}


//si seleciona transfedrencia, se deve de manda a listar ExistenciaSucursalItem, enviando el codPago
export interface PagoTransferencia {
  numPago: string;
  concepto: string;          
  codPago: string;        
  tipoPago: string;           
  aplicaCambio: boolean;      
  codPagoExterno: string;    
  banco: string;           

  monto: number;
  moneda: string;
  montoA: number;
  cambio: number;
  tasaCambio: number;
  fechaOVence: string;        
  referencia: string;         
  numeroTransaccion: string;  
  cuentaContable?: string;

  ultDigito: string;  
  tarjeta: string;     
  tarjetahabiente: string;
  autorizacion: string; 
  termId: string;           
  afiliado: string;          


  montoP: number;
  montoS: number;

  indice: string;
  codClienteCrd: string;     
  facturaPinpad: string;
  codEmpresa: string;      
  codSucursal: string;
  montoFirma: string;         
  sobrante: string;          
}



//este modelo se pasa a todos:
export interface PagoGenerico {
  numPago: string;
  concepto: string;          
  codPago: string;        
  tipoPago: string;           
  aplicaCambio: string;      
  codPagoExterno: string;    
  banco: string;           

  monto: number;
  moneda: string;
  montoA: number;
  cambio: number;
  tasaCambio: number;
  Fecha_o_Vence: string;        
  referencia: string;         
  numeroTransaccion: string;  
  cuentaContable?: string;
  Dll: string;
  Numero: string;

  ultDigito: string;  
  tarjeta: string;     
  tarjetahabiente: string;
  autorizacion: string; 
  termId: string;           
  afiliado: string;          


  montoP: number;
  montoS: number;

  indice: string;
  codClienteCrd: string;     
  facturaPinpad: string;
  codEmpresa: string;      
  codSucursal: string;
  montoFirma: string;         
  sobrante: string;          
}


//solicita la lista de metod0os de transferencia y la respuesta, 
export interface ObtenerDivisaPagosTipoReq{
  codigo: string
  formulario: string;
  opcion: string;
}


//se deve de listar la lista en un select, y que el usuario debe de seleccionar 1 de la fila par luego enviarla en el
//pagoGenerico en dependenai al tipo de pago
export interface ObtenerDivisaPagosTipoRes{
  nombre: string;
  codigo: string;
  codigoExterno: string;
  tipo: string;
  banco: string
  aCambio: string;
}