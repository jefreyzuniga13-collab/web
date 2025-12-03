import {apiPCG} from '@/Utils/ApiConfig'
import type {ApiPCGResponse} from '@/Interfaces/GlobalPCGInterface'
import type {InvoiceOrderRequestDto, InvoiceOrderInterface, Currencyto, NearestBranchRequestDto, NearestBranchResponseDto} from '@/Interfaces/Fact/InvoiceOrderInterface'

class InvoiceOrderServ{
    async Create(req: InvoiceOrderRequestDto): Promise<ApiPCGResponse<InvoiceOrderRequestDto>>{
        const {data} = await apiPCG.post<ApiPCGResponse<InvoiceOrderRequestDto>>(`/api/OrdenFactura/AgregaOrdenFact`, req)

        return data;
    }

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