import api from "@/Utils/ApiConfig";
import type { ApiResponse } from "@/Interfaces/Auth/AuthInterface";
import type { PagedResponse } from "@/Interfaces/GlobalInterface";
import type {
  UserSessionRequestDto,
  UserSessionResponseDto,
  ExportUserSessionPdfArgs,
} from "@/Interfaces/Auth/UserSession";

class UserSessionServ {
  async getById(id: number): Promise<UserSessionResponseDto> {
    const { data } = await api.get<ApiResponse<UserSessionResponseDto>>(
      `/UserSession/${id}`
    );
    return data.data;
  }

  async getAll(
    page: number,
    pageSize: number,
    globalFilter: string = ""
  ): Promise<PagedResponse<UserSessionResponseDto>> {
    const params = {
      PageNumber: page,
      PageSize: pageSize,
      globalFilter,
    };

    const { data } = await api.get<
      ApiResponse<PagedResponse<UserSessionResponseDto>>
    >("/UserSession", { params });

    return data.data;
  }

  async create(
    payload: UserSessionRequestDto
  ): Promise<UserSessionResponseDto> {
    const { data } = await api.post<ApiResponse<UserSessionResponseDto>>(
      "/UserSession",
      payload
    );
    return data.data;
  }

  async update(
    id: number,
    payload: UserSessionRequestDto
  ): Promise<UserSessionResponseDto> {
    const { data } = await api.put<ApiResponse<UserSessionResponseDto>>(
      `/UserSession/${id}`,
      payload
    );
    return data.data;
  }

  async toggle(id: number): Promise<UserSessionResponseDto> {
    const { data } = await api.patch<ApiResponse<UserSessionResponseDto>>(
      `/UserSession/${id}`
    );
    return data.data;
  }
  
  
  async exportPdf({
    sessionId,
    title = "Reporte de Sesión",
    subtitle = "",
  }: ExportUserSessionPdfArgs): Promise<void> {
    const { data, headers } = await api.get<ArrayBuffer>(
      `/UserSession/${encodeURIComponent(sessionId)}/export/pdf`,
      {
        params: { title, subtitle },
        responseType: "arraybuffer",
        headers: {
          Accept: "application/pdf",
        },
        transformResponse: [(d) => d],
        validateStatus: (s) => s >= 200 && s < 300,
      }
    );

    const blob = new Blob([data], { type: "application/pdf" });

    const cd =
      (headers["content-disposition"] ||
        headers["Content-Disposition"]) as string | undefined;

    const suggested =
      (cd && /filename\*?=(?:UTF-8'')?"?([^";]+)"?/.exec(cd)?.[1]) ||
      `user_session_${sessionId}_${new Date()
        .toISOString()
        .slice(0, 19)
        .replace(/[:T]/g, "-")}.pdf`;

    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = decodeURIComponent(suggested);
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  }

  async revokeCartTempLink(orderId: number): Promise<ApiResponse<boolean>> {
    const { data } = await api.post<ApiResponse<boolean>>(
      `/Auth/TempLink/Revoke/${orderId}`
    );

    return data;
  }
}

export const UserSessionService = new UserSessionServ();