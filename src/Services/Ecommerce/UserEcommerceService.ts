import type {UserEcommerceDto} from '@/Interfaces/Ecommerce/UserEcommerceInterface'
import type {ApiPCGResponse} from '@/Interfaces/Common/GlobalPCGInterface'
import {apiPCG} from '@/Utils/ApiConfig'

class UserEcommerceServ {


      private generarTelefono8(): string {
    const first = Math.floor(Math.random() * 9) + 1;

    let rest = "";
    for (let i = 0; i < 7; i++) {
      rest += Math.floor(Math.random() * 10);
    }

    return `${first}${rest}`;
  }

    async Create(req: UserEcommerceDto): Promise<ApiPCGResponse<number>>{

        if (!req.telefono || req.telefono.trim() === "") {
            req.telefono = this.generarTelefono8();
        }

        const {data} = await 
        apiPCG.post<ApiPCGResponse<number>>(`Usuarios/Agregar-Usuario`, req);
        
        return data;
    }

}

export const UserEcommerceService = new UserEcommerceServ()