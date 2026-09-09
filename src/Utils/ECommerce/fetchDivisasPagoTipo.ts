import { CartService } from "@/Services/Ecommerce/CarPCGService";
import type { Currencyto } from "@/Interfaces/Ecommerce/InvoiceOrderInterface";
import type { ObtenerDivisaPagosTipoRes } from "@/Interfaces/Ecommerce/FacturaTempo";
import { safeStr } from "@/Utils/ECommerce/formatters";
import { readPublicEmpresaId } from "@/Utils/ECommerce/publicEmpresa";

const sleep = (ms: number) =>
  new Promise((resolve) => window.setTimeout(resolve, ms));

export const normalizarDivisasPagoTipo = (
  data: unknown
): ObtenerDivisaPagosTipoRes[] => {
  const list = Array.isArray(data)
    ? (data as ObtenerDivisaPagosTipoRes[])
    : data
      ? [data as ObtenerDivisaPagosTipoRes]
      : [];

  return list
    .filter(Boolean)
    .map((item) => ({
      nombre: safeStr(item.nombre),
      codigo: safeStr(item.codigo),
      codigoExterno: safeStr(item.codigoExterno),
      tipo: safeStr(item.tipo),
      banco: safeStr(item.banco),
      aCambio: safeStr(item.aCambio),
    }))
    .filter((item) => item.codigo || item.codigoExterno || item.nombre);
};

export const buildDivisaPagoTipoReq = (item: Currencyto) => {
  return {
    codigo: "0",
    formulario: "1-",
    opcion: safeStr(item?.codPago),
  };
};

/**
 * Catalogos/ObtenerDivisaPagosTipo depende del header empresa.
 * En el link público a veces la primera llamada llega vacía.
 */
export async function fetchDivisasPagoTipo(
  item: Currencyto,
  attempts = 3
): Promise<ObtenerDivisaPagosTipoRes[]> {
  const req = buildDivisaPagoTipoReq(item);

  if (!req.opcion) return [];

  let lastError: unknown = null;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      if (!readPublicEmpresaId() && attempt < attempts) {
        await sleep(250);
      }

      const resp = await CartService.GetDivisaPagosTipoAsync(req);
      const fixed = normalizarDivisasPagoTipo(resp?.data);

      if (fixed.length > 0) {
        return fixed;
      }

      if (attempt < attempts) {
        await sleep(350 * attempt);
      }
    } catch (error) {
      lastError = error;

      if (attempt < attempts) {
        await sleep(350 * attempt);
      }
    }
  }

  if (lastError) {
    throw lastError;
  }

  return [];
}
