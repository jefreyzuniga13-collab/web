import { apiPCG } from "@/Utils/ApiConfig"
import type { ApiPCGResponse } from "@/Interfaces/Common/GlobalPCGInterface"
import type {
  MonedaCatalogo,
  TasaCambioCatalogo
} from "@/Interfaces/Ecommerce/MonedaCatalogo"
import { FechaManagua } from "@/Utils/FechaManagua"

class CatalogoServ {
  async ListarMoneda(): Promise<ApiPCGResponse<MonedaCatalogo[]>> {
    const { data } = await apiPCG.get<ApiPCGResponse<MonedaCatalogo[]>>(
      "Catalogos/ListarMoneda"
    )
    return data
  }

  async ObtenerTasaCambio(
    fechaTasaCambio = FechaManagua.obtenerIso()
  ): Promise<ApiPCGResponse<TasaCambioCatalogo>> {
    const { data } = await apiPCG.get<ApiPCGResponse<TasaCambioCatalogo>>(
      "Catalogos/ObtenerTasaCambio",
      { params: { fechaTasaCambio } }
    )
    return data
  }
}

// Diferenia de decimales, por ejemplo el monto ees 20.00, monto cordoba es 430.16, cambio es 302.15,
// pero el monto cordoba debio ser algo como 430.336 o similar, es en eso la diferencia

export const CatalogoService = new CatalogoServ()
