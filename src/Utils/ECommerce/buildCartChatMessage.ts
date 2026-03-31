import type { CarDto } from "@/Interfaces/Crm/CartPCGInterface"
import { formatCurrencyNIO } from "@/Utils/ECommerce/formatters"

type AddressLite = {
  idDireccion?: number | null
  nombre?: string | null
  descripcion?: string | null
  referencia?: string | null
}

type BuildCartChatMessageArgs = {
  cart: CarDto
  orderId?: number | null
  deliveryDate?: string | null

  retiraSucursal: "S" | "N"
  observation?: string | null

  effectiveShipping?: number
  invoiceTotal?: number

  selectedAddressId?: number | null
  addDescription?: string

  addresses?: AddressLite[]
}

const clean = (v: unknown) => String(v ?? "").trim()

export function buildCartChatMessage({
  cart,
  orderId,
  deliveryDate,
  retiraSucursal,
  observation,
  effectiveShipping = 0,
  invoiceTotal = 0,
  selectedAddressId = null,
  addDescription = "",
  addresses = [],
}: BuildCartChatMessageArgs) {
  const lines: string[] = []
  lines.push(`🛍️ Pedido No ${orderId ?? cart.noPedido ?? "N/D"}`)
  lines.push("")
  lines.push("🛒 Artículos:")
  lines.push("")

  cart.listDetalle?.forEach((d) => {
    const qty = d.cantidad ?? 0
    const desc = clean(d.descripcion)
    const obs = clean((d).observaciones)
    const title = [desc, obs].filter(Boolean).join(" - ")
    if (!title) return

    lines.push(`*${title}* - ${qty}`)

    const opciones =
      d.listOpciones
        ?.map((o) => clean(o.descripcionOp) + " - " + clean(o.cantidad))
        .map((s) => s.trim())
        .filter(Boolean) ?? []

    opciones.forEach((op) => lines.push(`   ${op}`))
    lines.push("")
  })

  const shipping = Number.isFinite(Number(effectiveShipping)) ? Number(effectiveShipping) : 0
  const total = Number(invoiceTotal)

  if (retiraSucursal === "S") {
    lines.push(`*🪙 Total:* ${formatCurrencyNIO(total)}`)

    lines.push("🏬 Retira en sucursal")
    const obs = clean(observation)
    if (obs.length > 0) lines.push(`📝 Observación: ${obs}`)
  } else {
    const hasShipping = shipping > 0

    lines.push(`*🪙 Total:* ${formatCurrencyNIO(total)}${hasShipping ?  "" : " | *Más envío*"}`)
    if (hasShipping) lines.push(`🚚 Envío: C$ ${shipping.toFixed(2)}`)

    if (selectedAddressId != null) {
      const selected = addresses.find((a) => Number(a.idDireccion) === Number(selectedAddressId))
      const addrName = clean(selected?.nombre)
      const addrDesc = clean(selected?.descripcion)
      const addrRef = clean(selected?.referencia)
      const best = [addrName, addrDesc, addrRef].filter((x) => x.length > 0).join(" | ")
      if (best.length > 0) lines.push(`📍 Dirección: ${best}`)
    } else {
      const manual = clean(addDescription)
      if (manual.length > 0) lines.push(`📍 Dirección: ${manual}`)
    }

    const obs = clean(observation)
    if (obs.length > 0) lines.push(`📝 Observación: ${obs}`)
  }

  if (deliveryDate) lines.push(`🗓️ Fecha de entrega: ${deliveryDate}`)
  return lines.join("\n").trim()
}