import { apiPCG } from "@/Utils/ApiConfig";
import type { CategoriaPCGInterface } from "@/Interfaces/Chat/ProductPCGInterface";
import type { ApiPCGResponse } from "@/Interfaces/Common/GlobalPCGInterface";

class CategoryPCGyServ {
  async GetAll(): Promise<CategoriaPCGInterface[]> {
    const { data } = await apiPCG.get<ApiPCGResponse<CategoriaPCGInterface[]>>("Catalogos/ListaCategoria");
    return data.data;
  }
}

export const CategoryPCGyService = new CategoryPCGyServ();