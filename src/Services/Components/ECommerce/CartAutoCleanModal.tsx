import { useEffect, useMemo, useState } from "react"
import { Clock3, Search, ShoppingCart, Users, X } from "lucide-react"

import Button from "@/Services/Components/Common/Button"
import type { AutoCleanedCartSummary } from "@/Interfaces/Crm/AutoCleanedCart"
import "@/Styles/Ecommerce/CartAutoCleanModal.css"

interface Props {
  items: AutoCleanedCartSummary[]
  onClose: () => void
}

const AVATAR_TONES = [
  "blue",
  "orange",
  "green",
  "violet",
  "slate",
] as const

function formatDate(value: string): string {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return value

  return date.toLocaleString("es-NI", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)

  if (parts.length === 0) return "?"
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()

  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
}

function avatarTone(key: string): (typeof AVATAR_TONES)[number] {
  const hash = [...key].reduce((sum, char) => sum + char.charCodeAt(0), 0)

  return AVATAR_TONES[hash % AVATAR_TONES.length]
}

function matchesQuery(item: AutoCleanedCartSummary, query: string): boolean {
  if (!query) return true

  const haystack = [
    item.contactName,
    item.createdByName,
    item.orderId,
    item.contactId,
    item.reason,
  ]
    .join(" ")
    .toLowerCase()

  return haystack.includes(query)
}

export function CartAutoCleanModal({ items, onClose }: Props) {
  const [query, setQuery] = useState("")

  const hoursLimit = items[0]?.hoursLimit || 12
  const uniqueContacts = useMemo(
    () => new Set(items.map((item) => item.contactId)).size,
    [items]
  )
  const uniqueCreators = useMemo(
    () =>
      new Set(
        items.map((item) => item.createdByName.trim() || "Sin responsable")
      ).size,
    [items]
  )

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase()

    return items.filter((item) => matchesQuery(item, normalized))
  }, [items, query])

  const groups = useMemo(() => {
    const shouldGroup = uniqueCreators > 1 && items.length > 4
    const map = new Map<string, AutoCleanedCartSummary[]>()

    for (const item of filtered) {
      const key = shouldGroup
        ? item.createdByName.trim() || "Sin responsable"
        : "all"

      const current = map.get(key) ?? []
      current.push(item)
      map.set(key, current)
    }

    return [...map.entries()]
  }, [filtered, items.length, uniqueCreators])

  const showSearch = items.length > 5
  const showGroups = uniqueCreators > 1 && items.length > 4

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose()
    }

    document.addEventListener("keydown", handleKeyDown)
    document.body.classList.add("cart-auto-clean-body-lock")

    return () => {
      document.removeEventListener("keydown", handleKeyDown)
      document.body.classList.remove("cart-auto-clean-body-lock")
    }
  }, [onClose])

  return (
    <div
      className="cart-auto-clean"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cart-auto-clean-title"
    >
      <button
        type="button"
        className="cart-auto-clean__backdrop"
        aria-label="Cerrar"
        onClick={onClose}
      />

      <div className="cart-auto-clean__card">
        <header className="cart-auto-clean__header">
          <div className="cart-auto-clean__heading">

            <div>
              <p className="cart-auto-clean__eyebrow">Limpieza automática completada</p>
              {/* <h2 id="cart-auto-clean-title">Limpieza automática completada</h2> */}
            </div>
          </div>

          <button
            type="button"
            className="cart-auto-clean__close"
            aria-label="Cerrar"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </header>

        <p className="cart-auto-clean__lead">
          Se retiraron los elementos para no dejar pedidos pendientes de sesiones anteriores. {hoursLimit} h.
        </p>

        <div className="cart-auto-clean__stats">
          <div className="cart-auto-clean__stat">
            <ShoppingCart size={16} />
            <div>
              <strong>{items.length}</strong>
              <span>{items.length === 1 ? "carrito" : "carritos"}</span>
            </div>
          </div>
          <div className="cart-auto-clean__stat">
            <Users size={16} />
            <div>
              <strong>{uniqueContacts}</strong>
              <span>{uniqueContacts === 1 ? "contacto" : "contactos"}</span>
            </div>
          </div>
          <div className="cart-auto-clean__stat">
            <Clock3 size={16} />
            <div>
              <strong>{hoursLimit} h</strong>
              <span>tiempo de espera</span>
            </div>
          </div>
        </div>

        {showSearch && (
          <label className="cart-auto-clean__search">
            <Search size={16} />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar contacto, pedido o agente"
              autoComplete="off"
            />
          </label>
        )}

        <div className="cart-auto-clean__list" role="list">
          {filtered.length === 0 ? (
            <p className="cart-auto-clean__empty">
              Ningún carrito coincide con “{query.trim()}”.
            </p>
          ) : (
            groups.map(([groupName, groupItems]) => (
              <section key={groupName} className="cart-auto-clean__group">
                {showGroups && (
                  <h3 className="cart-auto-clean__group-title">
                    {groupName}
                    <span>{groupItems.length}</span>
                  </h3>
                )}

                {groupItems.map((item) => {
                  const name =
                    item.contactName.trim() || `Contacto ${item.contactId}`

                  return (
                    <article
                      key={item.logCartId}
                      className="cart-auto-clean__row"
                      role="listitem"
                    >
                      <span
                        className={`cart-auto-clean__avatar cart-auto-clean__avatar--${avatarTone(name)}`}
                      >
                        {getInitials(name)}
                      </span>

                      <div className="cart-auto-clean__row-main">
                        <div className="cart-auto-clean__row-top">
                          <strong>{name}</strong>
                          <span className="cart-auto-clean__order">
                            Pedido {item.orderId}
                          </span>
                        </div>
                        <p className="cart-auto-clean__meta">
                          Creado por {item.createdByName.trim() || "N/D"}
                          <span aria-hidden> · </span>
                          {formatDate(item.createdAt)}
                        </p>
                      </div>
                    </article>
                  )
                })}
              </section>
            ))
          )}
        </div>

        <footer className="cart-auto-clean__footer">
          <p>
            {query.trim()
              ? `${filtered.length} de ${items.length}`
              : `${items.length} ${items.length === 1 ? "registro" : "registros"}`}
          </p>
          <Button variant="primary" onClick={onClose}>
            Entendido
          </Button>
        </footer>
      </div>
    </div>
  )
}
