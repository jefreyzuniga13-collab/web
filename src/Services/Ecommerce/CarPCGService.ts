import type {
  CarDto,
  DetalleFacturaTempoData,
  DetalleFacturaTempoRequest,
  FaloteRequestDto,
  FaloteResponseDto,
  InvoiceTotalsDto

} from '@/Interfaces/Crm/CartPCGInterface'
import type { ApiPCGResponse } from '@/Interfaces/Common/GlobalPCGInterface'
import { apiPCG } from '@/Utils/ApiConfig'
import { AxiosError } from 'axios'
import type { ExistenciaSucursalItem, FacturaTempo, ObtenerDivisaPagosTipoReq, ObtenerDivisaPagosTipoRes } from '@/Interfaces/Ecommerce/FacturaTempo';
import type { NearestBranchResponseDto } from '@/Interfaces/Ecommerce/InvoiceOrderInterface';
import type {
  CalculationReqDto,
  CalculationResultDto,
  TotalesPantallaReqDTO
} from '@/Interfaces/Ecommerce/ClientLocationInterface';
import type { ApiResponse } from '@/Interfaces/Auth/AuthInterface';

function formatError(error: unknown): Error {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const axiosError = error as AxiosError<ApiPCGResponse<any>>;
  const message = axiosError.response?.data?.message
    ?? axiosError.message;
  return new Error(message);
}

class CartServ {
  async AddProductToCar(req: CarDto): Promise<ApiPCGResponse<CarDto[]>> {
    try {
      const { data } = await apiPCG.post<ApiPCGResponse<CarDto[]>>(`CarritoCompra/AgregaCarrito`, req);
      return data;

    } catch (error) {
      throw formatError(error)
    }
  }

  async VspConsolidadoFactura(req: CalculationReqDto): Promise<ApiPCGResponse<InvoiceTotalsDto[]>> {
    try {
      const { data } = await apiPCG.post<ApiPCGResponse<InvoiceTotalsDto[]>>(`CarritoCompra/VspConsolidadoFactura`, req);
      return data;

    } catch (error) {
      throw formatError(error)
    }
  }

  async sp_valida_SobTotalFactura(req: TotalesPantallaReqDTO): Promise<ApiPCGResponse<CalculationResultDto[]>> {
    try {
      const { data } = await apiPCG.post<ApiPCGResponse<CalculationResultDto[]>>(`CarritoCompra/sp_valida_SobTotalFactura`, req);
      return data;

    } catch (error) {
      throw formatError(error)
    }
  }

  async GetConsecDocAsync(req: FaloteRequestDto): Promise<ApiPCGResponse<FaloteResponseDto>> {
    try {
      const { data } = await apiPCG.get<ApiPCGResponse<FaloteResponseDto>>(`CarritoCompra/obtenerConsecDoc/${req.codSucursal}/${req.documento}`);
      return data;

    } catch (error) {
      throw formatError(error)
    }
  }


  async GetDivisaPagosTipoAsync(req: ObtenerDivisaPagosTipoReq): Promise<ApiPCGResponse<ObtenerDivisaPagosTipoRes>> {
    try {
      const { data } = await apiPCG.get<ApiPCGResponse<ObtenerDivisaPagosTipoRes>>(`Catalogos/ObtenerDivisaPagosTipo/${req.codigo}/${req.formulario}/${req.opcion}`);
      return data;

    } catch (error) {
      throw formatError(error)
    }
  }

  async AddProductToTempo(req: DetalleFacturaTempoRequest): Promise<ApiPCGResponse<DetalleFacturaTempoData>> {
    try {
      const { data } = await apiPCG.post<ApiPCGResponse<DetalleFacturaTempoData>>(`CarritoCompra/InsertaDetalleFactura`, req);
      return data;

    } catch (error) {
      throw formatError(error)
    }
  }
  
  async AddProductToPCGCar(req: DetalleFacturaTempoRequest): Promise<ApiPCGResponse<CarDto[]>> {
    try {
      const { data } = await apiPCG.post<ApiPCGResponse<CarDto[]>>(`CarritoCompra/AgregaCarrito`, req);
      return data;

    } catch (error) {
      throw formatError(error)
    }
  }

  async AddProductsToCar(req: CarDto[]): Promise<CarDto[]> {
    try {
      const { data } = await apiPCG.post<ApiPCGResponse<CarDto[]>>(`CarritoCompra/AgregaCarrito`, req);
      return data.data;

    } catch (error) {
      throw formatError(error)
    }
  }

  async getProductFromTempTotal(codproducto: string): Promise<ExistenciaSucursalItem[]> {
    try {
      const { data } = await apiPCG.get<ApiPCGResponse<ExistenciaSucursalItem[]>>(
        `CarritoCompra/ExistenciaProductoSucursal/${codproducto}`
      )

      return data.data
    } catch (error) {
      throw formatError(error)
    }
  }


  async getProductFromCar(codCliente: number, noPedido: number): Promise<CarDto[]> {
    try {
      const { data } = await apiPCG.get<ApiPCGResponse<CarDto[]>>(
        `CarritoCompra/OrdenEn/${codCliente}/${noPedido.toString()}`
      )

      return data.data
    } catch (error) {
      throw formatError(error)
    }
  }

  async getBranchByCod(codSucursal: string): Promise<NearestBranchResponseDto[]> {
    try {
      const { data } = await apiPCG.get<ApiPCGResponse<NearestBranchResponseDto[]>>(
        `Catalogos/ObtenerSucursalporCodigo/${codSucursal}`
      )

      return data.data
    } catch (error) {
      throw formatError(error)
    }
  }

  async removeProductFromCar(
    idUsuario: number,
    noPedido: number,
    codProducto: string,
    unico: string
  ): Promise<ApiPCGResponse<CarDto[]>> {
    try {
      const cleanCode = codProducto.trim();
      const cleannoPedido = noPedido.toString().trim();

      const { data } = await apiPCG.put<ApiPCGResponse<CarDto[]>>(
        `CarritoCompra/QuitarCarrito/${idUsuario}/${cleannoPedido}`,
        null,
        {
          params: {
            CodProducto: cleanCode,
            Unico: unico,
          },
        }
      );

      return data;
    } catch (error) {
      throw formatError(error);
    }
  }
  async CreatePCG(req: FacturaTempo): Promise<ApiPCGResponse<string>> {
    const { data } = await apiPCG.post<ApiPCGResponse<string>>(`CarritoCompra/InsertaFactura`, req)

    return data;
  }
  async LimpiarFacturaTempo(usuario: string, maquina: string): Promise<ApiResponse<null>> {
    try {
      const { data } = await apiPCG.get<ApiResponse<null>>(
        `CarritoCompra/Limpiar_Factura_Tempo/${usuario}/${maquina}`
      )

      return data;
    } catch (error) {
      throw formatError(error)
    }
  }
}

export const CartService = new CartServ();