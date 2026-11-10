import { useCallback, useEffect, useRef, useState } from "react"
import { toast } from "react-toastify"
import Button from "@/Components/Common/Button"
import ListSkeleton from "@/Components/Common/ListSkeleton"
import { contactService } from "@/Services/auth/ContactService"
import callCenterService, {
  sqlNumber,
  sqlText,
  type ClienteTelefonoCall,
  type SqlRow
} from "@/Services/Ecommerce/CallCenterService"
import CallCenterDireccionModal, {
  type BarrioOption
} from "@/Components/ECommerce/Tabs/CallCenterDireccionModal"
import "@/Styles/Crm/CallCenter.css"

interface DireccionOption {
  id: string
  barrio: string
  direccion: string
  recibe: string
  precio: number
  sucursal: string
}

interface Props {
  contactId: number
  invoiceName: string
  identificacion: string
  direccionSeleccionada: string
  onSelect: (texto: string, precio: number) => void
}

function telefonoLocal(phone: string): string {
  const digits = phone.replace(/\D/g, "")
  return digits.length <= 8 ? digits : digits.slice(-8)
}

function lineaDireccion(barrio: string, direccion: string): string {
  return [barrio, direccion].filter(Boolean).join(" - ")
}

export default function CallCenterAddressPanel({
  contactId,
  invoiceName,
  identificacion,
  direccionSeleccionada,
  onSelect
}: Props) {
  const [codCliente, setCodCliente] = useState("")
  const [telefono, setTelefono] = useState("")
  const [nombre, setNombre] = useState("")
  const [email, setEmail] = useState("")
  const [sucursal, setSucursal] = useState("01")
  const [barrios, setBarrios] = useState<BarrioOption[]>([])
  const [direcciones, setDirecciones] = useState<DireccionOption[]>([])
  const [coincidencias, setCoincidencias] = useState<ClienteTelefonoCall[]>([])
  const [cargando, setCargando] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const invoiceNameRef = useRef(invoiceName)
  invoiceNameRef.current = invoiceName

  const cargarDirecciones = useCallback(async (codigo: string) => {
    if (!/^[0-9A-Za-z]+$/.test(codigo)) {
      setDirecciones([])
      return
    }
    const catalogo = await callCenterService.catalogo(
      "CAT_CLIENTE_DOMICILIO",
      ` AND A.CODCLI = '${codigo}'`
    )
    setDirecciones(
      catalogo.direcciones.map((row: SqlRow) => ({
        id: sqlText(row, "ID_DIRECCION"),
        barrio: sqlText(row, "BARRIO"),
        direccion: sqlText(row, "DIRECCION"),
        recibe: sqlText(row, "RECIBE"),
        precio: sqlNumber(row, "PRECIO"),
        sucursal: sqlText(row, "SUCURSAL")
      }))
    )
  }, [])

  const preparar = useCallback(async () => {
    if (!contactId) return
    setCargando(true)
    try {
      const contacto = await contactService.getById(contactId)
      if (!contacto.success || !contacto.data) {
        toast.error(contacto.message || "No se pudo leer el contacto")
        return
      }
      const fullName = (
        contacto.data.fullName ||
        contacto.data.waName ||
        invoiceNameRef.current ||
        ""
      ).trim()
      const codigo = (contacto.data.codClientePcg || "").trim()
      setTelefono(telefonoLocal(contacto.data.phone || ""))
      setNombre(fullName)
      setEmail(contacto.data.email || "")
      setCodCliente(codigo)

      const [barrioCat, sucursales] = await Promise.all([
        callCenterService.catalogo("CAT_CALL_BARRIO"),
        callCenterService.sucursales()
      ])
      setBarrios(
        barrioCat.filas.map((row) => ({
          codBarrio: sqlText(row, "CODBARRIO"),
          codSucursal: sqlText(row, "CODSUCURSAL"),
          descripcion: sqlText(row, "DESCRIPCION"),
          precio: sqlNumber(row, "PRECIO")
        }))
      )
      if (sucursales?.[0]?.codigo) setSucursal(sucursales[0].codigo)
      if (codigo) await cargarDirecciones(codigo)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo preparar el cliente")
    } finally {
      setCargando(false)
    }
  }, [cargarDirecciones, contactId])

  useEffect(() => {
    void preparar()
  }, [preparar])

  async function vincular(codigo: string) {
    const limpio = codigo.trim()
    const res = await contactService.updateCodClientePcg(contactId, limpio)
    if (!res.success) throw new Error(res.message || "No se pudo guardar el cliente")
    setCodCliente(limpio)
    setCoincidencias([])
    await cargarDirecciones(limpio)
    toast.success("Cliente PCG vinculado al contacto")
  }

  async function buscarCliente() {
    if (telefono.length < 8) {
      toast.error("El contacto no tiene un teléfono de 8 dígitos")
      return
    }
    setGuardando(true)
    try {
      const encontrados = (await callCenterService.buscarPorTelefono("01", sucursal || "01", telefono)) ?? []
      if (encontrados.length === 1) {
        await vincular(encontrados[0].codCli)
        return
      }
      if (encontrados.length === 0) toast.info("No hay un cliente PCG con ese teléfono. Puedes crearlo.")
      setCoincidencias(encontrados)
    } catch (error) {
      const message = error instanceof Error ? error.message : "No se pudo buscar el cliente"
      if (message.toLowerCase().includes("no se encontr")) {
        toast.info("No hay un cliente PCG con ese teléfono. Puedes crearlo.")
        setCoincidencias([])
        return
      }
      toast.error(message)
    } finally {
      setGuardando(false)
    }
  }

  async function crearCliente() {
    if (!nombre.trim()) {
      toast.error("El contacto no tiene nombre para crear el cliente")
      return
    }
    setGuardando(true)
    try {
      const siguiente = await callCenterService.siguienteCodigo("Clientes", "CodCliente", 0)
      const codigo = (siguiente?.codigo || "").trim()
      const numerico = Number(codigo)
      if (!codigo || !Number.isFinite(numerico) || numerico <= 0) {
        throw new Error("No se obtuvo el código del cliente")
      }
      await callCenterService.clienteRapido({
        codCliente: numerico,
        nombres: nombre.trim(),
        numDocumento: identificacion.trim() || "0",
        email,
        direccion: "Pendiente",
        comentario: "Creado desde CRM call center",
        telefonos: telefono,
        telefono1: "",
        nombreContacto: nombre.trim(),
        emailContacto: email,
        opcion: "I",
        codMunicipio: "",
        codIdentificacion: 1,
        codSucliente: 0,
        codSucursalIngreso: sucursal || "01",
        codClasificacion: "",
        acumulaPuntos: "N",
        permisoMod: "S",
        usuario: "CRM"
      })
      await vincular(codigo)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo crear el cliente")
    } finally {
      setGuardando(false)
    }
  }

  async function crearDireccion(values: { barrio: BarrioOption; direccion: string; recibe: string }) {
    try {
      await callCenterService.guardarDireccion({
        codEmpresa: "01",
        codSucursal: values.barrio.codSucursal || sucursal || "01",
        codCliente,
        codigo: "0",
        idDireccion: "0",
        codBarrio: values.barrio.codBarrio,
        direccion: values.direccion,
        recibe: values.recibe || nombre || "Cliente",
        tipoMov: "I"
      })
      await cargarDirecciones(codCliente)
      onSelect(lineaDireccion(values.barrio.descripcion, values.direccion), values.barrio.precio)
      setModalOpen(false)
      toast.success("Dirección creada y seleccionada")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo crear la dirección")
    }
  }

  if (cargando && !codCliente) {
    return <ListSkeleton variant="list" count={2} />
  }

  if (!codCliente) {
    return (
      <div className="cc-addr">
        <div className="cc-addr__header">
          <strong>Cliente ERP</strong>
          <span className="cc-badge cc-badge--warning">Sin vincular</span>
        </div>
        <p className="cc-note">
          Busca al cliente por el teléfono {telefono || "del contacto"} o créalo para registrar sus direcciones.
        </p>
        <div className="cc-actions">
          <Button variant="secondary" loading={guardando} onClick={() => void buscarCliente()}>
            Buscar por teléfono
          </Button>
          <Button loading={guardando} onClick={() => void crearCliente()}>
            Crear cliente
          </Button>
        </div>
        {coincidencias.map((item) => (
          <button
            key={item.codCli}
            type="button"
            className="cc-addr__item"
            onClick={() => {
              void vincular(item.codCli).catch((error: unknown) => {
                toast.error(error instanceof Error ? error.message : "No se pudo vincular el cliente")
              })
            }}
          >
            <strong>{item.nombre || item.codCli}</strong>
            <p>{item.direccion || "Sin dirección"}</p>
            <small>Código {item.codCli} · {item.telefono}</small>
          </button>
        ))}
      </div>
    )
  }

  return (
    <div className="cc-addr">
      <div className="cc-addr__header">
        <strong>Direcciones del cliente</strong>
        <span className="cc-badge">Cliente {codCliente}</span>
      </div>

      {cargando && <ListSkeleton variant="list" count={2} />}

      {!cargando && direcciones.length === 0 && (
        <p className="cc-note">Este cliente no tiene direcciones. Crea una para continuar.</p>
      )}

      {!cargando && direcciones.map((item) => {
        const linea = lineaDireccion(item.barrio, item.direccion)
        const activa = direccionSeleccionada === linea
        return (
          <button
            key={`${item.id}-${item.direccion}`}
            type="button"
            className={activa ? "cc-addr__item cc-addr__item--active" : "cc-addr__item"}
            onClick={() => onSelect(linea, item.precio)}
          >
            <div className="cc-addr__row">
              <strong>{item.barrio || "Sin barrio"}</strong>
              <span className="cc-addr__price">C$ {item.precio.toFixed(2)}</span>
            </div>
            <p>{item.direccion}</p>
            <small>
              {item.sucursal}
              {item.recibe ? ` · Recibe ${item.recibe}` : ""}
            </small>
          </button>
        )
      })}

      <Button variant="secondary" onClick={() => setModalOpen(true)} disabled={barrios.length === 0}>
        Nueva dirección
      </Button>
      {barrios.length === 0 && !cargando && (
        <p className="cc-note">No hay barrios registrados. Un administrador debe crearlos.</p>
      )}

      <CallCenterDireccionModal
        isOpen={modalOpen}
        barrios={barrios}
        recibeInicial={invoiceName || nombre}
        onClose={() => setModalOpen(false)}
        onSubmit={crearDireccion}
      />
    </div>
  )
}
