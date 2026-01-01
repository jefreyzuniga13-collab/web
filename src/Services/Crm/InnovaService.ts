import type { INNOVAClientResultInterface, InnovaClient } from '@/Interfaces/Crm/InnovaInterface'
import api from '@/Utils/ApiConfig'
import type { ApiResponse } from 'Interfaces/Auth/AuthInterface';


class InnovaServ{
    async getInnovaClientAsync(): Promise<INNOVAClientResultInterface[]>{
        const {data} = await api.get<ApiResponse<INNOVAClientResultInterface[]>>
        ("/Innova/getInnovaClient");

        return data.data;
    }

    async getInnovaClientByIdAsync(codCliente: string): Promise<InnovaClient>{

        const {data} = await api.get<ApiResponse<InnovaClient>>
        (`innova/clientes/${codCliente}`);

        return data.data;
    }
}

export const InnovaService = new InnovaServ;