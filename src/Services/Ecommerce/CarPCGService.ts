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
import type { ExistenciaSucursalItem, FacturaTempo, ObtenerDivisaPagosTipoReq, ObtenerDivisaPagosTipoRes } from '@/Interfaces/Ecommerce/FacturaTempo';
import type { NearestBranchResponseDto } from '@/Interfaces/Ecommerce/BranchInterfaces';
import type {
  CalculationReqDto,
  CalculationResultDto,
  TotalesPantallaReqDTO
} from '@/Interfaces/Ecommerce/ClientLocationInterface';
import type { ApiResponse } from '@/Interfaces/Auth/AuthInterface';


class CartServ {
  async AddProductToCar(req: CarDto): Promise<ApiPCGResponse<CarDto[]>> {
    const { data } = await apiPCG.post<ApiPCGResponse<CarDto[]>>(`CarritoCompra/AgregaCarrito`, req);
    return data;
  }

  async VspConsolidadoFactura(req: CalculationReqDto): Promise<ApiPCGResponse<InvoiceTotalsDto[]>> {
    const { data } = await apiPCG.post<ApiPCGResponse<InvoiceTotalsDto[]>>(`CarritoCompra/VspConsolidadoFactura`, req);
    return data;

  }

  async sp_valida_SobTotalFactura(req: TotalesPantallaReqDTO): Promise<ApiPCGResponse<CalculationResultDto[]>> {
    const { data } = await apiPCG.post<ApiPCGResponse<CalculationResultDto[]>>(`CarritoCompra/sp_valida_SobTotalFactura`, req);
    return data;

  }

  async GetConsecDocAsync(req: FaloteRequestDto): Promise<ApiPCGResponse<FaloteResponseDto>> {
    const { data } = await apiPCG.get<ApiPCGResponse<FaloteResponseDto>>(`CarritoCompra/obtenerConsecDoc/${req.codSucursal}/${req.documento}`);
    return data;

  }


  async GetDivisaPagosTipoAsync(req: ObtenerDivisaPagosTipoReq): Promise<ApiPCGResponse<ObtenerDivisaPagosTipoRes>> {
    const { data } = await apiPCG.get<ApiPCGResponse<ObtenerDivisaPagosTipoRes>>(`Catalogos/ObtenerDivisaPagosTipo/${req.codigo}/${req.formulario}/${req.opcion}`);
    return data;

  }

  async AddProductToTempo(req: DetalleFacturaTempoRequest): Promise<ApiPCGResponse<DetalleFacturaTempoData>> {
    const { data } = await apiPCG.post<ApiPCGResponse<DetalleFacturaTempoData>>(`CarritoCompra/InsertaDetalleFactura`, req);
    return data;

  }

  async AddProductToPCGCar(req: DetalleFacturaTempoRequest): Promise<ApiPCGResponse<CarDto[]>> {
    const { data } = await apiPCG.post<ApiPCGResponse<CarDto[]>>(`CarritoCompra/AgregaCarrito`, req);
    return data;

  }

  async AddProductsToCar(req: CarDto[]): Promise<CarDto[]> {
    const { data } = await apiPCG.post<ApiPCGResponse<CarDto[]>>(`CarritoCompra/AgregaCarrito`, req);
    return data.data;

  }

  async getProductFromTempTotal(codproducto: string): Promise<ExistenciaSucursalItem[]> {
    const { data } = await apiPCG.get<ApiPCGResponse<ExistenciaSucursalItem[]>>(
      `CarritoCompra/ExistenciaProductoSucursal/${codproducto}`
    )

    return data.data

  }


  async getProductFromCar(codCliente: number, noPedido: number): Promise<CarDto[]> {
    const { data } = await apiPCG.get<ApiPCGResponse<CarDto[]>>(
      `CarritoCompra/OrdenEn/${codCliente}/${noPedido.toString()}`
    )

    return data.data
  }

  async getBranchByCod(codSucursal: string): Promise<NearestBranchResponseDto[]> {
    const { data } = await apiPCG.get<ApiPCGResponse<NearestBranchResponseDto[]>>(
      `Catalogos/ObtenerSucursalporCodigo/${codSucursal}`
    )
    return data.data
  }

  async removeProductFromCar(
    idUsuario: number,
    noPedido: number,
    codProducto: string,
    unico: string
  ): Promise<ApiPCGResponse<CarDto[]>> {
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
  }
  async CreatePCG(req: FacturaTempo): Promise<ApiPCGResponse<string>> {
    const { data } = await apiPCG.post<ApiPCGResponse<string>>(`CarritoCompra/InsertaFactura`, req)

    return data;
  }
  async LimpiarFacturaTempo(usuario: string, maquina: string): Promise<ApiResponse<null>> {
    const { data } = await apiPCG.get<ApiResponse<null>>(
      `CarritoCompra/Limpiar_Factura_Tempo/${usuario}/${maquina}`
    )

    return data;
  }
}

export const CartService = new CartServ();