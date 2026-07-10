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
 *
 * Se usa para limpiar tarjeta, CVC y fecha de vencimiento.
 */
export const onlyDigits = (value: string): string => {
  return value.replace(/\D/g, "")
}

/**
 * Formatea el número de tarjeta en bloques de 4 dígitos.
 *
 * Ejemplo:
 * 1234567812345678 -> 1234 5678 1234 5678
 */
export const formatCardNumber = (value: string): string => {
  const digits = onlyDigits(value).slice(0, 19)

  return digits.replace(/(\d{4})(?=\d)/g, "$1 ").trim()
}

/**
 * Formatea la fecha de expiración en formato MM/AA.
 *
 * Ejemplo:
 * 1228 -> 12/28
 */
export const formatExpiry = (value: string): string => {
  const digits = onlyDigits(value).slice(0, 4)

  if (digits.length <= 2) return digits

  return `${digits.slice(0, 2)}/${digits.slice(2)}`
}

/**
 * Formatea el CVC permitiendo solo números.
 */
export const formatCvc = (value: string): string => {
  return onlyDigits(value).slice(0, 4)
}

/**
 * Muestra un error y retorna false.
 *
 * Se centraliza para que las validaciones puedan usarse directamente
 * dentro de condicionales.
 */
const toastError = (message: string): false => {
  toast.error(message)

  return false
}

/**
 * Valida los datos básicos de facturación y dirección.
 *
 * Cuando locationMode es "new", el usuario debe ingresar también
 * un nombre para guardar o identificar la dirección.
 */
export const validateBillingForm = (
  billingForm: BillingFormState,
  locationMode: LocationMode
): boolean => {

  if (!billingForm.address.trim()) {
    return toastError("La dirección es obligatoria.")
  }

  if (locationMode === "new" && !billingForm.addressName.trim()) {
    return toastError("El nombre de la dirección es obligatorio.")
  }

  return true
}

/**
 * Valida una tarjeta del formulario antiguo del checkout.
 *
 * Este flujo aplica solo si todavía existe un formulario de tarjeta directa.
 * Para tarjeta manual se usa ManualCardPaymentSection.
 */
export const validateCardForm = (cardForm: CardFormState): boolean => {
  if (!/^\d{2}\/\d{2}$/.test(cardForm.expiry.trim())) {
    return toastError("Formato expiración MM/AA inválido.")
  }

  if (!isExpiryValid(cardForm.expiry)) {
    return toastError("La tarjeta está vencida.")
  }

  return true
}

/**
 * Valida la ubicación seleccionada según el modo.
 *
 * existing:
 * Debe existir una dirección guardada seleccionada.
 *
 * new:
 * Debe existir una coordenada seleccionada en el mapa.
 */
export const validateLocation = (
  locationMode: LocationMode,
  selectedAddressId: number | null,
  selectedCoords: Coords | null
): boolean => {
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