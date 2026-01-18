import type {ApiPCGResponse} from '@/Interfaces/Common/GlobalPCGInterface'
import {apiPCG} from '@/Utils/ApiConfig'
import type {ClientLocation2Dto, ClientLocationDto} from '@/Interfaces/Ecommerce/ClientLocationInterface'

class ClientLocationServ {
    async Create(req: ClientLocationDto): Promise<ApiPCGResponse<ClientLocationDto>>{
        const {data} = await apiPCG.post<ApiPCGResponse<ClientLocationDto>>
        (`Direcciones/AgregaDireccion`, req)

        return data;
    }

    async Get(req: number): Promise<ApiPCGResponse<ClientLocationDto>>{
        const {data} = await apiPCG.get<ApiPCGResponse<ClientLocationDto>>
        (`Direcciones/ListaDirecciones/${req}`);
        return data;
    }

    async GetDirecctionByUserAndId(idUsuario : number, idDireccion : number): Promise<ApiPCGResponse<ClientLocation2Dto>>{
        const {data} = await apiPCG.get<ApiPCGResponse<ClientLocationDto>>
        (`Direcciones/ListaDirecciones/${idUsuario}/${idDireccion}`);
        return data;
    }

    async GetTranspCost(req: number): Promise<ApiPCGResponse<number>>{
        const {data} = await apiPCG.get<ApiPCGResponse<number>>
        (`Catalogos/Transporte/${req}`);
        return data;
    }
}

export const ClientLocationService = new ClientLocationServ();