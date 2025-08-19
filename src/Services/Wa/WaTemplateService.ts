import type { ApiResponse } from "@/Interfaces/Auth/AuthInterface";
import type {
  WaTemplateRequestDto,
  WaTemplateResponseDto,
} from "@/Interfaces/Wh/TemplateInterface";
import type {
  SendTemplateBatchRequest,
  SendTemplateBatchResult,
} from "@/Interfaces/Wh/TemplateSendInterfaces";
import api from "@/Utils/ApiConfig";

class WaTemplateServ {
  async CreateWaTemplate(
    payload: WaTemplateRequestDto
  ): Promise<WaTemplateResponseDto> {
    const { data } = await api.post<ApiResponse<WaTemplateResponseDto>>(
      "WaTemplates",
      payload
    );

    return data.data;
  }

  async GetAllAsync(sync: boolean = false): Promise<WaTemplateResponseDto[]> {
    const { data } = await api.get<ApiResponse<WaTemplateResponseDto[]>>(
      "WaTemplates",
      {
        params: { sync },
      }
    );

    return data.data;
  }

  async SendBatchNewConversationsAsync(
    payload: SendTemplateBatchRequest
  ): Promise<SendTemplateBatchResult> {
    const { data } = await api.post<SendTemplateBatchResult>(
      "WaTemplates/send-batch-new-conversations",
      payload
    );
    return data;
  }
}

export const WaTemplateService = new WaTemplateServ();
