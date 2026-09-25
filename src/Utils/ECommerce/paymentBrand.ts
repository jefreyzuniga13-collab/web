export type PaymentBrandKey =
  | "bac"
  | "lafise"
  | "banpro"
  | "visa"
  | "mastercard"
  | "amex"
  | "mipos"
  | "cash"
  | "transfer"
  | "card"
  | "generic"

const BRAND_ALIASES: Array<{ key: PaymentBrandKey; match: string[] }> = [
  { key: "bac", match: ["bac", "bacc", "credomatic"] },
  { key: "lafise", match: ["lafise"] },
  { key: "banpro", match: ["banpro"] },
  { key: "visa", match: ["visa"] },
  { key: "mastercard", match: ["master", "mastercard"] },
  { key: "amex", match: ["amex", "american"] },
  { key: "mipos", match: ["mipos", "mi pos", "pinpad", "pos"] },
  { key: "cash", match: ["efectivo", "cash"] },
  { key: "transfer", match: ["transfer", "transferencia"] },
  { key: "card", match: ["tarjeta", "card"] },
]

export function normalizeBrandText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
}

export function resolvePaymentBrandKey(label: string): PaymentBrandKey {
  const text = normalizeBrandText(label)

  const found = BRAND_ALIASES.find((brand) =>
    brand.match.some((token) => text.includes(token))
  )

  return found?.key ?? "generic"
}

export function getBrandInitials(label: string): string {
  const words = label
    .replace(/[^A-Za-z0-9ÁÉÍÓÚáéíóúÑñ ]/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean)

  if (words.length === 0) {
    return "?"
  }

  if (words.length === 1) {
    return words[0].slice(0, 3).toUpperCase()
  }

  return words
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase()
}
