import{ apiPCG } from "@/Utils/ApiConfig"
import type { MonedaInterface, TasaCambioInterface } from "@/Interfaces/Ecommerce/Moneda";
import type { ApiPCGResponse } from "@/Interfaces/Common/GlobalPCGInterface";

class MonedaServ {
    async Listar():Promise<ApiPCGResponse<MonedaInterface[]>>{
        const {data} = await apiPCG.get<ApiPCGResponse<MonedaInterface[]>>(`Catalogos/ListarMoneda`);
        return data;
    }

    async TasaCambio(fecha: string): Promise<TasaCambioInterface>{
        const {data} = await apiPCG.get<ApiPCGResponse<TasaCambioInterface>>(`Catalogo`,{
            params:{
                fecha: fecha
            }
        }
    )
        
    return data.data;
    }
}

export const MonedaService = new MonedaServ();


