import { useCallback, useEffect, useState } from "react"
import { toast } from "react-toastify"
import { contactService } from "@/Services/auth/ContactService"
import callCenterService, {
  sqlNumber,
  sqlText,
  type ClienteTelefonoCall,
  type MunicipioCall,
  type SqlRow,
  type SucursalCall
} from "@/Services/Ecommerce/CallCenterService"

export interface BarrioOption {
  codBarrio: string
  codSucursal: string
  descripcion: string
  precio: number
}

export interface DireccionCliente {
  id: string
  barrio: string
  direccion: string
  recibe: string
  precio: number
  sucursal: string
  horaMaxima: string
}

export interface DatosContacto {
  nombre: string
  telefono: string
  email: string
  identificacion: string
}

export interface DetalleClientePcg {
  nombre: string
  identificacion: string
  telefono: string
  email: string
  municipio: string
  categoria: string
}

export interface NuevoClienteForm {
  nombre: string
  identificacion: string
  telefono: string
  email: string
  codMunicipio: string
  codSucursal: string
}

export interface NuevaDireccionForm {
  barrio: BarrioOption
  direccion: string
  recibe: string
}

const CODIGO_VALIDO = /^[0-9A-Za-z]+$/

export function telefonoLocal(phone: string): string {
  const digits = phone.replace(/\D/g, "")
  return digits.length <= 8 ? digits : digits.slice(-8)
}

export function lineaDireccion(barrio: string, direccion: string): string {
  return [barrio, direccion].filter(Boolean).join(" - ")
}

function identificacionContacto(data: {
  idCard?: string | null
  passport?: string | null
  residenceCard?: string | null
}): string {
  return (data.idCard || data.passport || data.residenceCard || "").trim()
}

/**
 * Cliente PCG vinculado a un contacto: datos, direcciones y catálogos para crearlos.
 */
export default function useClientePcg(contactId: number, enabled = true) {
  const [contacto, setContacto] = useState<DatosContacto>({
    nombre: "",
    telefono: "",
    email: "",
    identificacion: ""
  })
  const [codCliente, setCodCliente] = useState("")
  const [detalle, setDetalle] = useState<DetalleClientePcg | null>(null)
  const [direcciones, setDirecciones] = useState<DireccionCliente[]>([])
  const [barrios, setBarrios] = useState<BarrioOption[]>([])
  const [sucursales, setSucursales] = useState<SucursalCall[]>([])
  const [municipios, setMunicipios] = useState<MunicipioCall[]>([])
  const [cargando, setCargando] = useState(false)
  const [listo, setListo] = useState(false)

  const cargarCliente = useCallback(async (codigo: string) => {
    if (!CODIGO_VALIDO.test(codigo)) {
      setDetalle(null)
      setDirecciones([])
      return
    }
    const catalogo = await callCenterService.catalogo(
      "CAT_CLIENTE_DOMICILIO",
      ` AND A.CODCLI = '${codigo}'`
    )
    const fila: SqlRow | undefined = catalogo.filas[0]
    setDetalle(
      fila
        ? {
            nombre: sqlText(fila, "NOMBRES") || sqlText(fila, "NOMBRE"),
            identificacion: sqlText(fila, "IDENTIFICACIONCLIENTE") || sqlText(fila, "IDENTIFICACION"),
            telefono: sqlText(fila, "TELEFONO"),
            email: sqlText(fila, "EMAIL"),
            municipio: sqlText(fila, "MUNICIPIO"),
            categoria: sqlText(fila, "DESC_CATEGORIA")
          }
        : null
    )
    setDirecciones(
      catalogo.direcciones.map((row) => ({
        id: sqlText(row, "ID_DIRECCION"),
        barrio: sqlText(row, "BARRIO"),
        direccion: sqlText(row, "DIRECCION"),
        recibe: sqlText(row, "RECIBE"),
        precio: sqlNumber(row, "PRECIO"),
        sucursal: sqlText(row, "SUCURSAL"),
        horaMaxima: sqlText(row, "HORA_MAXIMA")
      }))
    )
  }, [])

  const recargar = useCallback(async () => {
    if (!contactId) return
    setCargando(true)
    try {
      const res = await contactService.getById(contactId)
      if (!res.success || !res.data) {
        throw new Error(res.message || "No se pudo leer el contacto")
      }
      const codigo = (res.data.codClientePcg || "").trim()
      setContacto({
        nombre: (res.data.fullName || res.data.waName || "").trim(),
        telefono: telefonoLocal(res.data.phone || ""),
        email: res.data.email || "",
        identificacion: identificacionContacto(res.data)
      })
      setCodCliente(codigo)

      const [barrioCat, listaSucursales] = await Promise.all([
        callCenterService.catalogo("CAT_CALL_BARRIO"),
        callCenterService.sucursales().catch(() => [] as SucursalCall[])
      ])
      setBarrios(
        barrioCat.filas.map((row) => ({
          codBarrio: sqlText(row, "CODBARRIO"),
          codSucursal: sqlText(row, "CODSUCURSAL"),
          descripcion: sqlText(row, "DESCRIPCION"),
          precio: sqlNumber(row, "PRECIO")
        }))
      )
      setSucursales(listaSucursales ?? [])

      if (codigo) await cargarCliente(codigo)
      else {
        setDetalle(null)
        setDirecciones([])
      }
    } finally {
      setCargando(false)
      setListo(true)
    }
  }, [cargarCliente, contactId])

  useEffect(() => {
    if (!enabled) return
    void recargar().catch((error: unknown) => {
      toast.error(error instanceof Error ? error.message : "No se pudo cargar el cliente")
    })
  }, [enabled, recargar])

  const cargarMunicipios = useCallback(async () => {
    if (municipios.length > 0) return
    try {
      setMunicipios((await callCenterService.municipios()) ?? [])
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudieron cargar los municipios")
    }
  }, [municipios.length])

  const vincular = useCallback(
    async (codigo: string) => {
      const limpio = codigo.trim()
      const res = await contactService.updateCodClientePcg(contactId, limpio)
      if (!res.success) throw new Error(res.message || "No se pudo guardar el cliente en el contacto")
      setCodCliente(limpio)
      await cargarCliente(limpio)
    },
    [cargarCliente, contactId]
  )

  const buscarPorTelefono = useCallback(
    async (telefono: string, codSucursal: string): Promise<ClienteTelefonoCall[]> => {
      try {
        return (await callCenterService.buscarPorTelefono("01", codSucursal || "01", telefono)) ?? []
      } catch (error) {
        const message = error instanceof Error ? error.message : ""
        if (message.toLowerCase().includes("no se encontr")) return []
        throw error
      }
    },
    []
  )

  const crearCliente = useCallback(
    async (form: NuevoClienteForm) => {
      const siguiente = await callCenterService.siguienteCodigo("Clientes", "CodCliente", 0)
      const codigo = (siguiente?.codigo || "").trim()
      const numerico = Number(codigo)
      if (!codigo || !Number.isFinite(numerico) || numerico <= 0) {
        throw new Error("No se obtuvo el código del cliente")
      }
      await callCenterService.clienteRapido({
        codCliente: numerico,
        nombres: form.nombre.trim(),
        numDocumento: form.identificacion.trim() || "0",
        email: form.email.trim(),
        direccion: "Pendiente",
        comentario: "Creado desde CRM call center",
        telefonos: form.telefono.trim(),
        telefono1: "",
        nombreContacto: form.nombre.trim(),
        emailContacto: form.email.trim(),
        opcion: "I",
        codMunicipio: form.codMunicipio,
        codIdentificacion: 1,
        codSucliente: 0,
        codSucursalIngreso: form.codSucursal || "01",
        codClasificacion: "",
        acumulaPuntos: "N",
        permisoMod: "S",
        usuario: "CRM"
      })
      await vincular(codigo)
      return codigo
    },
    [vincular]
  )

  const crearDireccion = useCallback(
    async (values: NuevaDireccionForm) => {
      await callCenterService.guardarDireccion({
        codEmpresa: "01",
        codSucursal: values.barrio.codSucursal || "01",
        codCliente,
        codigo: "0",
        idDireccion: "0",
        codBarrio: values.barrio.codBarrio,
        direccion: values.direccion,
        recibe: values.recibe || contacto.nombre || "Cliente",
        tipoMov: "I"
      })
      await cargarCliente(codCliente)
    },
    [cargarCliente, codCliente, contacto.nombre]
  )

  return {
    contacto,
    codCliente,
    detalle,
    direcciones,
    barrios,
    sucursales,
    municipios,
    cargando,
    listo,
    recargar,
    cargarMunicipios,
    vincular,
    buscarPorTelefono,
    crearCliente,
    crearDireccion
  }
}
