import type { ApiResponse } from "@/Interfaces/Auth/AuthInterface";
import type { CustomMessage } from "@/Interfaces/Setting/CustomMessage";
import api from '@/Utils/ApiConfig';

class CustomMessageServ {
      async getCustomoMessageByAgent(
    ): Promise<CustomMessage[]> {
        const { data } = await api.get<ApiResponse<CustomMessage[]>>(
          '/conversations/getCustomoMessageByAgent'
        )
        return data.data
    }
}

export const CustomMessageServices = new CustomMessageServ();