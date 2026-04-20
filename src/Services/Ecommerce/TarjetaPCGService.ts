import { apiPCG } from "@/Utils/ApiConfig";
import type {
    TarjetaModelInterface
} from "@/Interfaces/Ecommerce/TarjetaInterface";
import type { ApiPCGResponse } from "@/Interfaces/Common/GlobalPCGInterface";

class TarjetaPCGServ {
 async GetByUser(
    IdUsuario: string,
  ): Promise<ApiPCGResponse<TarjetaModelInterface[]>> {

      const { data } = await apiPCG.get<ApiPCGResponse<TarjetaModelInterface[]>>(
        `Tarjeta/ListaTarjetas/${IdUsuario}`,
      );

      return data;
  }

   async GetByUserAndCard(
    IdUsuario: string,
    IdTarjeta: string
  ): Promise<ApiPCGResponse<TarjetaModelInterface>> {

      const { data } = await apiPCG.get<ApiPCGResponse<TarjetaModelInterface>>(
        `Tarjeta/ListaTarjetas/${IdUsuario}/${IdTarjeta}`,
      );

      return data;
  }

    async DeleteCard(
    IdUsuario: string,
    IdTarjeta: string
  ): Promise<ApiPCGResponse<TarjetaModelInterface>>{

      const { data } = await apiPCG.put<ApiPCGResponse<TarjetaModelInterface>>(
        `Tarjeta/QuitarTarjeta/${IdUsuario}/${IdTarjeta}`,
      );

      return data;
  }

    async CreateCard(
        req: TarjetaModelInterface
    ): Promise<ApiPCGResponse<TarjetaModelInterface>>{

        const { data } = await apiPCG.post<ApiPCGResponse<TarjetaModelInterface>>(
            `Tarjeta/AgregarTarjeta/`, req,
        );
        return data;
    }
}

export const TarjetaPCGService = new TarjetaPCGServ();