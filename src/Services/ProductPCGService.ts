import { apiPCG } from '@/Utils/ApiConfig'
import type {
    CategoriaPCGInterface,
    ProductoModificadorPCGInterface,
    ProductoPCGInterface
}
    from '@/Interfaces/Chat/ProductPCGInterface'
import type {
    ApiPCGResponse
} from '@/Interfaces/GlobalPCGInterface'

import type { AxiosError } from 'axios'

function formatError(error: unknown): Error {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const axiosError = error as AxiosError<ApiPCGResponse<any>>;
    const message = axiosError.response?.data?.message 
    ?? axiosError.message;
    return new Error(message);
}

class ProductPCGServ {
    async getAll(): Promise<ProductoPCGInterface[]> {
        try {
            const { data } = await apiPCG.get<ApiPCGResponse<ProductoPCGInterface[]>>('Catalogos/ListaProducto');
            return data.data;
        } catch (error) {
            throw formatError(error)
        }
    }

    async GetByCategory(codGrupo: string): Promise<ProductoPCGInterface[]> {
        try {
            const { data } = await apiPCG.get<ApiPCGResponse<ProductoPCGInterface[]>>(`Catalogos/ProductosPorCategoria/${codGrupo}`);

            return data.data;
        } catch (error) {
            throw formatError(error)
        }
    }

    async GetByCode(codProducto: string): Promise<ProductoPCGInterface[]> {
        try {
            const { data } = await apiPCG.get<ApiPCGResponse<ProductoPCGInterface[]>>(`Catalogos/ProductoPorCodigo/${codProducto}`);

            return data.data;
        } catch (error) {
            throw formatError(error)
        }
    }
    async getProductModifiers(codProducto: string): Promise<ProductoModificadorPCGInterface[]> {
        try {
            const { data } = await apiPCG.get<ApiPCGResponse<ProductoModificadorPCGInterface[]>>(`Catalogos/ModificadorOpcion/${codProducto}`)
            return data.data
        } catch (error) {
            throw formatError(error)
        }
    }

    async GetCategories(): Promise<CategoriaPCGInterface[]> {
        try {
            const { data } = await apiPCG.get<ApiPCGResponse<CategoriaPCGInterface[]>>('Catalogos/ListaCategoria');
            return data.data
        } catch (error) {
            throw formatError(error)
        }
    }
}

export const ProductPCGService = new ProductPCGServ();
