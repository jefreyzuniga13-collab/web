import api from "@/Utils/ApiConfig";
import type { ApiResponse } from "@/Interfaces/Auth/AuthInterface";
import type { SendLinkRequestDto } from "@/Interfaces/Cart/SendLinkInterface";
import type { SendOrderMessage } from "@/Interfaces/Fact/InvoiceOrderInterface";

class CartSer {
  async SendMessageLink(req: SendLinkRequestDto): Promise<ApiResponse<boolean>> {
    const { data } = await api.post<ApiResponse<boolean>>(
      `/Cart/sendCartLink`, req
    );
    return data;
  }


   async sendOrderMessage(
    req: SendOrderMessage
  ): Promise<ApiResponse<boolean>> {
    const { data } = await api.post<ApiResponse<boolean>>(
      `/Cart/SendOrderMessage`,
      req
    );
    return data;
  }
}

export const CartService = new CartSer();