import type { ApiResponse } from "@/Interfaces/Auth/AuthInterface";
import type { PagedResponse } from "@/Interfaces/GlobalInterface";
import type {
    ProductCatalogRequest,
    ProductCatalogResponse
} from "@/Interfaces/Wh/ProductCatalogInterfaces";
import api from "@/Utils/ApiConfig";
import type { AxiosError } from "axios";


function formatError(error: unknown): Error {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const axiosError = error as AxiosError<ApiResponse<any>>
  const message = axiosError.response?.data?.message ?? axiosError.message
  return new Error(message)
}

class ProductCatalogServ {
  async createAsync(
    payload: ProductCatalogRequest
  ): Promise<ProductCatalogRequest> {
    const { data } = await api.post<ApiResponse<ProductCatalogRequest>>(
      "/ProductCatalog",
      payload
    );
    return data.data;
  }
  
//   async getAllAsync(): Promise<ProductCatalogResponse[]> {
//     const { data } = await api.get<ApiResponse<ProductCatalogResponse[]>>(
//       "/ProductCatalog"
//     );

//     return data.data;
//   }

    async getAllAsync(
      filter: string,
      page: number,
      pageSize: number
    ): Promise<PagedResponse<ProductCatalogResponse>> {
      try {
        const { data } = await api.get<ApiResponse<PagedResponse<ProductCatalogResponse>>>(
          '/ProductCatalog/GetAllByPagination',
          { params: { 
            globalFilter: filter,
            PageNumber: page, 
            PageSize: pageSize } }
        )
        return data.data
      } catch (error) {
        throw formatError(error)
      }
    }

    async getByIdAsync(id: number): Promise<ProductCatalogResponse> {
    try {
      const { data } = await api.get<ApiResponse<ProductCatalogResponse>>(
        `/ProductCatalog/${id}`
      )
      return data.data
    } catch (error) {
      throw formatError(error)
    }
  }

  async getByNameAsync(name: string): Promise<ProductCatalogResponse> {
    try {
      const { data } = await api.get<ApiResponse<ProductCatalogResponse>>(
        `/ProductCatalog/name/${name}`
      )
      return data.data
    } catch (error) {
      throw formatError(error)
    }
  }

  async updateAsync(id: number, payload: ProductCatalogRequest): Promise<ProductCatalogResponse> {
      try {
        const { data } = await api.put<ApiResponse<ProductCatalogResponse>>(
          `/ProductCatalog/${id}`,
          payload
        )
        return data.data
      } catch (error) {
        throw formatError(error)
      }
    }
  
    async toggleStatusAsync(
        id: number
      ): Promise<ProductCatalogResponse> {
        try {
          const { data } = await api.patch<ApiResponse<ProductCatalogResponse>>(
            `/ProductCatalog/${id}`
          )
          return data.data
        } catch (error) {
          throw formatError(error)
        }
      }
}

export const ProductCatalogService = new ProductCatalogServ();
