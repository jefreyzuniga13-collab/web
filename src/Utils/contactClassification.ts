const CLASSIFICATION_COLORS: Record<string, string> = {
  potencial: "#2563eb",
  seguimiento: "#16a34a",
  venta: "#7c3aed",
  sinclasificar: "#64748b",
}

function normalizeClassificationKey(value?: string | null) {
  return (value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "")
}

export function getClassificationCode(
  bgColor?: string | null,
  name?: string | null
) {
  const fromColor = normalizeClassificationKey(bgColor)
  if (fromColor in CLASSIFICATION_COLORS) {
    return fromColor
  }

  const fromName = normalizeClassificationKey(name)

  if (fromName.includes("potencial")) return "potencial"
  if (fromName.includes("seguimiento")) return "seguimiento"
  if (fromName.includes("venta")) return "venta"

  return "sinclasificar"
}

export function getClassificationColor(
  bgColor?: string | null,
  name?: string | null
) {
  const raw = (bgColor ?? "").trim()

  if (raw.startsWith("#") || raw.startsWith("rgb")) {
    return raw
  }

  return CLASSIFICATION_COLORS[getClassificationCode(bgColor, name)]
}
