import type {UserEcommerceDto} from '@/Interfaces/Ecommerce/UserEcommerceInterface'
import type {ApiPCGResponse} from '@/Interfaces/Common/GlobalPCGInterface'
import {apiPCG} from '@/Utils/ApiConfig'
import {randomPhoneNumber} from '@/Utils/ECommerce/formatters'

class UserEcommerceServ {

    async Create(req: UserEcommerceDto): Promise<ApiPCGResponse<number>>{

      //Lo pide la api, y es requirido.
        if (!req.telefono || req.telefono.trim() === "") {
            req.telefono = randomPhoneNumber();
        }

        const {data} = await 
        apiPCG.post<ApiPCGResponse<number>>(`Usuarios/Agregar-Usuario`, req);
        
        return data;
    }
}

export const UserEcommerceService = new UserEcommerceServ()