import { useEffect, useRef, useState } from "react"
import { IoLocationOutline } from "react-icons/io5"
import Button from "@/Components/Common/Button"
import { Label } from "@/Components/Common/Label"
import Input from "@/Components/Common/Input"
import { coincideTexto } from "@/Services/Ecommerce/CallCenterService"
import ListSkeleton from "@/Components/Common/ListSkeleton"
import useClientePcg, { lineaDireccion } from "@/Hooks/Crm/useClientePcg"
import CallCenterClienteModal, { type PasoCliente } from "@/Components/Crm/CallCenterClienteModal"
import CallCenterDireccionCard from "@/Components/Crm/CallCenterDireccionCard"
import "@/Styles/Crm/CallCenter.css"

interface Props {
  contactId: number
  invoiceName: string
  identificacion: string
  direccionSeleccionada: string
  onSelect: (texto: string, precio: number) => void
  onCliente?: (datos: { nombre: string; identificacion: string }) => void
}

export default function CallCenterAddressPanel({
  contactId,
  invoiceName,
  identificacion,
  direccionSeleccionada,
  onSelect,
  onCliente
}: Props) {
  const { codCliente, contacto, detalle, direcciones, cargando, listo, recargar } = useClientePcg(contactId)
  const [modalPaso, setModalPaso] = useState<PasoCliente | null>(null)
  const [busqueda, setBusqueda] = useState("")
  const direccionesFiltradas = direcciones.filter((item) =>
    coincideTexto(busqueda, item.barrio, item.direccion, item.recibe, item.sucursal)
  )
  const actualRef = useRef({ invoiceName, identificacion, onCliente })
  actualRef.current = { invoiceName, identificacion, onCliente }

  useEffect(() => {
    if (!detalle) return
    const actual = actualRef.current
    actual.onCliente?.({
      nombre: actual.invoiceName.trim() ? "" : detalle.nombre,
      identificacion: actual.identificacion.trim() ? "" : detalle.identificacion
    })
  }, [detalle])

  const modal = (
    <CallCenterClienteModal
      isOpen={modalPaso !== null}
      contactId={contactId}
      pasoInicial={modalPaso ?? "cliente"}
      nuevaDireccionInicial={modalPaso === "direcciones"}
      nombreInicial={invoiceName}
      identificacionInicial={identificacion}
      direccionSeleccionada={direccionSeleccionada}
      onClose={() => setModalPaso(null)}
      onCambio={() => void recargar().catch(() => undefined)}
      onUsarDireccion={onSelect}
      onClienteSeleccionado={onCliente}
    />
  )

  const titulo = <Label icon={IoLocationOutline}>Dirección de entrega</Label>

  if (!listo || (cargando && !codCliente)) {
    return (
      <div className="cc-addr">
        {titulo}
        <ListSkeleton variant="list" count={2} />
      </div>
    )
  }

  if (!codCliente) {
    return (
      <div className="cc-addr">
        {titulo}
        <div className="cc-addr__cliente">
          <div className="cc-addr__cliente-info">
            <strong>{contacto.nombre || "Contacto"}</strong>
            <small>Crea o vincula el cliente para registrar sus direcciones.</small>
          </div>
          <span className="cc-badge cc-badge--warning">Sin vincular</span>
        </div>
        <Button onClick={() => setModalPaso("cliente")}>Gestionar cliente</Button>
        {modal}
      </div>
    )
  }

  return (
    <div className="cc-addr">
      {titulo}
      <div className="cc-addr__cliente">
        <div className="cc-addr__cliente-info">
          <strong>{detalle?.nombre || contacto.nombre || "Cliente"}</strong>
          <small>Cliente ERP {codCliente}</small>
        </div>
        <button type="button" className="cc-link" onClick={() => setModalPaso("cliente")}>
          Ver cliente
        </button>
      </div>

      {cargando && <ListSkeleton variant="list" count={2} />}

      {!cargando && direcciones.length === 0 && (
        <p className="cc-note cc-addr__empty">Este cliente no tiene direcciones. Crea una para continuar.</p>
      )}

      {!cargando && direcciones.length > 1 && (
        <Input
          className="cc-addr__search"
          value={busqueda}
          placeholder="Buscar dirección"
          onChange={(e) => setBusqueda(e.target.value)}
        />
      )}

      {!cargando && direcciones.length > 0 && direccionesFiltradas.length === 0 && (
        <p className="cc-note">Ninguna dirección coincide con la búsqueda.</p>
      )}

      {!cargando && direccionesFiltradas.map((item) => {
        const linea = lineaDireccion(item.barrio, item.direccion)
        const activa = direccionSeleccionada === linea
        return (
          <CallCenterDireccionCard
            key={`${item.id}-${item.direccion}`}
            item={item}
            activa={activa}
            onClick={() => (activa ? onSelect("", 0) : onSelect(linea, item.precio))}
          />
        )
      })}

      <Button variant="secondary" onClick={() => setModalPaso("direcciones")}>
        Nueva dirección
      </Button>
      {modal}
    </div>
  )
}
