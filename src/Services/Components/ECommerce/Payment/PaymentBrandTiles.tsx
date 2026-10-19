import PaymentBrandLogo from "@/Services/Components/ECommerce/Payment/PaymentBrandLogo"
import "@/Styles/Ecommerce/Payment/PaymentBrandTiles.css"

export type PaymentBrandTileItem = {
  id: string
  label: string
}

type Props = {
  items: PaymentBrandTileItem[]
  value: string
  onChange: (id: string) => void
  disabled?: boolean
  emptyText?: string
}

export default function PaymentBrandTiles({
  items,
  value,
  onChange,
  disabled = false,
  emptyText = "No hay opciones disponibles.",
}: Props) {
  if (items.length === 0) {
    return <p className="payment-brand-tiles__empty">{emptyText}</p>
  }

  return (
    <div className="payment-brand-tiles">
      {items.map((item) => {
        const isActive = value === item.id

        return (
          <button
            key={item.id}
            type="button"
            disabled={disabled}
            onClick={() => onChange(item.id)}
            className={
              isActive
                ? "payment-brand-tile payment-brand-tile--active"
                : "payment-brand-tile"
            }
            title={item.label}
          >
            <PaymentBrandLogo label={item.label} />
            <span className="payment-brand-tile__label">{item.label}</span>
          </button>
        )
      })}
    </div>
  )
}
