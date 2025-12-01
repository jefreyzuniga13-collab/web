import type {
    CarDto
} from '@/Interfaces/Crm/CartPCGInterface'
import type {ApiPCGResponse} from '@/Interfaces/GlobalPCGInterface'
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

     async AddProductsToCar(req: CarDto[]): Promise<CarDto[]>{
       try{
         const {data} = await apiPCG.post<ApiPCGResponse<CarDto[]>>( `CarritoCompra/AgregaCarrito`, req);
         return data.data;

       }catch(error){
        throw formatError(error)
       }
    }

    async getProductFromCar(codCliente: number):  Promise<CarDto[]>{
        try{
            const {data} = await apiPCG.get<ApiPCGResponse<CarDto[]>>(`CarritoCompra/OrdenEn/${codCliente}`)

            return data.data;
        }catch(error){
            throw formatError(error)
        }
    }

    async updateCar(idUsuario: number, noPedido: number): Promise<ApiPCGResponse<CarDto[]>>{
        try{
            const {data} = await apiPCG.put<ApiPCGResponse<CarDto[]>>(`CarritoCompra/QuitarCarrito/${idUsuario}/${noPedido}`);

            return data;
        }catch(error){
            throw formatError(error)
        }
    }
}

export const CartService = new CartServ();