import api from "@/Utils/ApiConfig";
import type {
  ClienteDetalleResponseDto,
  ClienteResponseDto,
  ContactLogInterface,
} from "@/Interfaces/Auth/ContactInterface";

import type { ApiResponse } from "@/Interfaces/Auth/UserInterfaces";
import type { PagedResponse } from "@/Interfaces/Common/GlobalInterface";
import type { ContactClassificationGroupProj, ContactLogProj } from "@/Interfaces/Auth/ContactLogProj";

class ContactService {
  async getAllAsync(
    filter: string,
    page: number,
    pageSize: number
  ): Promise<PagedResponse<ContactLogInterface>> {
    const { data } = await api.get<
      ApiResponse<PagedResponse<ContactLogInterface>>
    >("/ContactLogs", { params: { 
      globalFilter: filter,
      PageNumber: page,
       PageSize: pageSize } });
    return data.data;
  }

  async UpdateEcommerceUser(id: number, ecommerceUserId: number): Promise<ApiResponse<ContactLogInterface>>{
    const {data} = await api.patch<ApiResponse<ContactLogInterface>>
    (`/ContactLogs/UpdateEcommerceUserId/${id}/${ecommerceUserId}`)
    return data;
  }

   async getAllVerifiedAsync(
    page: number,
    pageSize: number
  ): Promise<PagedResponse<ContactLogInterface>> {
    const { data } = await api.get<
      ApiResponse<PagedResponse<ContactLogInterface>>
    >("/ContactLogs/verified-contacts", { params: { PageNumber: page, PageSize: pageSize } });
    return data.data;
  }

  async getContactByClientAsync(
    clientCode: string,
    page: number,
    pageSize: number
  ): Promise<PagedResponse<ContactLogInterface>> {
    const { data } = await api.get<
      ApiResponse<PagedResponse<ContactLogInterface>>
    >(`/ContactLogs/getByClient/${clientCode}`, { 
      params: { PageNumber: page, PageSize: pageSize } });
    return data.data;
  }


  // Solo recupera a los contactos del cliente
    async getContactByClientCodeAsync(
    clientCode: string,
    page: number,
    pageSize: number
  ): Promise<PagedResponse<ContactLogInterface>> {
    const { data } = await api.get<
      ApiResponse<PagedResponse<ContactLogInterface>>
    >(`/ContactLogs/getByClientCode/${clientCode}`, { 
      params: { PageNumber: page, PageSize: pageSize } });
    return data.data;
  }

  async getContactByIdAsync(id: number): Promise<ContactLogInterface> {
    const { data } = await api.get<ApiResponse<ContactLogInterface>>(
      `/contactLogs/${id}`
    );
    return data.data;
  }

    async getById(id: number): Promise<ApiResponse<ContactLogInterface>> {
    const { data } = await api.get<ApiResponse<ContactLogInterface>>(
      `/contactLogs/${id}`
    );
    return data;
  }

  async getContactByPhoneAsync(phone: string): Promise<ContactLogInterface> {
    const { data } = await api.get<ApiResponse<ContactLogInterface>>(
      `/ContactLogs/contact/${phone}`
    );

    return data.data;
  }

  async createAsync(params: ContactLogInterface): Promise<ContactLogInterface> {
    try {
      const { data } = await api.post<ApiResponse<ContactLogInterface>>(
        "/ContactLogs",
        params
      );
      return data.data;
    } catch (error) {
      console.error("Error creating contact log:", error);
      throw error;
    }
  }

  async updateContactAsync(
    params: ContactLogInterface
  ): Promise<ContactLogInterface> {
    try {
      const { data } = await api.put<ApiResponse<ContactLogInterface>>(
        `/ContactLogs/${params.id}`,
        params
      );
      return data.data;
    } catch (error) {
      console.error("Error updating system parameters:", error);
      throw error;
    }
  }

  async searchClientesAsync(filtro: string) {
    const { data } = await api.get<ApiResponse<ClienteResponseDto[]>>(
      `/innova/clientes`,
      { params: { filtro } }
    );
    return data.data;
  }

  async getClienteDetailsAsync(codCliente: string) {
    const { data } = await api.get<ApiResponse<ClienteDetalleResponseDto>>(
      `/innova/clientes/${codCliente}`
    );
    return data.data;
  }

  async verifyAndLinkAsync(id: number, codcli: string) {
    const { data } = await api.put<ApiResponse<ContactLogInterface>>(
      `/ContactLogs/verifyContact/${id}`,
      { codcli }
    );
    return data.data;
  }
  async toggleAsync(id: number): Promise<ContactLogInterface> {
    try {
      const { data } = await api.patch<ApiResponse<ContactLogInterface>>(
        `/ContactLogs/${id}`
      );
      return data.data;
    } catch (error) {
      console.error("Error toggling contact status:", error);
      throw error;
    }
  }

    async verifyNewcontact(id: number, fullName: string) {
      const encoded = encodeURIComponent(fullName);

      const { data } = await api.patch<ApiResponse<ContactLogInterface>>(
        `/ContactLogs/VerifyNewContact/${id}/${encoded}`
      );

      return data.data;
    }

    // contactos por clasificación, paginado global
      async getContactClassification(
        filter: string,
        page: number,
        pageSize: number
      ): Promise<PagedResponse<ContactLogProj>> {
        const { data } = await api.get<ApiResponse<PagedResponse<ContactLogProj>>>(
          "/ContactLogs/getContactClassification",
          {
            params: {
              globalFilter: filter,
              PageNumber: page,
              PageSize: pageSize,
            },
          }
        );

        return data.data;
      }

       //Kanban inicial: columnas con primeros N contactos por clasificación
      async getContactClassificationKanban(
        filter: string,
        itemsPerColumn: number
      ): Promise<ContactClassificationGroupProj[]> {
        const { data } = await api.get<ApiResponse<ContactClassificationGroupProj[]>>(
          "/ContactLogs/getContactClassificationKanban",
          {
            params: {
              globalFilter: filter,
              itemsPerColumn,
            },
          }
        );

        return data.data;
      }

       //Kanban cargar más: solo una columna/clasificación
      async getContactClassificationKanbanItems(
        filter: string,
        contactClassificationId: number,
        page: number,
        pageSize: number
      ): Promise<PagedResponse<ContactLogProj>> {
        const { data } = await api.get<ApiResponse<PagedResponse<ContactLogProj>>>(
          "/ContactLogs/getContactClassificationKanbanItems",
          {
            params: {
              globalFilter: filter,
              contactClassificationId,
              PageNumber: page,
              PageSize: pageSize,
            },
          }
        );

        return data.data;
      }


      async reclassifyContactsAsync(): Promise<void> {
        await api.post<ApiResponse<unknown>>(
          "/ContactLogs/reclassify"
        )
      }

      async updateFullNameAsync(
      id: number,
      newFullName: string
    ): Promise<void> {
      await api.patch<ApiResponse<unknown>>(
        `/ContactLogs/UpdateFullName/${id}`,
        {
          newFullName,
        }
      );
    }
}

export const contactService = new ContactService();