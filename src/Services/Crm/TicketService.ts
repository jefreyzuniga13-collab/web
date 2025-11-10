import api from "@/Utils/ApiConfig";
import { format } from "date-fns";
import type { ApiResponse } from "@/Interfaces/Auth/AuthInterface";
import type {
  CreateTicketPayload,
  TicketCreateResult,
} from "@/Interfaces/Crm/TicketInterfaces";

class TicketServ {
  async createTicketForConversation(
    conversationId: number,
    payload: CreateTicketPayload
  ): Promise<ApiResponse<TicketCreateResult>> {
    const formData = new FormData();

    formData.append("ClientCode", payload.codCliente);
    formData.append("ContactId", String(payload.contactId));

    // Solo lo agregamos si tiene valor
    if (payload.responsibleId != null) {
      formData.append("ResponsibleId", String(payload.responsibleId));
    }

    formData.append("Title", payload.titulo);

    formData.append(
      "DueDate",
      payload.dueDate ? format(payload.dueDate, "yyyy-MM-dd") : ""
    );

    formData.append("Description", payload.descripcion);
    formData.append("Priority", payload.prioridad);

    payload.archivos.forEach((f) => formData.append("Attachments", f, f.name));

    const { data } = await api.post<ApiResponse<TicketCreateResult>>(
      `/TicketDetail/${conversationId}/tickets`,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      }
    );

    return data;
  }
}

export const TicketService = new TicketServ();