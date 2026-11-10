import { apiPCG } from "@/Utils/ApiConfig"
import type { ApiPCGResponse } from "@/Interfaces/Common/GlobalPCGInterface"

export type SqlRow = Record<string, unknown>

export interface CatalogoCall {
  filas: SqlRow[]
  direcciones: SqlRow[]
  telefonos: SqlRow[]
}

export interface SucursalCall {
  codigo: string
  sucursal: string
}

export interface MunicipioCall {
  codigo: string
  descripcion: string
  departamento: string
}

export interface ClienteTelefonoCall {
  codCli: string
  nombre: string
  identificacion: string
  direccion: string
  barrio: string
  telefono: string
  email: string
}

export interface ClienteRapidoResultado {
  mensaje: string
  pasa: string
}

function asRows(value: unknown): SqlRow[] {
  return Array.isArray(value) ? (value as SqlRow[]) : []
}

function mensajeError(error: unknown, fallback: string): string {
  const data = (error as { response?: { data?: { message?: string } } })
    ?.response?.data
  return data?.message || (error instanceof Error ? error.message : fallback)
}

export function sqlText(row: SqlRow | null | undefined, name: string): string {
  if (!row) return ""
  const key = Object.keys(row).find(
    (item) => item.toLowerCase() === name.toLowerCase()
  )
  if (!key || row[key] == null) return ""
  return String(row[key]).trim()
}

export function sqlNumber(row: SqlRow | null | undefined, name: string): number {
  const raw = sqlText(row, name).replace(",", ".")
  const value = Number(raw)
  return Number.isFinite(value) ? value : 0
}

export interface PrecioTransporte {
  codPrecioTrans: string
  descripcion: string
  precio: number
}

export interface BarrioCall {
  codEmpresa: string
  codSucursal: string
  sucursal: string
  codBarrio: string
  descripcion: string
  codPrecioTrans: string
  descPrecio: string
  precio: number
  atender: string
  horaMaxima: string
}

function horaCorta(value: string): string {
  return value.match(/(\d{2}:\d{2})/)?.[1] ?? ""
}

export function aPrecioTransporte(row: SqlRow): PrecioTransporte {
  return {
    codPrecioTrans: sqlText(row, "CODPRECIOTRANS"),
    descripcion: sqlText(row, "DESCRIPCION"),
    precio: sqlNumber(row, "PRECIO")
  }
}

export function aBarrio(row: SqlRow): BarrioCall {
  return {
    codEmpresa: sqlText(row, "CODEMPRESA") || "01",
    codSucursal: sqlText(row, "CODSUCURSAL"),
    sucursal: sqlText(row, "DESC_SUCURSAL"),
    codBarrio: sqlText(row, "CODBARRIO"),
    descripcion: sqlText(row, "DESCRIPCION"),
    codPrecioTrans: sqlText(row, "CODPRECIOTRANS"),
    descPrecio: sqlText(row, "DESC_PRECIO"),
    precio: sqlNumber(row, "PRECIO"),
    atender: sqlText(row, "ATENDER") || "N",
    horaMaxima: horaCorta(sqlText(row, "HORA_MAXIMA"))
  }
}

/** Deja solo dígitos y un punto decimal con hasta dos decimales. */
export function soloMonto(valor: string): string {
  const limpio = valor.replace(",", ".").replace(/[^\d.]/g, "")
  const [entero, ...resto] = limpio.split(".")
  if (resto.length === 0) return entero
  return `${entero}.${resto.join("").slice(0, 2)}`
}

export function coincideTexto(filtro: string, ...valores: string[]): boolean {
  const buscado = filtro.trim().toLowerCase()
  if (!buscado) return true
  return valores.some((valor) => valor.toLowerCase().includes(buscado))
}

async function post<T>(url: string, body: unknown): Promise<T> {
  try {
    const { data } = await apiPCG.post<ApiPCGResponse<T>>(url, body)
    if (!data.success) {
      throw new Error(data.message || "No se pudo completar la operación")
    }
    return data.data
  } catch (error) {
    throw new Error(mensajeError(error, "No se pudo completar la operación"))
  }
}

async function get<T>(url: string): Promise<T> {
  try {
    const { data } = await apiPCG.get<ApiPCGResponse<T>>(url)
    if (!data.success) {
      throw new Error(data.message || "No se pudo completar la operación")
    }
    return data.data
  } catch (error) {
    throw new Error(mensajeError(error, "No se pudo completar la operación"))
  }
}

const callCenterService = {
  async catalogo(tabla: string, filtro = ""): Promise<CatalogoCall> {
    const data = await post<CatalogoCall>(
      "/Direcciones/CallCenter/ObtenerCatalogo",
      { tabla, filtro }
    )
    return {
      filas: asRows(data?.filas),
      direcciones: asRows(data?.direcciones),
      telefonos: asRows(data?.telefonos)
    }
  },

  sucursales() {
    return get<SucursalCall[]>("/Catalogos/ListarSucursales")
  },

  municipios() {
    return get<MunicipioCall[]>("/Catalogos/ListarMunicipiosActivos")
  },

  siguienteCodigo(tabla: string, campo: string, noCeros = 0) {
    return get<{ codigo: string }>(
      `/Direcciones/CallCenter/ObtenerCodigoZona?tabla=${encodeURIComponent(tabla)}&campo=${encodeURIComponent(campo)}&noCeros=${noCeros}&idEstructura=-1`
    )
  },

  guardarZona(body: {
    codEmpresa: string
    codSucursal: string
    codBarrio: string
    codPrecioTrans: string
    descripcion: string
    atender: string
    horaMaxima: string
    regUsuario: string
    opt: "I" | "U" | "D"
  }) {
    return post<number>("/Direcciones/CallCenter/CRUDZonas", body)
  },

  insertarPrecio(body: {
    codEmpresa: string
    codPrecioTrans: string
    descripcion: string
    precio: number
  }) {
    return post<{ codPrecioTrans: string }>(
      "/Direcciones/CallCenter/InsertarPrecioTransporte",
      body
    )
  },

  guardarPrecio(body: {
    codEmpresa: string
    codPrecioTrans: string
    descripcion: string
    precio: number
    regUsuario: string
    tipoMov: "M" | "E"
  }) {
    return post<number>("/Direcciones/CallCenter/CRUDPrecioTransporte", body)
  },

  buscarPorTelefono(codEmpresa: string, codSucursal: string, telefono: string) {
    return post<ClienteTelefonoCall[]>(
      "/Direcciones/CallCenter/ObtenerClientePorTelefono",
      { codEmpresa, codSucursal, telefono }
    )
  },

  clienteRapido(body: Record<string, unknown>) {
    return post<ClienteRapidoResultado>("/Clientes/ClienteRapido", body)
  },

  guardarDireccion(body: {
    codEmpresa: string
    codSucursal: string
    codCliente: string
    codigo: string
    idDireccion: string
    codBarrio: string
    direccion: string
    recibe: string
    tipoMov: "I" | "M" | "E"
  }) {
    return post<number>("/Direcciones/CallCenter/CRUDDireccion", body)
  }
}

export default callCenterService
