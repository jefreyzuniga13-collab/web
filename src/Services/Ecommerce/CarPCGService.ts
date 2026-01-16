import type {
    CarDto,
    DetalleFacturaTempoData,
    DetalleFacturaTempoRequest,
    FaloteRequestDto,
    FaloteResponseDto
} from '@/Interfaces/Crm/CartPCGInterface'
import type {ApiPCGResponse} from '@/Interfaces/Common/GlobalPCGInterface'
import {apiPCG} from '@/Utils/ApiConfig'
import {AxiosError} from 'axios'

function formatError(error: unknown): Error {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const axiosError = error as AxiosError<ApiPCGResponse<any>>;
    const message = axiosError.response?.data?.message 
    ?? axiosError.message;
    return new Error(message);
}

class CartServ {
    async AddProductToCar(req: CarDto): Promise<ApiPCGResponse<CarDto[]>>{
       try{
         const {data} = await apiPCG.post<ApiPCGResponse<CarDto[]>>( `CarritoCompra/AgregaCarrito`, req);
         return data;

       }catch(error){
        throw formatError(error)
       }
    }

    async GetConsecDocAsync(req: FaloteRequestDto):Promise<ApiPCGResponse<FaloteResponseDto>>{
       try{
         const {data} = await apiPCG.get<ApiPCGResponse<FaloteResponseDto>>( `CarritoCompra/obtenerConsecDoc/${req.codSucursal}/${req.documento}`);
         return data;

       }catch(error){
        throw formatError(error)
       }
    }

    async AddProductToTempo(req: DetalleFacturaTempoRequest): Promise<ApiPCGResponse<DetalleFacturaTempoData>>{
       try{
         const {data} = await apiPCG.post<ApiPCGResponse<DetalleFacturaTempoData>>( `CarritoCompra/InsertaDetalleFactura`, req);
         return data;

       }catch(error){
        throw formatError(error)
       }
    }

      async AddProductToPCGCar(req: DetalleFacturaTempoRequest): Promise<ApiPCGResponse<CarDto[]>>{
       try{
         const {data} = await apiPCG.post<ApiPCGResponse<CarDto[]>>( `CarritoCompra/AgregaCarrito`, req);
         return data;

       }catch(error){
        throw formatError(error)
       }
    }

     async AddProductsToCar(req: CarDto[]): Promise<CarDto[]>{
       try{
         const {data} = await apiPCG.post<ApiPCGResponse<CarDto[]>>( `CarritoCompra/AgregaCarrito`, req);
         return data.data;

       }catch(error){
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


async removeProductFromCar(
  idUsuario: number,
  noPedido: number,
  codProducto: string,
  unico: string
): Promise<ApiPCGResponse<CarDto[]>> {
  try {
    const cleanCode = codProducto.trim();

    const { data } = await apiPCG.put<ApiPCGResponse<CarDto[]>>(
      `CarritoCompra/QuitarCarrito/${idUsuario}/${noPedido}`,
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


}

export const CartService = new CartServ();