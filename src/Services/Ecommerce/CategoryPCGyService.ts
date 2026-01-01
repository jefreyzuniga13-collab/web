import { apiPCG } from '@/Utils/ApiConfig'
import type {
    CategoriaPCGInterface
}
    from '@/Interfaces/Chat/ProductPCGInterface'
import type {
    ApiPCGResponse
} from '@/Interfaces/Common/GlobalPCGInterface'

import type { AxiosError } from 'axios'

function formatError(error: unknown): Error {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const axiosError = error as AxiosError<ApiPCGResponse<any>>;
    const message = axiosError.response?.data?.message ?? axiosError.message;
    return new Error(message);
}

class CategoryPCGyServ {
        async GetAll(): Promise<CategoriaPCGInterface[]> {
            try {
                const { data } = await apiPCG.get<ApiPCGResponse<CategoriaPCGInterface[]>
                >('Catalogos/ListaCategoria');
                return data.data
            } catch (error) {
                throw formatError(error)
            }
        }
}
export const CategoryPCGyService = new CategoryPCGyServ();