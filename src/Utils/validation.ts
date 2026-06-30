import type { Coords, LocationMode } from "@/Interfaces/Ecommerce/ClientLocationInterface";
import type { BillingFormState, CardFormState } from "@/Interfaces/Ecommerce/InvoiceOrderInterface";
import { toast } from "react-toastify";

export const onlyDigits = (s: string) => s.replace(/\D/g, "");

export const formatCardNumber = (value: string) => {
    const digits = onlyDigits(value).slice(0, 19);
    return digits.replace(/(\d{4})(?=\d)/g, "$1 ").trim();
};

export const formatExpiry = (value: string) => {
    const digits = onlyDigits(value).slice(0, 4);
    if (digits.length <= 2) return digits;
    return `${digits.slice(0, 2)}/${digits.slice(2)}`;
};

export const formatCvc = (value: string) => {
    const digits = onlyDigits(value).slice(0, 4);
    return digits;
};


export const validateBillingForm = (billingForm: BillingFormState,
    locationMode: LocationMode
) => {
    if (!billingForm.firstName.trim()) return toastError("El nombre es obligatorio.");
    // if (!billingForm.lastName.trim()) return toastError("Los apellidos son obligatorios.");
    // if (!billingForm.city.trim()) return toastError("La ciudad es obligatoria.");
    if (!billingForm.address.trim()) return toastError("La dirección es obligatoria.");
    if (locationMode === "new" && !billingForm.addressName.trim())
        return toastError("El nombre de la dirección es obligatorio.");
    return true;
};

export const validateCardForm = (cardForm: CardFormState) => {
    if (!/^\d{2}\/\d{2}$/.test(cardForm.expiry.trim()))
        return toastError("Formato expiración MM/AA inválido.");
    return true;
};

export   const validateLocation = (locationMode: LocationMode, 
    selectedAddressId: number | null, selectedCoords: Coords | null
) => {
    if (locationMode === "existing") {
      if (!selectedAddressId) return toastError("Selecciona una dirección de entrega.");
      return true;
    }
    if (!selectedCoords) return toastError("Debes seleccionar la ubicación.");
    return true;
  };

const toastError = (msg: string) => {
    toast.error(msg);
    return false;
};

export function isExpiryValid(value: string): boolean {
  const match = value.match(/^(\d{2})\/(\d{2})$/);
  if (!match) return false;

  const mm = Number(match[1]);
  const yy = Number(match[2]);

  if (mm < 1 || mm > 12) return false;

  const now = new Date();
  const currentMM = now.getMonth() + 1;
  const currentYY = now.getFullYear() % 100;

  if (yy < currentYY) return false;
  if (yy === currentYY && mm < currentMM) return false;

  return true;
}