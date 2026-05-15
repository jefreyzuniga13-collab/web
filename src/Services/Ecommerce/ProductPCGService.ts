import { apiPCG } from "@/Utils/ApiConfig";
import type {
  CategoriaPCGInterface,
  ProductoModificadorPCGInterface,
  ProductoPCGInterface,
} from "@/Interfaces/Chat/ProductPCGInterface";
import type { ApiPCGResponse } from "@/Interfaces/Common/GlobalPCGInterface";
class ProductPCGServ {

  async getAll(
    codPrecio: string = "01",
    page: number,
    pageSize: number,
    descripcion?: string,
  ): Promise<ProductoPCGInterface[]> {
    
    const activePrecio = (codPrecio && codPrecio.length > 0) ? codPrecio : "01";

      const { data } = await apiPCG.get<ApiPCGResponse<ProductoPCGInterface[]>>(
        `Catalogos/ListaProducto/${page}/${pageSize}/${descripcion}/BD/T`,
         {
          params: {
            codPrecio: activePrecio 
          }
        }
     );
      return data.data;
  }

    async GetByCategory(
      codCategoria: string,
      codPrecio: string = "01",
      page: number,
      pageSize: number
    ): Promise<ProductoPCGInterface[]> {
      
      const activePrecio = (codPrecio && codPrecio.length > 0) ? codPrecio : "01";
      const { data } = await apiPCG.get<ApiPCGResponse<ProductoPCGInterface[]>>(
        `Catalogos/ProductosPorCategoria/${codCategoria}/${page}/${pageSize}`, 
        {
          params: {
            codPrecio: activePrecio
          }
        }
      );

      return data.data ?? [];
    }

  async GetByCode(codProducto: string): Promise<ProductoPCGInterface[]> {
      const { data } = await apiPCG.get<ApiPCGResponse<ProductoPCGInterface[]>>(
        `Catalogos/ProductoPorCodigo/${codProducto}`,
      );

      return data.data;
  }
  async getProductModifiers(
    codProducto: string,
  ): Promise<ProductoModificadorPCGInterface[]> {
      const { data } = await apiPCG.get<
        ApiPCGResponse<ProductoModificadorPCGInterface[]>
      >(`Catalogos/ModificadorOpcion/${codProducto}`);
      return data.data;

  }

  async GetCategories(): Promise<CategoriaPCGInterface[]> {
      const { data } = await apiPCG.get<
        ApiPCGResponse<CategoriaPCGInterface[]>
      >("Catalogos/ListaCategoria");
      return data.data;
  }
}

export const ProductPCGService = new ProductPCGServ();