export type ReverseGeocodingResult = {
  fullAddress: string
  city: string
  country: string
  displayName: string
}

type NominatimAddress = {
  road?: string
  neighbourhood?: string
  suburb?: string
  city?: string
  town?: string
  village?: string
  municipality?: string
  county?: string
  state?: string
  country?: string
  postcode?: string
}

type NominatimResponse = {
  display_name?: string
  address?: NominatimAddress
}

/**
 * Obtiene el texto de ciudad más adecuado desde la respuesta del servicio.
 */
const getCityFromAddress = (address?: NominatimAddress): string => {
  if (!address) return ""

  return (
    address.city ||
    address.town ||
    address.village ||
    address.municipality ||
    address.county ||
    address.state ||
    ""
  ).trim()
}

/**
 * Construye una dirección corta y legible para mostrar en el formulario.
 */
const buildShortAddress = (
  address?: NominatimAddress,
  displayName = ""
): string => {
  if (!address) return displayName.trim()

  const parts = [
    address.road,
    address.neighbourhood,
    address.suburb,
    address.city,
    address.town,
    address.village,
    address.municipality,
    address.state,
    address.country
  ]
    .map((item) => String(item ?? "").trim())
    .filter(Boolean)

  const uniqueParts = Array.from(new Set(parts))

  if (uniqueParts.length > 0) {
    return uniqueParts.join(", ")
  }

  return displayName.trim()
}

/**
 * Consulta la dirección aproximada a partir de latitud y longitud.
 *
 * Se usa para llenar automáticamente ciudad y dirección cuando el usuario
 * selecciona un punto en el mapa.
 */
export const getAddressFromCoords = async (
  latitud: number,
  longitud: number
): Promise<ReverseGeocodingResult> => {
  const lat = Number(latitud)
  const lng = Number(longitud)

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return {
      fullAddress: "",
      city: "",
      country: "",
      displayName: ""
    }
  }

  const params = new URLSearchParams({
    format: "jsonv2",
    lat: String(lat),
    lon: String(lng),
    addressdetails: "1",
    zoom: "18",
    "accept-language": "es"
  })

  const response = await fetch(
    `https://nominatim.openstreetmap.org/reverse?${params.toString()}`
  )

  if (!response.ok) {
    throw new Error("No se pudo obtener la dirección desde el mapa.")
  }

  const data = (await response.json()) as NominatimResponse

  const address = data.address
  const displayName = String(data.display_name ?? "").trim()

  return {
    fullAddress: buildShortAddress(address, displayName),
    city: getCityFromAddress(address),
    country: String(address?.country ?? "").trim(),
    displayName
  }
}