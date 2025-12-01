import api from "@/Utils/ApiConfig";
import type { ApiResponse } from "@/Interfaces/Auth/AuthInterface";

class CartSer {
  async SendMessageLink(conversationId: number): Promise<ApiResponse<boolean>> {
    const { data } = await api.post<ApiResponse<boolean>>(
      `Cart/sendCartLink/${conversationId}`
    );
    return data;
  }
}

export const CartService = new CartSer();