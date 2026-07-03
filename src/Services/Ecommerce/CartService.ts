import api from "@/Utils/ApiConfig";
import type { ApiResponse } from "@/Interfaces/Auth/AuthInterface";
import type { SendLinkRequestDto } from "@/Interfaces/Ecommerce/SendLinkInterface";
import type { SendOrderMessage } from "@/Interfaces/Ecommerce/InvoiceOrderInterface";
import type { TempLinkResolveResponseDto } from "@/Interfaces/Common/GlobalPCGInterface";

class CartServ {
  async SendMessageLink(req: SendLinkRequestDto): Promise<ApiResponse<boolean>> {
    const { data } = await api.post<ApiResponse<boolean>>(`/Cart/sendCartLink`, req);
    return data;
  }

  async GetMessageLink(req: SendLinkRequestDto): Promise<ApiResponse<string>> {
    const { data } = await api.post<ApiResponse<string>>(`/Cart/getCartLink`, req);
    return data;
  }

  async sendOrderMessage(req: SendOrderMessage): Promise<ApiResponse<boolean>> {
    const { data } = await api.post<ApiResponse<boolean>>(`/Cart/SendOrderMessage`, req);
    return data;
  }

async resolveToken(
    token: string
  ): Promise<ApiResponse<TempLinkResolveResponseDto>> {
    const cleanToken = String(token ?? "").trim()

    const { data } = await api.post<ApiResponse<TempLinkResolveResponseDto>>(
      "/Auth/TempLink/Resolve",
      JSON.stringify(cleanToken),
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    )

    return data
  }
}

export const CartService = new CartServ();