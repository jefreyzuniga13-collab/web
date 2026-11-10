import { useState } from "react"
import { IoChevronDown } from "react-icons/io5"
import type { DireccionCliente } from "@/Hooks/Crm/useClientePcg"
import "@/Styles/Crm/CallCenter.css"

interface Props {
  item: DireccionCliente
  activa?: boolean
  onClick?: () => void
}

export default function CallCenterDireccionCard({ item, activa = false, onClick }: Props) {
  const [abierta, setAbierta] = useState(false)

  const detalles = [
    { label: "Sucursal", value: item.sucursal },
    { label: "Recibe", value: item.recibe },
    { label: "Hora máxima", value: item.horaMaxima }
  ].filter((detalle) => Boolean(detalle.value))

  const clases = [
    "cc-addr__item",
    activa ? "cc-addr__item--active" : "",
    abierta ? "cc-addr__item--open" : "",
    onClick ? "" : "cc-addr__item--static"
  ].filter(Boolean).join(" ")

  const resumen = (
    <>
      <p className="cc-addr__direccion">{item.direccion || "Sin dirección"}</p>
      <span className="cc-addr__barrio">{item.barrio || "Sin barrio"}</span>
    </>
  )

  return (
    <div className={clases}>
      <div className="cc-addr__head">
        {onClick ? (
          <button type="button" className="cc-addr__main" onClick={onClick}>
            {resumen}
          </button>
        ) : (
          <div className="cc-addr__main">{resumen}</div>
        )}
        <span className="cc-addr__price">NIO {item.precio.toFixed(2)}</span>
        <button
          type="button"
          className="cc-icon-btn cc-addr__toggle"
          aria-expanded={abierta}
          aria-label={abierta ? "Ocultar detalle" : "Ver detalle"}
          onClick={() => setAbierta((prev) => !prev)}
        >
          <IoChevronDown size={16} />
        </button>
      </div>

      {abierta && detalles.length > 0 && (
        <dl className="cc-addr__meta">
          {detalles.map((detalle) => (
            <div key={detalle.label}>
              <dt>{detalle.label}</dt>
              <dd>{detalle.value}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  )
}
