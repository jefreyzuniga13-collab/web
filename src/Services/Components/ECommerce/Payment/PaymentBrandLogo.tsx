import { Banknote, Building2, CreditCard, Smartphone } from "lucide-react"
import {
  getBrandInitials,
  resolvePaymentBrandKey,
  type PaymentBrandKey,
} from "@/Utils/ECommerce/paymentBrand"

type Props = {
  label: string
  className?: string
}

const TONE: Record<PaymentBrandKey, string> = {
  bac: "#e11d2e",
  lafise: "#0b5cab",
  banpro: "#0f8a3c",
  visa: "#1a1f71",
  mastercard: "#eb6000",
  amex: "#2e77bb",
  mipos: "#6d28d9",
  cash: "#15803d",
  transfer: "#1d4ed8",
  card: "#0f172a",
  generic: "#475569",
}

function BrandWord({
  text,
  color,
}: {
  text: string
  color: string
}) {
  return (
    <span className="payment-brand-logo__word" style={{ color }}>
      {text}
    </span>
  )
}

export default function PaymentBrandLogo({ label, className = "" }: Props) {
  const key = resolvePaymentBrandKey(label)
  const tone = TONE[key]

  return (
    <span className={`payment-brand-logo ${className}`} data-brand={key}>
      {key === "bac" && <BrandWord text="BAC" color={tone} />}
      {key === "lafise" && <BrandWord text="LAFISE" color={tone} />}
      {key === "banpro" && <BrandWord text="BANPRO" color={tone} />}
      {key === "visa" && <BrandWord text="VISA" color={tone} />}
      {key === "mastercard" && <BrandWord text="MC" color={tone} />}
      {key === "amex" && <BrandWord text="AMEX" color={tone} />}
      {key === "mipos" && <Smartphone size={18} color={tone} strokeWidth={2} />}
      {key === "cash" && <Banknote size={18} color={tone} strokeWidth={2} />}
      {key === "transfer" && <Building2 size={18} color={tone} strokeWidth={2} />}
      {key === "card" && <CreditCard size={18} color={tone} strokeWidth={2} />}
      {key === "generic" && (
        <span className="payment-brand-logo__initials" style={{ color: tone }}>
          {getBrandInitials(label)}
        </span>
      )}
    </span>
  )
}
