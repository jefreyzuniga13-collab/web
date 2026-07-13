import type {
  Coords,
  LocationMode
} from "@/Interfaces/Ecommerce/ClientLocationInterface"

import type {
  BillingFormState,
  CardFormState
} from "@/Interfaces/Ecommerce/InvoiceOrderInterface"

import { toast } from "react-toastify"

/**
 * Elimina todo carácter que no sea número.
 */
export const onlyDigits = (value: string): string => {
  return value.replace(/\D/g, "")
}

/**
 * Formatea el número de tarjeta en bloques de cuatro dígitos.
 */
export const formatCardNumber = (value: string): string => {
  const digits = onlyDigits(value).slice(0, 19)

  return digits.replace(/(\d{4})(?=\d)/g, "$1 ").trim()
}

/**
 * Formatea la fecha de expiración en formato MM/AA.
 */
export const formatExpiry = (value: string): string => {
  const digits = onlyDigits(value).slice(0, 4)

  if (digits.length <= 2) return digits

  return `${digits.slice(0, 2)}/${digits.slice(2)}`
}

/**
 * Formatea el CVC permitiendo únicamente números.
 */
export const formatCvc = (value: string): string => {
  return onlyDigits(value).slice(0, 4)
}

/**
 * Muestra un mensaje y retorna false.
 */
const toastError = (message: string): false => {
  toast.error(message)
  return false
}

/**
 * Valida los datos de dirección.
 *
 * Solo texto:
 * exige únicamente la dirección escrita.
 *
 * Nueva dirección con mapa:
 * exige dirección y nombre.
 */
export const validateBillingForm = (
  billingForm: BillingFormState,
  locationMode: LocationMode,
  onlyTextAddress = false
): boolean => {
  if (!billingForm.address.trim()) {
    return toastError("La dirección es obligatoria.")
  }

  if (
    !onlyTextAddress &&
    locationMode === "new" &&
    !billingForm.addressName.trim()
  ) {
    return toastError("El nombre de la dirección es obligatorio.")
  }

  return true
}

/**
 * Valida una tarjeta del formulario antiguo del checkout.
 */
export const validateCardForm = (
  cardForm: CardFormState
): boolean => {
  if (!/^\d{2}\/\d{2}$/.test(cardForm.expiry.trim())) {
    return toastError("Formato expiración MM/AA inválido.")
  }

  if (!isExpiryValid(cardForm.expiry)) {
    return toastError("La tarjeta está vencida.")
  }

  return true
}

/**
 * Valida la ubicación seleccionada.
 *
 * Solo texto:
 * no requiere dirección guardada ni coordenadas.
 *
 * Existing:
 * requiere una dirección guardada.
 *
 * New:
 * requiere coordenadas del mapa.
 */
export const validateLocation = (
  locationMode: LocationMode,
  selectedAddressId: number | null,
  selectedCoords: Coords | null,
  onlyTextAddress = false,
  manualAddress = ""
): boolean => {
  if (onlyTextAddress) {
    if (!manualAddress.trim()) {
      return toastError("Escribe la dirección de entrega.")
    }

    return true
  }

  if (locationMode === "existing") {
    if (!selectedAddressId) {
      return toastError("Selecciona una dirección de entrega.")
    }

    return true
  }

  if (!selectedCoords) {
    return toastError("Debes seleccionar la ubicación.")
  }

  return true
}

/**
 * Valida que una fecha MM/AA no esté vencida.
 */
export function isExpiryValid(value: string): boolean {
  const match = value.match(/^(\d{2})\/(\d{2})$/)

  if (!match) return false

  const month = Number(match[1])
  const year = Number(match[2])

  if (month < 1 || month > 12) return false

  const now = new Date()
  const currentMonth = now.getMonth() + 1
  const currentYear = now.getFullYear() % 100

  if (year < currentYear) return false

  if (year === currentYear && month < currentMonth) {
    return false
  }

  return true
}