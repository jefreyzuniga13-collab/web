import type { INNOVAClientResultInterface } from '@/Interfaces/InnovaInterface'
import api from '@/Utils/ApiConfig'
import type { ApiResponse } from 'Interfaces/Auth/AuthInterface';


class InnovaServ{
    async getInnovaClientAsync(): Promise<INNOVAClientResultInterface[]>{
        const {data} = await api.get<ApiResponse<INNOVAClientResultInterface[]>>
        ("/Innova/getInnovaClient");

        return data.data;
    }
}

export const InnovaService = new InnovaServ;