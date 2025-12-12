import type {UserEcommerceDto} from '@/Interfaces/Ecommerce/UserEcommerceInterface'
import type {ApiPCGResponse} from '@/Interfaces/GlobalPCGInterface'
import {apiPCG} from '@/Utils/ApiConfig'

class UserEcommerceServ {
    async Create(req: UserEcommerceDto): Promise<ApiPCGResponse<number>>{
        const {data} = await 
        apiPCG.post<ApiPCGResponse<number>>(`Usuarios/Agregar-Usuario`, req);
        
        return data;
    }

}

export const UserEcommerceService = new UserEcommerceServ()