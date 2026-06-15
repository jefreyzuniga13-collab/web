import { apiPCG } from "@/Utils/ApiConfig";
import type {
  CategoriaPCGInterface,
  ProductoModificadorPCGInterface,
  ProductoPCGInterface,
} from "@/Interfaces/Chat/ProductPCGInterface";
import type { ApiPCGResponse } from "@/Interfaces/Common/GlobalPCGInterface";
import { PCG_SERVICES } from "@/Constants/pcgservices";
class ProductPCGServ {

  async getAll(
    codPrecio: string = "01",
    page: number,
    pageSize: number,
    descripcion?: string,
  ): Promise<ProductoPCGInterface[]> {
    
    const activePrecio = (codPrecio && codPrecio.length > 0) ? codPrecio : "01";
    const codTipoServicio =  PCG_SERVICES.CRM;
    const opcion = 'BD';
    const codLinea = 'T'

      const { data } = await apiPCG.get<ApiPCGResponse<ProductoPCGInterface[]>>(
        `Catalogos/ListaProducto/${page}/${pageSize}/${descripcion}/${opcion}/${codLinea}/${codTipoServicio}`,
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
      const codTipoServicio = PCG_SERVICES.CRM;
      
      const { data } = await apiPCG.get<ApiPCGResponse<ProductoPCGInterface[]>>(
        `Catalogos/ProductosPorCategoria/${codCategoria}/${page}/${pageSize}/${codTipoServicio}`, 
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
    codPrecio: string
  ): Promise<ProductoModificadorPCGInterface[]> {
    const codTipoServicio = PCG_SERVICES.CRM;

      const { data } = await apiPCG.get<
        ApiPCGResponse<ProductoModificadorPCGInterface[]>
      >(`Catalogos/ModificadorOpcion/${codProducto}/${codTipoServicio}/${codPrecio}`);
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