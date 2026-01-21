import {apiPCG} from '@/Utils/ApiConfig'
import type {ApiPCGResponse} from '@/Interfaces/Common/GlobalPCGInterface'
import type {InvoiceOrderRequestDto, 
    InvoiceOrderInterface, Currencyto, NearestBranchRequestDto, NearestBranchResponseDto,
    // PrintOrdenFactInterfaceRaw
} from '@/Interfaces/Ecommerce/InvoiceOrderInterface'
import type { FacturaTempo } from "@/Interfaces/Ecommerce/FacturaTempo";

class InvoiceOrderServ{
    async Create(req: InvoiceOrderRequestDto): Promise<ApiPCGResponse<string>>{
        const {data} = await apiPCG.post<ApiPCGResponse<string>>(`OrdenFactura/AgregaOrdenFact`, req)

        return data;
    } 


async CreatePCG(req: FacturaTempo): Promise<ApiPCGResponse<string>>{
        const {data} = await apiPCG.post<ApiPCGResponse<string>>(`CarritoCompra/InsertaFactura`, req)

        return data;
    } 

    // async PrintDetFac(
    //     fecha: string, 
    //     sucursal: string, 
    // ): 
    // Promise<ApiPCGResponse<PrintOrdenFactInterfaceRaw>>{
    //     const {data} = await apiPCG.get<ApiPCGResponse<PrintOrdenFactInterfaceRaw>>(`OrdenFactura/ImprimeOrdenFactura`, 
    //         {
    //             params:{
    //                 noFactura,

    //             }
    //         }
    //     )
    //     return data;
    // }

    async GetLastest(idUsuario: number): Promise<ApiPCGResponse<InvoiceOrderInterface>>{
        const {data} = await apiPCG.get<ApiPCGResponse<InvoiceOrderInterface>>(`OrdenFactura/ObtenerUltimaOrden/${idUsuario}`)
        return data;
    }

    async GetCurrency(): Promise<ApiPCGResponse<Currencyto[]>>{
        const {data} = await apiPCG.get<ApiPCGResponse<Currencyto[]>>
        (`Catalogos/DivisasPagos`);
        return data;
    }

    async GetTransportationCost(req: number): Promise<ApiPCGResponse<number>>{
        const {data} = await apiPCG.get<ApiPCGResponse<number>>(`Catalogos/Transporte/${req}`)

        return data;
    }

    async GetNearestBranch(req: NearestBranchRequestDto):
    Promise<ApiPCGResponse<NearestBranchResponseDto>>{
        const {data} = await apiPCG.get(`Catalogos/Sucursal/${req.latitud}/${req.longitud}`)

        return data;
    }

}

export const InvoiceOrderService = new InvoiceOrderServ();