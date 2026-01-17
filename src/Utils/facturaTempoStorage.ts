import type { FacturaTempo } from "@/Interfaces/Ecommerce/FacturaTempo";
import { FACTURA_TEMPO_INITIAL } from "@/Utils/FacturaTempoInitial";
import { secureGet, secureRemove, secureSet } from "@/Utils/secureLocalStorage";
const KEY = "pcg.facturaTempo.v1";

export async function saveFacturaTempo(): Promise<void> {
  await secureSet(KEY, FACTURA_TEMPO_INITIAL);
}

export async function loadFacturaTempo(): Promise<FacturaTempo> {
  const data = await secureGet<FacturaTempo>(KEY);
  return data ?? FACTURA_TEMPO_INITIAL;
}

export function clearFacturaTempo(): void {
  secureRemove(KEY);
}