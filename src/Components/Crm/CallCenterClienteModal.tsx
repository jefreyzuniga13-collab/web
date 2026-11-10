import { useEffect, useState, type FormEvent } from "react"
import { toast } from "react-toastify"
import Button from "@/Components/Common/Button"
import Input from "@/Components/Common/Input"
import { Label } from "@/Components/Common/Label"
import { Textarea } from "@/Components/Common/Textarea"
import CustomAutocomplete from "@/Components/Common/CustomAutocomplete"
import ListSkeleton from "@/Components/Common/ListSkeleton"
import CallCenterDireccionCard from "@/Components/Crm/CallCenterDireccionCard"
import useClientePcg, {
  lineaDireccion,
  type NuevoClienteForm
} from "@/Hooks/Crm/useClientePcg"
import { coincideTexto, type ClienteTelefonoCall } from "@/Services/Ecommerce/CallCenterService"
import "@/Styles/Crm/OpeningHourModal.css"
import "@/Styles/Crm/CallCenter.css"

export type PasoCliente = "cliente" | "direcciones"

interface Props {
  isOpen: boolean
  contactId: number
  pasoInicial?: PasoCliente
  nuevaDireccionInicial?: boolean
  nombreInicial?: string
  identificacionInicial?: string
  direccionSeleccionada?: string
  onClose: () => void
  onCambio?: () => void
  onUsarDireccion?: (texto: string, precio: number) => void
  onClienteSeleccionado?: (datos: { nombre: string; identificacion: string }) => void
}

const formVacio: NuevoClienteForm = {
  nombre: "",
  identificacion: "",
  telefono: "",
  email: "",
  codMunicipio: "",
  codSucursal: ""
}

const CORREO_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

function mensaje(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback
}

export default function CallCenterClienteModal({
  isOpen,
  contactId,
  pasoInicial = "cliente",
  nuevaDireccionInicial = false,
  nombreInicial = "",
  identificacionInicial = "",
  direccionSeleccionada = "",
  onClose,
  onCambio,
  onUsarDireccion,
  onClienteSeleccionado
}: Props) {
  const cliente = useClientePcg(contactId, isOpen)
  const {
    contacto,
    codCliente,
    detalle,
    direcciones,
    barrios,
    sucursales,
    municipios,
    cargando,
    listo,
    cargarMunicipios
  } = cliente

  const [paso, setPaso] = useState<PasoCliente>(pasoInicial)
  const [form, setForm] = useState<NuevoClienteForm>(formVacio)
  const [coincidencias, setCoincidencias] = useState<ClienteTelefonoCall[]>([])
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState("")

  const [nuevaDireccion, setNuevaDireccion] = useState(false)
  const [codBarrio, setCodBarrio] = useState("")
  const [direccion, setDireccion] = useState("")
  const [recibe, setRecibe] = useState("")
  const [busqueda, setBusqueda] = useState("")

  useEffect(() => {
    if (!isOpen) return
    setPaso(pasoInicial)
    setCoincidencias([])
    setError("")
    setCodBarrio("")
    setDireccion("")
    setRecibe(nombreInicial.trim())
    setBusqueda("")
    setNuevaDireccion(nuevaDireccionInicial)
    void cargarMunicipios()
  }, [cargarMunicipios, isOpen, nombreInicial, nuevaDireccionInicial, pasoInicial])

  useEffect(() => {
    if (!isOpen) return
    setForm({
      nombre: nombreInicial.trim() || contacto.nombre,
      identificacion: identificacionInicial.trim() || contacto.identificacion,
      telefono: contacto.telefono,
      email: contacto.email,
      codMunicipio: "",
      codSucursal: sucursales[0]?.codigo ?? ""
    })
  }, [contacto, identificacionInicial, isOpen, nombreInicial, sucursales])

  useEffect(() => {
    if (isOpen && listo && !cargando && !codCliente) setPaso("cliente")
  }, [cargando, codCliente, isOpen, listo])

  if (!isOpen) return null

  const direccionesFiltradas = direcciones.filter((item) =>
    coincideTexto(busqueda, item.barrio, item.direccion, item.recibe, item.sucursal)
  )

  const opcionesMunicipio = municipios.map((item) => ({
    value: item.codigo,
    label: item.departamento ? `${item.descripcion} · ${item.departamento}` : item.descripcion
  }))
  const opcionesSucursal = sucursales.map((item) => ({
    value: item.codigo,
    label: `${item.codigo} - ${item.sucursal}`
  }))
  const opcionesBarrio = barrios.map((item) => ({
    value: item.codBarrio,
    label: `${item.descripcion} · NIO ${item.precio.toFixed(2)}`
  }))

  const cambiar = <K extends keyof NuevoClienteForm>(campo: K, valor: NuevoClienteForm[K]) =>
    setForm((prev) => ({ ...prev, [campo]: valor }))

  async function vincular(item: ClienteTelefonoCall) {
    setGuardando(true)
    try {
      await cliente.vincular(item.codCli)
      setCoincidencias([])
      onClienteSeleccionado?.({
        nombre: (item.nombre || "").trim(),
        identificacion: (item.identificacion || "").trim()
      })
      onCambio?.()
      toast.success("Cliente vinculado al contacto")
      setPaso("direcciones")
    } catch (err) {
      toast.error(mensaje(err, "No se pudo vincular el cliente"))
    } finally {
      setGuardando(false)
    }
  }

  async function buscar() {
    setError("")
    if (form.telefono.length < 8) {
      return setError("El contacto no tiene un teléfono de 8 dígitos")
    }
    setGuardando(true)
    try {
      const encontrados = await cliente.buscarPorTelefono(form.telefono, form.codSucursal)
      setCoincidencias(encontrados)
      if (encontrados.length === 0) toast.info("No hay un cliente con ese teléfono. Puedes crearlo.")
    } catch (err) {
      toast.error(mensaje(err, "No se pudo buscar el cliente"))
    } finally {
      setGuardando(false)
    }
  }

  async function crear(event: FormEvent) {
    event.preventDefault()
    setError("")
    if (form.nombre.trim().length < 3) return setError("Escribe el nombre del cliente (mínimo 3 letras)")
    if (form.telefono.length < 8) return setError("El contacto no tiene un teléfono de 8 dígitos")
    if (form.email.trim() && !CORREO_VALIDO.test(form.email.trim())) {
      return setError("El correo no tiene un formato válido")
    }
    if (!form.codSucursal) return setError("Selecciona la sucursal de ingreso")

    setGuardando(true)
    try {
      const codigo = await cliente.crearCliente(form)
      onCambio?.()
      onClienteSeleccionado?.({
        nombre: form.nombre.trim(),
        identificacion: form.identificacion.trim()
      })
      toast.success(`Cliente ${codigo} creado y vinculado`)
      setPaso("direcciones")
      setNuevaDireccion(true)
      setRecibe(form.nombre.trim())
    } catch (err) {
      toast.error(mensaje(err, "No se pudo crear el cliente"))
    } finally {
      setGuardando(false)
    }
  }

  function abrirNuevaDireccion() {
    setCodBarrio("")
    setDireccion("")
    setRecibe(nombreInicial.trim() || detalle?.nombre || contacto.nombre)
    setError("")
    setNuevaDireccion(true)
  }

  async function guardarDireccion(event: FormEvent) {
    event.preventDefault()
    setError("")
    const barrio = barrios.find((item) => item.codBarrio === codBarrio)
    if (!barrio) return setError("Selecciona el barrio")
    if (!direccion.trim()) return setError("Escribe la dirección de entrega")

    setGuardando(true)
    try {
      await cliente.crearDireccion({ barrio, direccion: direccion.trim(), recibe: recibe.trim() })
      onCambio?.()
      setNuevaDireccion(false)
      if (onUsarDireccion) {
        onUsarDireccion(lineaDireccion(barrio.descripcion, direccion.trim()), barrio.precio)
        toast.success("Dirección creada y seleccionada")
        onClose()
      } else {
        toast.success("Dirección creada")
      }
    } catch (err) {
      toast.error(mensaje(err, "No se pudo crear la dirección"))
    } finally {
      setGuardando(false)
    }
  }

  const pasos: { id: PasoCliente; label: string }[] = [
    { id: "cliente", label: "Cliente" },
    { id: "direcciones", label: "Direcciones" }
  ]

  return (
    <div className="oh-modal__overlay">
      <div className="oh-modal__container crm-form cc-cliente">
        <header className="oh-modal__header">
          <div className="oh-modal__header-text">
            <h2 className="oh-modal__title">Gestionar Cliente</h2>
            <p className="oh-modal__subtitle">
              {codCliente
                ? `Cliente ${codCliente} vinculado a este contacto.`
                : "Crea o vincula el cliente para registrar sus direcciones."}
            </p>
          </div>
          <button type="button" className="oh-modal__close" onClick={onClose} aria-label="Cerrar">×</button>
        </header>

        <nav className="cc-steps">
          {pasos.map((item, index) => (
            <button
              key={item.id}
              type="button"
              className={paso === item.id ? "cc-steps__item cc-steps__item--active" : "cc-steps__item"}
              disabled={item.id === "direcciones" && !codCliente}
              onClick={() => setPaso(item.id)}
            >
              <span className="cc-steps__num">{index + 1}</span>
              {item.label}
            </button>
          ))}
        </nav>

        {!listo || (cargando && !codCliente) ? (
          <div className="oh-modal__body">
            <ListSkeleton variant="list" count={3} />
          </div>
        ) : paso === "cliente" ? (
          codCliente ? (
            <div className="oh-modal__body">
              <dl className="cc-confirm__detalle">
                {[
                  ["Código", codCliente],
                  ["Nombre", detalle?.nombre || contacto.nombre],
                  ["Identificación", detalle?.identificacion],
                  ["Teléfono", detalle?.telefono || contacto.telefono],
                  ["Correo", detalle?.email],
                  ["Municipio", detalle?.municipio],
                  ["Categoría", detalle?.categoria]
                ]
                  .filter(([, valor]) => Boolean(valor))
                  .map(([etiqueta, valor]) => (
                    <div key={etiqueta} className="cc-confirm__fila">
                      <dt>{etiqueta}</dt>
                      <dd>{valor}</dd>
                    </div>
                  ))}
              </dl>
              <footer className="oh-modal__footer">
                <Button variant="secondary" onClick={onClose} className="oh-modal__btn">
                  Cerrar
                </Button>
                <Button variant="primary" onClick={() => setPaso("direcciones")} className="oh-modal__btn">
                  Ver direcciones
                </Button>
              </footer>
            </div>
          ) : (
            <form className="oh-modal__body" onSubmit={crear}>
              <div className="oh-modal__grid">
                <div className="oh-modal__col">
                  <Label>Nombre del cliente *</Label>
                  <Input value={form.nombre} maxLength={200} onChange={(e) => cambiar("nombre", e.target.value)} />
                </div>
                <div className="oh-modal__col">
                  <Label>Identificación (opcional)</Label>
                  <Input value={form.identificacion} maxLength={30} onChange={(e) => cambiar("identificacion", e.target.value)} />
                </div>
                <div className="oh-modal__col">
                  <Label>Teléfono del contacto</Label>
                  <Input value={form.telefono || "Sin teléfono"} readOnly disabled />
                </div>
                <div className="oh-modal__col">
                  <Label>Correo (opcional)</Label>
                  <Input type="email" value={form.email} maxLength={150} onChange={(e) => cambiar("email", e.target.value)} />
                </div>
                <div className="oh-modal__col">
                  <Label>Municipio (opcional)</Label>
                  <CustomAutocomplete
                    disablePortal={false}
                    placeholder="Buscar municipio"
                    options={opcionesMunicipio}
                    value={opcionesMunicipio.find((item) => item.value === form.codMunicipio) ?? null}
                    onChange={(option) => cambiar("codMunicipio", option ? String(option.value) : "")}
                  />
                </div>
                <div className="oh-modal__col">
                  <Label>Sucursal de ingreso *</Label>
                  <CustomAutocomplete
                    disablePortal={false}
                    placeholder="Buscar sucursal"
                    options={opcionesSucursal}
                    value={opcionesSucursal.find((item) => item.value === form.codSucursal) ?? null}
                    onChange={(option) => cambiar("codSucursal", option ? String(option.value) : "")}
                  />
                </div>

                {coincidencias.length > 0 && (
                  <div className="oh-modal__col oh-modal__col--full cc-addr">
                    <p className="cc-note">Clientes con ese teléfono. Elige uno para vincularlo:</p>
                    {coincidencias.map((item) => (
                      <button
                        key={item.codCli}
                        type="button"
                        className="cc-addr__item"
                        disabled={guardando}
                        onClick={() => void vincular(item)}
                      >
                        <strong>{item.nombre || item.codCli}</strong>
                        <p>{item.direccion || "Sin dirección"}</p>
                        <small>Código {item.codCli} · {item.telefono}</small>
                      </button>
                    ))}
                  </div>
                )}

                {error && <div className="oh-modal__error oh-modal__col--full">{error}</div>}
              </div>

              <footer className="oh-modal__footer">
                <Button variant="secondary" className="oh-modal__btn" loading={guardando} onClick={() => void buscar()}>
                  Buscar por teléfono
                </Button>
                <Button variant="primary" type="submit" className="oh-modal__btn" loading={guardando}>
                  Crear cliente
                </Button>
              </footer>
            </form>
          )
        ) : nuevaDireccion ? (
          <form className="oh-modal__body" onSubmit={guardarDireccion}>
            <div className="oh-modal__grid">
              <div className="oh-modal__col oh-modal__col--full">
                <Label>Barrio</Label>
                <CustomAutocomplete
                  disablePortal={false}
                  placeholder="Buscar barrio"
                  options={opcionesBarrio}
                  value={opcionesBarrio.find((item) => item.value === codBarrio) ?? null}
                  onChange={(option) => setCodBarrio(option ? String(option.value) : "")}
                />
                {barrios.length === 0 && (
                  <p className="cc-note">No hay barrios registrados. Un administrador debe crearlos.</p>
                )}
              </div>
              <div className="oh-modal__col oh-modal__col--full">
                <Label>Dirección</Label>
                <Textarea
                  rows={3}
                  value={direccion}
                  placeholder="Dirección de entrega"
                  onChange={(e) => setDireccion(e.target.value)}
                />
              </div>
              <div className="oh-modal__col oh-modal__col--full">
                <Label>Quién recibe</Label>
                <Input value={recibe} maxLength={200} onChange={(e) => setRecibe(e.target.value)} />
              </div>
              <p className="cc-note oh-modal__col--full">El costo de transporte se toma del precio del barrio.</p>
              {error && <div className="oh-modal__error oh-modal__col--full">{error}</div>}
            </div>

            <footer className="oh-modal__footer">
              <Button
                variant="secondary"
                className="oh-modal__btn"
                disabled={guardando}
                onClick={() => setNuevaDireccion(false)}
              >
                Cancelar
              </Button>
              <Button variant="primary" type="submit" className="oh-modal__btn" loading={guardando}>
                {onUsarDireccion ? "Crear y usar" : "Guardar dirección"}
              </Button>
            </footer>
          </form>
        ) : (
          <div className="oh-modal__body">
            {direcciones.length > 0 && (
              <div className="cc-addr__search">
                <Input
                  value={busqueda}
                  placeholder="Buscar por barrio, dirección o quién recibe"
                  onChange={(e) => setBusqueda(e.target.value)}
                />
              </div>
            )}
            <div className="cc-addr">
              {cargando && <ListSkeleton variant="list" count={2} />}
              {!cargando && direcciones.length === 0 && (
                <p className="cc-note">Este cliente no tiene direcciones registradas.</p>
              )}
              {!cargando && direcciones.length > 0 && direccionesFiltradas.length === 0 && (
                <p className="cc-note">Ninguna dirección coincide con la búsqueda.</p>
              )}
              {!cargando &&
                direccionesFiltradas.map((item) => {
                  const linea = lineaDireccion(item.barrio, item.direccion)
                  return (
                    <CallCenterDireccionCard
                      key={`${item.id}-${item.direccion}`}
                      item={item}
                      activa={direccionSeleccionada === linea}
                      onClick={
                        onUsarDireccion
                          ? () => {
                              onUsarDireccion(linea, item.precio)
                              onClose()
                            }
                          : undefined
                      }
                    />
                  )
                })}
            </div>

            <footer className="oh-modal__footer">
              <Button variant="secondary" onClick={onClose} className="oh-modal__btn">
                Cerrar
              </Button>
              <Button variant="primary" onClick={abrirNuevaDireccion} className="oh-modal__btn" disabled={barrios.length === 0}>
                Nueva dirección
              </Button>
            </footer>
          </div>
        )}
      </div>
    </div>
  )
}
